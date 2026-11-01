<?php
namespace App\Http\Controllers\Admin;

use App\Models\AiGenerationJob;
use App\Services\AiImages\FeatureImageService;

class FeatureImagePreviewController
{
    public function __invoke(AiGenerationJob $job, FeatureImageService $service)
    {
        try { $bytes = $service->preview($job); }
        catch (\App\Services\AiImages\ImageException) { abort(404); }
        return response($bytes, 200, ['Content-Type' => 'image/jpeg', 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store, max-age=0']);
    }
}
