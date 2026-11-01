<?php

namespace App\Http\Controllers\Admin;

use App\Models\AiGenerationJob;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class AiStudioImagePreviewController
{
    public function __invoke(AiGenerationJob $job): Response
    {
        abort_unless(auth()->user()?->can('view_ai_studio'), 403);
        abort_unless(
            $job->type === AiGenerationJob::TYPE_IMAGE
                && is_string($job->preview_path)
                && preg_match('~^ai-studio/previews/[0-9a-f-]{36}\.(jpg|png|webp)$~i', $job->preview_path),
            404,
        );

        $disk = Storage::disk('local');
        abort_unless($disk->exists($job->preview_path), 404);

        abort_unless($disk->size($job->preview_path) <= (int) config('ai_studio.image_max_bytes'), 404);
        $bytes = $disk->get($job->preview_path);
        abort_unless(is_string($bytes) && strlen($bytes) <= (int) config('ai_studio.image_max_bytes'), 404);
        $info = @getimagesizefromstring($bytes);
        abort_unless(
            is_array($info)
                && in_array($info['mime'] ?? null, config('ai_studio.image_allowed_mimes', []), true)
                && $info['mime'] === $job->preview_mime
                && $job->preview_size === strlen($bytes),
            404,
        );

        return response($bytes, 200, [
            'Content-Type' => $info['mime'],
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
