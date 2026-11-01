<?php
namespace App\Services\AiImages;

use App\Models\{AiGenerationJob, AiAuditEvent, Media, News, BlogPost};
use App\Services\AiEditorial\EditorialAssistant;
use App\Support\RasterUpload;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\{Cache, DB, Log, RateLimiter, Storage, Validator};
use Illuminate\Support\Str;
use Illuminate\Validation\{Rule, ValidationException};
use Throwable;

class FeatureImageService
{
    public const TYPE = 'feature_image';
    public const PREVIEW_DIRECTORY = 'ai-studio/feature-previews';
    public const DISCLOSURE = 'AI-generated illustration, not documentary photography of an actual event.';

    public function authorize(string $type, ?int $recordId = null): void
    {
        app(EditorialAssistant::class)->authorize($type, $recordId);
        abort_unless(auth()->user()->can('manage_media'), 403);
        abort_unless(config('ai_image.enabled'), 503, 'AI feature images are disabled.');
    }

    public function generate(string $type, array $input, ?int $recordId = null): AiGenerationJob
    {
        $this->authorize($type, $recordId);
        try {
            return app(\App\Support\AiRequestGuard::class)->run((int) auth()->id(),
                fn () => $this->generateImage($type, $input, $recordId));
        } catch (\App\Support\AiRequestLimitException $e) {
            throw new ImageException($e->getMessage(), 'quota');
        }
    }

    private function generateImage(string $type, array $input, ?int $recordId): AiGenerationJob
    {
        if (! \Illuminate\Support\Facades\Schema::hasColumn('media', 'metadata')) throw new ImageException('Apply the approved Media metadata migration before enabling image generation.', 'configuration');
        $input = Validator::make($input, [
            'method' => ['required', Rule::in(['article','custom'])], 'title' => 'required_if:method,article|nullable|string|max:255',
            'excerpt' => 'nullable|string|max:1000', 'body' => 'nullable|string|max:16000', 'category' => 'nullable|string|max:255',
            'custom_prompt' => 'required_if:method,custom|nullable|string|min:10|max:2000',
            'style' => ['required', Rule::in(array_keys(config('ai_image.styles')))],
            'aspect_ratio' => ['required', Rule::in(array_keys(config('ai_image.sizes')))],
            'authorize_cost' => 'nullable|boolean',
        ])->validate();
        if (config('ai_image.provider') === 'openai' && (! config('ai_image.allow_billable') || ! ($input['authorize_cost'] ?? false))) {
            throw ValidationException::withMessages(['authorize_cost' => 'A billable request requires administrator enablement and your explicit confirmation.']);
        }
        app(ImageProcessor::class)->ready();
        $prompt = app(ImagePromptBuilder::class)->build($input);
        if (mb_strlen($prompt) > 8000) throw ValidationException::withMessages(['custom_prompt' => 'The combined image prompt is too long. Shorten the article context or prompt.']);
        $provider = app(ImageProvider::class);
        $actor = auth()->id(); $lock = Cache::lock('feature-image-user:'.$actor, 180);
        if (! $lock->get()) throw ValidationException::withMessages(['custom_prompt' => 'An image request is already running. Wait for it to finish.']);
        try {
            foreach (['minute' => [config('ai_image.per_minute'),60], 'day' => [config('ai_image.per_day'),86400]] as $window => [$limit,$seconds]) {
                if (RateLimiter::tooManyAttempts('feature-image:'.$window.':'.$actor, max(1, $limit))) {
                    throw ValidationException::withMessages(['custom_prompt' => 'Image generation limit reached. Try later; the article is unchanged.']);
                }
            }
            foreach (['minute' => 60, 'day' => 86400] as $window => $seconds) RateLimiter::hit('feature-image:'.$window.':'.$actor, $seconds);
            $job = AiGenerationJob::create(['type' => self::TYPE, 'status' => 'draft', 'prompt' => $prompt,
                'requested_by' => $actor, 'provider' => config('ai_image.provider'), 'model' => config('ai_image.provider') === 'mock' ? 'deterministic-mock' : config('ai_image.model'),
                'associated_model' => $type === 'news' ? News::class : BlogPost::class, 'associated_id' => $recordId,
                'result_metadata' => ['style' => $input['style'], 'aspect_ratio' => $input['aspect_ratio'],
                    'expires_at' => now()->addMinutes(config('ai_image.preview_minutes'))->timestamp, 'ai_generated' => true,
                    'disclosure' => config('ai_image.provider') === 'mock' ? 'MOCK TEST IMAGE. '.self::DISCLOSURE : self::DISCLOSURE]]);
            $path = null;
            try {
                $bytes = $provider->generate($prompt, config('ai_image.sizes.'.$input['aspect_ratio']), (bool) ($input['authorize_cost'] ?? false));
                $bytes = app(ImageProcessor::class)->normalize($bytes, $input['aspect_ratio']);
                $path = self::PREVIEW_DIRECTORY.'/'.Str::uuid().'.jpg';
                if (! Storage::disk('local')->put($path, $bytes)) throw new ImageException('The image preview could not be stored.', 'storage');
                $job->update(['status' => 'awaiting_review', 'preview_path' => $path, 'preview_mime' => 'image/jpeg', 'preview_size' => strlen($bytes),
                    'result_metadata' => $job->result_metadata + ['sha256' => hash('sha256', $bytes)]]);
                AiAuditEvent::record($job->id, $actor, 'feature_image.generated', 'draft', 'awaiting_review', ['provider' => $job->provider, 'style' => $input['style'], 'aspect_ratio' => $input['aspect_ratio']]);
                return $job;
            } catch (Throwable $error) {
                if ($path) Storage::disk('local')->delete($path);
                $safe = $error instanceof ImageException ? $error : new ImageException('Image generation failed. Your article is unchanged.');
                $job->update(['status' => 'failed', 'failure_message' => $safe->getMessage()]);
                AiAuditEvent::record($job->id, $actor, 'feature_image.failed', 'draft', 'failed', ['reason' => $safe->reason]);
                Log::warning('Feature image generation failed', ['job_id' => $job->id, 'reason' => $safe->reason]);
                throw $safe;
            }
        } finally { $lock->release(); }
    }

    public function job(int $id, string $type, ?int $recordId = null): AiGenerationJob
    {
        $this->authorize($type, $recordId);
        $job = AiGenerationJob::findOrFail($id);
        abort_unless($job->type === self::TYPE && (int) $job->requested_by === (int) auth()->id()
            && $job->associated_model === ($type === 'news' ? News::class : BlogPost::class)
            && ($job->associated_id === null ? null : (int) $job->associated_id) === $recordId, 403);
        return $job;
    }

    public function preview(AiGenerationJob $job): string
    {
        $type = $job->associated_model === News::class ? 'news' : 'blog';
        $job = $this->job($job->id, $type, $job->associated_id);
        abort_unless(in_array($job->status, ['awaiting_review','approved'], true) && ($job->result_metadata['expires_at'] ?? 0) > now()->timestamp, 410, 'Image preview expired. Generate again.');
        abort_unless(is_string($job->preview_path) && preg_match('~^ai-studio/feature-previews/[a-f0-9-]{36}\.jpg$~', $job->preview_path), 404);
        $disk = Storage::disk('local'); abort_unless($disk->exists($job->preview_path), 404);
        abort_unless($disk->size($job->preview_path) <= config('ai_image.max_bytes'), 404);
        $bytes = $disk->get($job->preview_path); $info = app(ImageProcessor::class)->inspect($bytes);
        abort_unless($info['mime'] === 'image/jpeg' && $job->preview_mime === 'image/jpeg'
            && strlen($bytes) === $job->preview_size && hash_equals($job->result_metadata['sha256'] ?? '', hash('sha256', $bytes)), 404);
        return $bytes;
    }

    public function storeMedia(int $jobId, string $type, ?int $recordId, string $alt): Media
    {
        $job = $this->job($jobId, $type, $recordId);
        $alt = trim(strip_tags($alt));
        Validator::make(['alt_text' => $alt], ['alt_text' => 'required|string|max:255'])->validate();
        $bytes = $this->preview($job);
        return Cache::lock('feature-image-media:'.$jobId, 15)->block(3, function () use ($job, $bytes, $alt) {
            $job->refresh();
            if ($id = $job->result_metadata['media_id'] ?? null) {
                $media = Media::findOrFail($id);
                abort_unless($media->metadata['generation_job_id'] === $job->id, 409);
                $media->update(['alt_text' => $alt]);
                return $media;
            }
            $temp = tempnam(sys_get_temp_dir(), 'meritlives-ai-image-');
            $path = null;
            try {
                file_put_contents($temp, $bytes);
                $path = RasterUpload::store(new UploadedFile($temp, 'ai-feature.jpg', 'image/jpeg', null, true), 'general');
                $info = app(ImageProcessor::class)->inspect($bytes);
                return DB::transaction(function () use ($job, $path, $bytes, $info, $alt) {
                    $media = Media::create(['name' => ($job->provider === 'mock' ? '[MOCK] ' : '').'AI-generated feature illustration',
                        'path' => $path, 'disk' => 'public', 'mime_type' => 'image/jpeg', 'size' => strlen($bytes), 'width' => $info[0], 'height' => $info[1], 'alt_text' => $alt,
                        'metadata' => ['ai_generated' => true, 'disclosure' => $job->result_metadata['disclosure'], 'provider' => $job->provider,
                            'style' => $job->result_metadata['style'], 'aspect_ratio' => $job->result_metadata['aspect_ratio'], 'generation_job_id' => $job->id]]);
                    $job->update(['status' => 'approved', 'approved_image_path' => $path, 'reviewed_by' => auth()->id(), 'reviewed_at' => now(),
                        'result_metadata' => $job->result_metadata + ['media_id' => $media->id]]);
                    AiAuditEvent::record($job->id, auth()->id(), 'feature_image.saved_to_media', 'awaiting_review', 'approved', ['media_id' => $media->id]);
                    return $media;
                });
            } catch (Throwable $e) { if ($path) Storage::disk('public')->delete($path); throw $e; }
            finally { if (is_file($temp)) unlink($temp); }
        });
    }

    public function discard(int $id, string $type, ?int $recordId = null): void
    {
        $job = $this->job($id, $type, $recordId);
        $this->deletePreview($job);
        AiAuditEvent::record($id, auth()->id(), 'feature_image.preview_discarded', $job->status, $job->status);
    }

    private function deletePreview(AiGenerationJob $job): void
    {
        if (is_string($job->preview_path) && preg_match('~^ai-studio/feature-previews/[a-f0-9-]{36}\.jpg$~', $job->preview_path)) Storage::disk('local')->delete($job->preview_path);
        $job->update(['preview_path' => null]);
    }

    public function cleanup(): int
    {
        $count = 0;
        AiGenerationJob::where('type', self::TYPE)->whereNotNull('preview_path')->orderBy('id')->chunkById(100, function ($jobs) use (&$count) {
            foreach ($jobs as $job) if (($job->result_metadata['expires_at'] ?? 0) <= now()->timestamp) {
                $this->deletePreview($job); $count++;
            }
        });
        // Also remove abandoned files from interrupted requests, without touching older AI Studio previews.
        $disk = Storage::disk('local');
        $cutoff = now()->timestamp - config('ai_image.preview_minutes') * 60 - config('ai_image.timeout_seconds') - 120;
        foreach ($disk->files(self::PREVIEW_DIRECTORY) as $path) {
            if (preg_match('~^ai-studio/feature-previews/[a-f0-9-]{36}\.jpg$~', $path) && $disk->lastModified($path) < $cutoff) { $disk->delete($path); $count++; }
        }
        return $count;
    }
}
