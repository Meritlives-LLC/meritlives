<?php

namespace App\Console\Commands;

use App\Models\News;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Re-host news images from an extracted WordPress uploads directory.
 *
 * Usage: php artisan news:import-images /path/to/uploads [--dry-run]
 */
class ImportNewsImagesFromBackup extends Command
{
    private const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

    protected $signature = 'news:import-images {source : Path to the extracted wp-content/uploads folder} {--dry-run}';

    protected $description = 'Copy news featured images from a local wp-content/uploads backup into Laravel storage.';

    public function handle(): int
    {
        $source = (string) $this->argument('source');
        $sourceRoot = realpath($source);
        $dryRun = (bool) $this->option('dry-run');

        if ($sourceRoot === false || ! is_dir($sourceRoot)) {
            $this->error("Not a directory: {$source}");

            return self::FAILURE;
        }

        $articles = News::query()
            ->whereNotNull('image_url')
            ->where(fn ($q) => $q->whereNull('featured_image')->orWhere('featured_image', ''))
            ->get(['id', 'title', 'image_url', 'featured_image']);

        if ($articles->isEmpty()) {
            $this->info('No news rows need an image. Nothing to do.');

            return self::SUCCESS;
        }

        $this->info(($dryRun ? '[dry run] ' : '')."Checking {$articles->count()} article(s) against {$sourceRoot} ...");

        $copied = 0;
        $missing = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($articles as $article) {
            $relative = $this->relativeUploadPath($article->image_url);

            if ($relative === null) {
                $this->warn("Skipped [{$article->id}] {$article->title}: image URL is not a supported WordPress uploads path.");
                $skipped++;

                continue;
            }

            $candidate = $sourceRoot.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relative);
            $resolved = realpath($candidate);
            $rootPrefix = strtolower(rtrim(str_replace('\\', '/', $sourceRoot), '/').'/');
            $resolvedPath = $resolved === false ? '' : strtolower(str_replace('\\', '/', $resolved));

            if ($resolved === false || ! str_starts_with($resolvedPath, $rootPrefix)) {
                $this->warn("Skipped [{$article->id}] {$article->title}: source file is missing or outside the selected uploads directory.");
                $missing++;

                continue;
            }

            if (! is_file($resolved) || ! is_readable($resolved)) {
                $this->warn("Skipped [{$article->id}] {$article->title}: source file is not a readable file.");
                $missing++;

                continue;
            }

            $fileSize = filesize($resolved);
            if ($fileSize === false || $fileSize > self::MAX_IMAGE_BYTES) {
                $this->warn("Skipped [{$article->id}] {$article->title}: source image is unreadable or exceeds 10 MB.");
                $skipped++;

                continue;
            }

            $imageInfo = @getimagesize($resolved);
            if ($imageInfo === false || ! in_array($imageInfo['mime'] ?? '', ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], true)) {
                $this->warn("Skipped [{$article->id}] {$article->title}: source is not a supported image file.");
                $skipped++;

                continue;
            }

            $extension = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                'image/webp' => 'webp',
            ][$imageInfo['mime']];
            $destination = 'news-images/'.$this->withImageExtension($relative, $extension);

            try {
                if (! $dryRun) {
                    $stream = fopen($resolved, 'rb');

                    if ($stream === false) {
                        throw new \RuntimeException('Source image could not be opened.');
                    }

                    try {
                        $stored = Storage::disk('public')->put($destination, $stream);
                    } finally {
                        fclose($stream);
                    }

                    if (! $stored) {
                        throw new \RuntimeException('Public storage rejected the image.');
                    }

                    $article->update(['featured_image' => $destination]);
                }
            } catch (\Throwable $exception) {
                $this->error("Image import failed for article {$article->id} (".$exception::class.').');
                $this->warn('If storage succeeded before the database update failed, the copied file may need manual review.');
                $failed++;

                continue;
            }

            $this->line("[{$article->id}] {$article->title} -> {$destination}");
            $copied++;
        }

        $this->info(($dryRun ? '[dry run] ' : '')."Done. {$copied} copied, {$missing} missing, {$skipped} skipped (unsupported URL), {$failed} failed.");

        return $failed > 0 || $missing > 0 || $skipped > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function relativeUploadPath(string $imageUrl): ?string
    {
        $path = parse_url($imageUrl, PHP_URL_PATH);

        if (! is_string($path)) {
            return null;
        }

        $path = rawurldecode($path);
        $marker = '/wp-content/uploads/';
        $position = strpos($path, $marker);

        if ($position === false) {
            return null;
        }

        $relative = substr($path, $position + strlen($marker));

        if ($relative === '' || str_contains($relative, "\0") || str_contains($relative, '\\')) {
            return null;
        }

        $segments = explode('/', $relative);

        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..' || ! preg_match('/^[\pL\pN ._()+-]+$/u', $segment)) {
                return null;
            }
        }

        return implode('/', $segments);
    }

    private function withImageExtension(string $relativePath, string $extension): string
    {
        $directory = dirname($relativePath);
        $filename = pathinfo($relativePath, PATHINFO_FILENAME) ?: 'image';
        $safeFilename = $filename.'.'.$extension;

        return $directory === '.' ? $safeFilename : $directory.'/'.$safeFilename;
    }
}
