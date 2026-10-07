<?php

namespace App\Console\Commands;

use App\Models\BlogPost;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Downloads each blog post's externally-hosted featured image (e.g. left
 * over from the WordPress migration, still pointing at the old site) and
 * re-saves it under this app's own "public" disk storage/blogs/, then
 * rewrites the DB column to the new relative path.
 *
 * Usage:
 *   php artisan blog:rehost-images            (does the work)
 *   php artisan blog:rehost-images --dry-run   (lists what would change, no writes)
 */
class RehostBlogImages extends Command
{
    protected $signature = 'blog:rehost-images {--dry-run}';

    protected $description = 'Download external blog_posts.featured_image URLs into local storage and rewrite the column to the new path.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $posts = BlogPost::query()
            ->whereNotNull('featured_image')
            ->where('featured_image', 'like', 'http%')
            ->get(['id', 'title', 'featured_image']);

        if ($posts->isEmpty()) {
            $this->info('No blog posts have an external (http/https) featured_image. Nothing to do.');

            return self::SUCCESS;
        }

        $this->info(($dryRun ? '[dry run] ' : '')."Found {$posts->count()} post(s) with an external image.");

        $ok = 0;
        $failed = 0;

        foreach ($posts as $post) {
            $url = $post->featured_image;

            try {
                $response = Http::timeout(20)->retry(2, 500)->get($url);

                if (! $response->successful()) {
                    throw new \RuntimeException("HTTP {$response->status()}");
                }

                $extension = $this->guessExtension($url, $response->header('Content-Type'));
                $filename = 'blogs/'.Str::uuid().'.'.$extension;

                if (! $dryRun) {
                    Storage::disk('public')->put($filename, $response->body());
                    $post->update(['featured_image' => $filename]);
                }

                $this->line(" ✓ [{$post->id}] {$post->title} -> {$filename}");
                $ok++;
            } catch (\Throwable $e) {
                $this->warn(" ✗ [{$post->id}] {$post->title} -- {$url} -- {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info(($dryRun ? '[dry run] ' : '')."Done. {$ok} succeeded, {$failed} failed.");

        if ($failed > 0) {
            $this->warn('Posts that failed still have their original (external) URL, so nothing is broken further; re-run the command once the source is reachable, or set featured_image manually from the admin panel.');
        }

        return self::SUCCESS;
    }

    private function guessExtension(string $url, ?string $contentType): string
    {
        $fromUrl = pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION);
        if (in_array(strtolower($fromUrl), ['jpg', 'jpeg', 'png', 'gif', 'webp'], true)) {
            return strtolower($fromUrl);
        }

        return match (true) {
            str_contains((string) $contentType, 'png') => 'png',
            str_contains((string) $contentType, 'gif') => 'gif',
            str_contains((string) $contentType, 'webp') => 'webp',
            default => 'jpg',
        };
    }
}