<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AiImages\FeatureImageService;

class CleanupFeatureImagePreviews extends Command
{
    protected $signature = 'ai-images:cleanup';
    protected $description = 'Delete only expired private feature-image previews; retain Media Library and audit records.';
    public function handle(FeatureImageService $service): int { $this->info('Expired previews removed: '.$service->cleanup()); return self::SUCCESS; }
}
