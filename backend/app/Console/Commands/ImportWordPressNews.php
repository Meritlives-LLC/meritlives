<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\News;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportWordPressNews extends Command
{
    /**
     * php artisan news:import-wordpress
     * php artisan news:import-wordpress --dry-run
     * php artisan news:import-wordpress --limit=10
     * php artisan news:import-wordpress --no-images   (keep original WP image URLs instead of downloading)
     *
     * Reads published posts directly out of the WordPress database (via the
     * `wordpress` connection defined in config/database.php + the WP_DB_*
     * env vars), downloads the featured image and every inline <img> in the
     * post body into local storage, rewrites the content to point at the
     * local copies, and upserts everything into the `news` table, keyed by
     * WordPress post ID (stored in `external_id`) so it's safe to re-run.
     *
     * Images are only downloaded once: if a previously-downloaded file
     * already exists for a given source URL, it's reused rather than
     * re-fetched, so re-running this command later is cheap.
     */
    protected $signature = 'news:import-wordpress
        {--dry-run : Show what would be imported without writing anything}
        {--limit= : Only process this many posts (useful for a test run)}
        {--no-images : Keep original WordPress image URLs instead of downloading them}';

    protected $description = 'Import published posts from WordPress into the news table, re-hosting images locally';

    private const IMAGE_DIR = 'news-images';

    private const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $downloadImages = ! $this->option('no-images');
        $limit = $this->option('limit');

        try {
            $wp = DB::connection('wordpress');
            $wp->getPdo();
        } catch (\Throwable) {
            $this->error('Could not connect to the WordPress database. Check WP_DB_* in your .env.');

            return self::FAILURE;
        }

        $query = $wp->table('posts')
            ->where('post_type', 'post')
            ->where('post_status', 'publish')
            ->orderBy('post_date');

        if ($limit) {
            $query->limit((int) $limit);
        }

        $posts = $query->get();

        if ($posts->isEmpty()) {
            $this->warn('No published posts found in the WordPress database.');

            return self::SUCCESS;
        }

        $this->info("Found {$posts->count()} published post(s) in WordPress.");
        if ($downloadImages && ! $dryRun) {
            $this->info('Images will be downloaded and re-hosted locally (use --no-images to skip).');
        }

        $siteUrl = rtrim((string) config('wordpress_import.site_url', 'https://meritlives.com'), '/');
        $defaultSourceName = config('wordpress_import.source_name', 'MERITLIVES');

        $bar = $this->output->createProgressBar($posts->count());
        $bar->start();

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $imageFailures = [];

        foreach ($posts as $post) {
            $bar->advance();

            if (empty(trim((string) $post->post_title))) {
                $skipped++;

                continue;
            }

            $categoryName = $wp->table('term_relationships as tr')
                ->join('term_taxonomy as tt', 'tt.term_taxonomy_id', '=', 'tr.term_taxonomy_id')
                ->join('terms as t', 't.term_id', '=', 'tt.term_id')
                ->where('tr.object_id', $post->ID)
                ->where('tt.taxonomy', 'category')
                ->value('t.name');

            $category = null;
            if ($categoryName) {
                $approvedCategorySlugs = [
                    Str::slug('Technology'),
                    Str::slug('Business'),
                    Str::slug('Insights'),
                ];

                if (in_array(Str::slug($categoryName), $approvedCategorySlugs, true)) {
                    $category = Category::query()
                        ->whereIn('slug', $approvedCategorySlugs)
                        ->where('slug', Str::slug($categoryName))
                        ->first();
                }
            }

            $featuredImageId = $wp->table('postmeta')
                ->where('post_id', $post->ID)
                ->where('meta_key', '_thumbnail_id')
                ->value('meta_value');

            $originalImageUrl = null;
            if ($featuredImageId) {
                $originalImageUrl = $wp->table('posts')
                    ->where('ID', $featuredImageId)
                    ->value('guid');
            }

            $content = (string) $post->post_content;
            $imageUrl = $originalImageUrl;

            if (! $dryRun) {
                if ($downloadImages) {
                    if ($originalImageUrl) {
                        $local = $this->downloadImage($originalImageUrl);
                        if ($local) {
                            $imageUrl = $local;
                        } else {
                            $imageFailures[] = $originalImageUrl;
                        }
                    }

                    $content = $this->rehostInlineImages($content, $imageFailures);
                }
            }

            $excerpt = $post->post_excerpt ?: Str::limit(
                trim(strip_tags((string) $post->post_content)),
                300
            );

            $sourceUrl = $post->guid ?: "{$siteUrl}/{$post->post_name}/";

            $attributes = [
                'category_id' => $category?->id,
                'title' => $post->post_title,
                'slug' => $post->post_name ?: Str::slug($post->post_title),
                'excerpt' => $excerpt,
                'content' => $content,
                'source_name' => $defaultSourceName,
                'source_url' => $sourceUrl,
                'image_url' => $imageUrl,
                'published_at' => $post->post_date,
                'status' => 'published',
                'featured' => false,
            ];

            if ($dryRun) {
                continue;
            }

            $news = News::where('external_id', (string) $post->ID)->first();

            if ($news) {
                $news->update($attributes);
                $updated++;
            } else {
                $attributes['external_id'] = (string) $post->ID;
                News::create($attributes);
                $created++;
            }
        }

        $bar->finish();
        $this->newLine(2);

        if ($dryRun) {
            $this->info("Dry run: {$posts->count()} post(s) would be processed ({$skipped} skipped for missing title).");

            return self::SUCCESS;
        }

        $this->info("Done. Created: {$created}, Updated: {$updated}, Skipped: {$skipped}.");

        if ($imageFailures) {
            $this->warn(count(array_unique($imageFailures)).' image(s) failed to download and were left pointing at their original URLs. URL details were omitted.');
            $this->warn('Re-run the command later to retry these, or fix them manually in /admin before taking WordPress offline.');
        }

        return self::SUCCESS;
    }

    /**
     * Download a single image URL into storage/app/public/news-images and
     * return its new public URL, or null on failure. Reuses an existing
     * local copy if one already exists for this exact source URL.
     */
    private function downloadImage(?string $url): ?string
    {
        if (! $url || ! $this->isAllowedImageUrl($url)) {
            return null;
        }

        try {
            $currentUrl = $url;
            $response = null;

            for ($redirect = 0; $redirect <= 3; $redirect++) {
                if (! $this->isAllowedImageUrl($currentUrl)) {
                    return null;
                }

                $response = Http::timeout(30)
                    ->withOptions(['allow_redirects' => false, 'stream' => true])
                    ->get($currentUrl);

                if (! in_array($response->status(), [301, 302, 303, 307, 308], true)) {
                    break;
                }

                $location = $response->header('Location');
                if (! is_string($location) || trim($location) === '' || $redirect === 3) {
                    return null;
                }

                $currentUrl = $this->resolveRedirectUrl($currentUrl, $location);
                if ($currentUrl === null) {
                    return null;
                }
            }

            if (! $response || ! $response->successful()) {
                return null;
            }

            $contentLength = $response->header('Content-Length');
            if (is_string($contentLength) && ctype_digit($contentLength) && (int) $contentLength > self::MAX_IMAGE_BYTES) {
                return null;
            }

            $stream = $response->toPsrResponse()->getBody();
            $body = '';
            try {
                while (! $stream->eof()) {
                    $chunk = $stream->read(8192);
                    if ($chunk === '') {
                        break;
                    }
                    $body .= $chunk;
                    if (strlen($body) > self::MAX_IMAGE_BYTES) {
                        return null;
                    }
                }
            } finally {
                $stream->close();
            }

            $imageInfo = @getimagesizefromstring($body);
            $mime = is_array($imageInfo) ? ($imageInfo['mime'] ?? '') : '';
            $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
            if (! isset($extensions[$mime])) {
                return null;
            }

            $imagePath = parse_url($currentUrl, PHP_URL_PATH) ?: '';
            $filename = Str::slug(pathinfo($imagePath, PATHINFO_FILENAME)).'-'.substr(md5($url), 0, 10).'.'.$extensions[$mime];
            $path = self::IMAGE_DIR.'/'.$filename;
            if (Storage::disk('public')->exists($path)) {
                return Storage::disk('public')->url($path);
            }

            if (! Storage::disk('public')->put($path, $body)) {
                return null;
            }

            return Storage::disk('public')->url($path);
        } catch (\Throwable) {
            return null;
        }
    }

    private function isAllowedImageUrl(string $url): bool
    {
        $parts = parse_url($url);
        if (! is_array($parts)
            || strtolower($parts['scheme'] ?? '') !== 'https'
            || isset($parts['user'])
            || isset($parts['pass'])
            || (isset($parts['port']) && $parts['port'] !== 443)) {
            return false;
        }

        $host = strtolower(rtrim($parts['host'] ?? '', '.'));
        $normalizedHost = trim($host, '[]');
        if ($normalizedHost === 'localhost'
            || str_ends_with($normalizedHost, '.localhost')
            || str_ends_with($normalizedHost, '.local')
            || str_ends_with($normalizedHost, '.internal')) {
            return false;
        }

        if (filter_var($normalizedHost, FILTER_VALIDATE_IP) !== false
            && filter_var($normalizedHost, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            return false;
        }

        $configuredHosts = config('wordpress_import.image_allowed_hosts', []);
        $allowedHosts = is_array($configuredHosts)
            ? array_map(static fn ($configuredHost): string => strtolower(trim((string) $configuredHost)), $configuredHosts)
            : [];

        return $host !== '' && in_array($host, $allowedHosts, true);
    }

    private function resolveRedirectUrl(string $currentUrl, string $location): ?string
    {
        if (filter_var($location, FILTER_VALIDATE_URL) !== false) {
            return $location;
        }

        $base = parse_url($currentUrl);
        if (! is_array($base) || empty($base['host'])) {
            return null;
        }

        if (str_starts_with($location, '//')) {
            return 'https:'.$location;
        }

        $origin = 'https://'.$base['host'].(isset($base['port']) ? ':'.$base['port'] : '');
        if (str_starts_with($location, '/')) {
            return $origin.$location;
        }

        $path = (string) ($base['path'] ?? '/');
        $directory = substr($path, 0, (int) strrpos($path, '/') + 1);

        return $origin.$directory.$location;
    }

    /**
     * Find every <img src="..."> in the post body, download each one that
     * isn't already local, and rewrite the HTML to point at the local copy.
     * Falls back to leaving the original URL in place (and recording the
     * failure) if a given image can't be fetched.
     */
    private function rehostInlineImages(string $html, array &$failures): string
    {
        if (trim($html) === '' || ! str_contains($html, '<img')) {
            return $html;
        }

        return preg_replace_callback(
            '/<img[^>]+src=["\']([^"\']+)["\']/i',
            function (array $matches) use (&$failures) {
                $originalUrl = $matches[1];
                $local = $this->downloadImage($originalUrl);

                if (! $local) {
                    $failures[] = $originalUrl;

                    return $matches[0];
                }

                return str_replace($originalUrl, $local, $matches[0]);
            },
            $html
        ) ?? $html;
    }
}
