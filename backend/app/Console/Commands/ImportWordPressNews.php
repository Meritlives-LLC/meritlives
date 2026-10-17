<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\News;
use App\Services\NewsHeadlineDeduplicator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportWordPressNews extends Command
{
    protected $signature = 'news:import-wordpress
        {--dry-run : Show what would be imported without writing anything}
        {--limit= : Only process this many posts (useful for a test run)}
        {--no-images : Keep original WordPress image URLs instead of downloading them}';

    protected $description = 'Import published WordPress posts as pending editorial drafts';

    private const IMAGE_DIR = 'news-images';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $downloadImages = ! $this->option('no-images');
        $limit = $this->option('limit');

        try {
            $wp = DB::connection('wordpress');
            $wp->getPdo();
        } catch (\Throwable $e) {
            $this->error('Could not connect to the WordPress database. Check WP_DB_* in your .env.');
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $query = $wp->table('posts')->where('post_type', 'post')->where('post_status', 'publish')->orderBy('post_date');
        if ($limit) $query->limit((int) $limit);
        $posts = $query->get();

        if ($posts->isEmpty()) {
            $this->warn('No published posts found in the WordPress database.');
            return self::SUCCESS;
        }

        $this->info("Found {$posts->count()} published post(s) in WordPress. They will be imported as pending drafts.");
        $siteUrl = rtrim(env('WP_SITE_URL', 'https://meritlives.com'), '/');
        $defaultSourceName = env('WP_IMPORT_SOURCE_NAME', 'MERITLIVES');
        $bar = $this->output->createProgressBar($posts->count());
        $bar->start();
        $created = $updated = $skipped = 0;
        $imageFailures = [];

        foreach ($posts as $post) {
            $bar->advance();
            if (empty(trim((string) $post->post_title))) { $skipped++; continue; }

            $categoryName = $wp->table('term_relationships as tr')
                ->join('term_taxonomy as tt', 'tt.term_taxonomy_id', '=', 'tr.term_taxonomy_id')
                ->join('terms as t', 't.term_id', '=', 'tt.term_id')
                ->where('tr.object_id', $post->ID)->where('tt.taxonomy', 'category')->value('t.name');

            $category = null;
            if ($categoryName) {
                $approvedCategorySlugs = [Str::slug('Technology'), Str::slug('Business'), Str::slug('Digital Innovation')];
                if (in_array(Str::slug($categoryName), $approvedCategorySlugs, true)) {
                    $category = Category::query()->whereIn('slug', $approvedCategorySlugs)->where('slug', Str::slug($categoryName))->first();
                }
            }

            $featuredImageId = $wp->table('postmeta')->where('post_id', $post->ID)->where('meta_key', '_thumbnail_id')->value('meta_value');
            $originalImageUrl = $featuredImageId ? $wp->table('posts')->where('ID', $featuredImageId)->value('guid') : null;
            $content = (string) $post->post_content;
            $imageUrl = $originalImageUrl;

            if (! $dryRun && $downloadImages) {
                if ($originalImageUrl) {
                    $local = $this->downloadImage($originalImageUrl);
                    if ($local) $imageUrl = $local; else $imageFailures[] = $originalImageUrl;
                }
                $content = $this->rehostInlineImages($content, $imageFailures);
            }

            $excerpt = $post->post_excerpt ?: Str::limit(trim(strip_tags((string) $post->post_content)), 300);
            $sourceUrl = $post->guid ?: "{$siteUrl}/{$post->post_name}/";
            $attributes = [
                'category_id' => $category?->id, 'title' => $post->post_title,
                'slug' => $post->post_name ?: Str::slug($post->post_title), 'excerpt' => $excerpt,
                'content' => $content, 'source_name' => $defaultSourceName, 'source_url' => $sourceUrl,
                'image_url' => $imageUrl, 'published_at' => $post->post_date, 'featured' => false,
            ];

            if ($dryRun) continue;
            $news = News::where('external_id', (string) $post->ID)->first();
            if ($news) {
                if ($news->status === 'pending' && in_array($news->editorial_status, ['draft', 'needs_work'], true)) {
                    $news->update($attributes);
                    $updated++;
                } else {
                    $skipped++;
                }
            } else {
                $duplicate = app(NewsHeadlineDeduplicator::class)->findDuplicate((string) $post->post_title);
                if ($duplicate) {
                    $skipped++;
                    continue;
                }

                $attributes['external_id'] = (string) $post->ID;
                $attributes['status'] = 'pending';
                $attributes['editorial_status'] = 'draft';
                News::create($attributes);
                $created++;
            }
        }

        $bar->finish(); $this->newLine(2);
        if ($dryRun) {
            $this->info("Dry run: {$posts->count()} post(s) would be processed ({$skipped} skipped for missing title).");
            return self::SUCCESS;
        }
        $this->info("Done. Created: {$created}, Updated: {$updated}, Skipped/duplicates: {$skipped}.");
        if ($imageFailures) {
            $this->warn(count($imageFailures).' image(s) failed to download and were left pointing at the original WordPress URL:');
            foreach (array_unique($imageFailures) as $url) $this->line("  - {$url}");
        }
        return self::SUCCESS;
    }

    private function downloadImage(?string $url): ?string
    {
        if (! $url || ! $this->isAllowedImageUrl($url)) return null;

        $maxBytes = 5 * 1024 * 1024;
        $currentUrl = $url;
        $response = null;

        try {
            // Redirects are followed manually so every destination is validated.
            for ($redirect = 0; $redirect <= 3; $redirect++) {
                if (! $this->isAllowedImageUrl($currentUrl)) return null;

                $response = Http::timeout(30)->withOptions([
                    'allow_redirects' => false,
                    'progress' => static function ($downloadTotal, $downloadedBytes) use ($maxBytes): void {
                        if ($downloadedBytes > $maxBytes || ($downloadTotal > 0 && $downloadTotal > $maxBytes)) {
                            throw new \RuntimeException('Image download exceeds the 5 MB limit.');
                        }
                    },
                ])->get($currentUrl);

                if (! in_array($response->status(), [301, 302, 303, 307, 308], true)) break;
                $location = $response->header('Location');
                if (! is_string($location) || trim($location) === '' || $redirect === 3) return null;
                $currentUrl = $this->resolveRedirectUrl($currentUrl, $location);
                if (! $currentUrl) return null;
            }

            if (! $response || ! $response->successful()) return null;
            $bytes = $response->body();
            if ($bytes === '' || strlen($bytes) > $maxBytes) return null;

            $imageInfo = @getimagesizefromstring($bytes);
            $mime = is_array($imageInfo) ? ($imageInfo['mime'] ?? '') : '';
            $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
            if (! isset($extensions[$mime])) return null;

            $filename = Str::slug(pathinfo(parse_url($currentUrl, PHP_URL_PATH) ?? '', PATHINFO_FILENAME))
                .'-'.substr(hash('sha256', $url), 0, 12).'.'.$extensions[$mime];
            $path = self::IMAGE_DIR.'/'.$filename;
            if (! Storage::disk('public')->exists($path)) {
                Storage::disk('public')->put($path, $bytes);
            }
            return Storage::disk('public')->url($path);
        } catch (\Throwable) {
            return null;
        }
    }

    private function isAllowedImageUrl(string $url): bool
    {
        if (filter_var($url, FILTER_VALIDATE_URL) === false) return false;
        $parts = parse_url($url);
        if (! is_array($parts)
            || strtolower((string) ($parts['scheme'] ?? '')) !== 'https'
            || empty($parts['host'])
            || isset($parts['user'])
            || isset($parts['pass'])) {
            return false;
        }

        $host = strtolower(rtrim((string) $parts['host'], '.'));
        if ($host === 'localhost' || str_ends_with($host, '.localhost')
            || str_ends_with($host, '.local') || str_ends_with($host, '.internal')) {
            return false;
        }

        if (filter_var($host, FILTER_VALIDATE_IP) !== false
            && filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            return false;
        }

        $allowedHosts = config('wordpress_import.image_allowed_hosts', []);
        $allowedHosts = array_map(static fn ($allowed): string => strtolower(trim((string) $allowed)), $allowedHosts);
        return in_array($host, $allowedHosts, true);
    }

    private function resolveRedirectUrl(string $currentUrl, string $location): ?string
    {
        if (filter_var($location, FILTER_VALIDATE_URL) !== false) return $location;

        $base = parse_url($currentUrl);
        if (! is_array($base) || empty($base['host'])) return null;
        if (str_starts_with($location, '//')) return 'https:'.$location;

        $origin = 'https://'.$base['host'].(isset($base['port']) ? ':'.$base['port'] : '');
        if (str_starts_with($location, '/')) return $origin.$location;

        $path = (string) ($base['path'] ?? '/');
        $directory = substr($path, 0, (int) strrpos($path, '/') + 1);
        return $origin.$directory.$location;
    }

    private function rehostInlineImages(string $html, array &$failures): string
    {
        if (trim($html) === '' || ! str_contains($html, '<img')) return $html;
        return preg_replace_callback("/<img[^>]+src=[\"']([^\"']+)[\"']/i",  function (array $matches) use (&$failures) {
            $originalUrl = $matches[1];
            $local = $this->downloadImage($originalUrl);
            if (! $local) { $failures[] = $originalUrl; return $matches[0]; }
            return str_replace($originalUrl, $local, $matches[0]);
        }, $html) ?? $html;
    }
}
