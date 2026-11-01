<?php

namespace App\Console\Commands;

use App\Models\BlogPost;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/** Re-host approved MERITLIVES blog images on the public storage disk. */
class RehostBlogImages extends Command
{
    private const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

    protected $signature = 'blog:rehost-images {--dry-run}';

    protected $description = 'Download external blog featured images into local storage.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $posts = BlogPost::query()
            ->whereNotNull('featured_image')
            ->where('featured_image', 'like', 'http%')
            ->get(['id', 'title', 'featured_image']);

        $failed = 0;

        foreach ($posts as $post) {
            $url = $post->featured_image;

            if (! $this->isAllowedImageUrl($url)) {
                $this->warn("Skipped [{$post->id}] {$post->title}: image URL is not an approved HTTPS MERITLIVES URL.");
                $failed++;

                continue;
            }

            try {
                $response = Http::timeout(20)
                    ->withOptions(['allow_redirects' => false, 'stream' => true])
                    ->get($url);

                if (! $response->successful()) {
                    throw new \RuntimeException("HTTP {$response->status()}");
                }

                $contentType = strtolower(trim(explode(';', (string) $response->header('Content-Type'))[0]));
                $extensions = [
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'image/gif' => 'gif',
                    'image/webp' => 'webp',
                ];

                if (! isset($extensions[$contentType])) {
                    throw new \RuntimeException('Response is not a supported image type.');
                }

                $contentLength = $response->header('Content-Length');
                if (is_string($contentLength) && ctype_digit($contentLength) && (int) $contentLength > self::MAX_IMAGE_BYTES) {
                    throw new \RuntimeException('Image response exceeds 10 MB.');
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
                            throw new \RuntimeException('Image response exceeds 10 MB.');
                        }
                    }
                } finally {
                    $stream->close();
                }

                if ($body === '') {
                    throw new \RuntimeException('Image response is empty or exceeds 10 MB.');
                }

                $imageInfo = @getimagesizefromstring($body);

                if ($imageInfo === false || image_type_to_mime_type($imageInfo[2]) !== $contentType) {
                    throw new \RuntimeException('Response body does not match its declared image type.');
                }

                $filename = 'blogs/'.Str::uuid().'.'.$extensions[$contentType];

                if (! $dryRun) {
                    if (! Storage::disk('public')->put($filename, $body)) {
                        throw new \RuntimeException('Could not write image to public storage.');
                    }

                    $post->update(['featured_image' => $filename]);
                }

                $this->line("[{$post->id}] {$post->title} -> {$filename}");
            } catch (\Throwable $exception) {
                $this->warn("Failed [{$post->id}] {$post->title} (".$exception::class."). The external reference was left unchanged.");
                $this->warn('If storage completed before the database update failed, a copied file may need manual review.');
                $failed++;
            }
        }

        $this->info(($dryRun ? '[dry run] ' : '').'Finished blog image rehosting.');

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function isAllowedImageUrl(string $url): bool
    {
        $parts = parse_url($url);

        return is_array($parts)
            && strtolower($parts['scheme'] ?? '') === 'https'
            && in_array(strtolower($parts['host'] ?? ''), ['meritlives.com', 'www.meritlives.com'], true)
            && ! isset($parts['user'])
            && ! isset($parts['pass'])
            && (! isset($parts['port']) || $parts['port'] === 443);
    }
}
