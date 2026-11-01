<?php

namespace App\Services\AiStudio;

use App\Models\AiAuditEvent;
use App\Models\AiGenerationJob;
use App\Models\AiPromptTemplate;
use App\Models\BlogPost;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;
use Throwable;

class AiStudioManager
{
    public function __construct(private readonly AiGenerationProvider $provider) {}

    public function createJob(int $actorId, array $input): AiGenerationJob
    {
        $this->authorize($actorId, 'create_ai_generations');
        $validated = Validator::make($input, [
            'type' => ['required', 'in:article,image'],
            'prompt' => ['required', 'string', 'min:10', 'max:50000'],
            'instructions' => ['nullable', 'string', 'max:10000'],
            'prompt_template_id' => ['nullable', 'integer', 'exists:ai_prompt_templates,id'],
        ])->validate();
        if (! empty($validated['prompt_template_id']) && ! AiPromptTemplate::query()->whereKey($validated['prompt_template_id'])->where('is_active', true)->exists()) {
            throw new AiStudioException('The selected prompt template is unavailable.');
        }

        try { app(\App\Support\AiRequestGuard::class)->createJob($actorId); }
        catch (\App\Support\AiRequestLimitException $e) { throw new AiStudioException($e->getMessage()); }
        return DB::transaction(fn () => AiGenerationJob::create([
            'type' => $validated['type'],
            'status' => AiGenerationJob::STATUS_DRAFT,
            'prompt' => trim($validated['prompt']),
            'instructions' => isset($validated['instructions']) ? trim($validated['instructions']) : null,
            'prompt_template_id' => $validated['prompt_template_id'] ?? null,
            'requested_by' => $actorId,
        ]));
    }

    public function generate(AiGenerationJob $job, int $actorId): AiGenerationJob
    {
        $this->authorize($actorId, 'create_ai_generations');
        try {
            return app(\App\Support\AiRequestGuard::class)->run($actorId, fn () => $this->generateForUser($job, $actorId));
        } catch (\App\Support\AiRequestLimitException $e) { throw new AiStudioException($e->getMessage()); }
    }

    private function generateForUser(AiGenerationJob $job, int $actorId): AiGenerationJob
    {
        $lock = Cache::lock('ai-studio-generation:'.$job->id, max(60, (int) config('ai_studio.timeout_seconds', 45) + 30));
        if (! $lock->get()) {
            throw new AiStudioException('This job is already generating. Wait for it to finish.');
        }
        try {
            // Other requests may have completed since the caller loaded this model.
            $job->refresh();
            return $this->generatePreview($job, $actorId);
        } finally {
            $lock->release();
        }
    }

    private function generatePreview(AiGenerationJob $job, int $actorId): AiGenerationJob
    {
        if (! config('ai_studio.enabled') || config('ai_studio.provider', 'none') === 'none') {
            throw new AiStudioException('AI generation is unavailable. It is disabled or no provider is configured.');
        }
        if (! in_array($job->status, [AiGenerationJob::STATUS_DRAFT, AiGenerationJob::STATUS_FAILED], true)) {
            throw new AiStudioException('Only draft or failed jobs can be generated.');
        }
        $key = 'ai-studio:'.$actorId;
        if (RateLimiter::tooManyAttempts($key, (int) config('ai_studio.generation_limit_per_minute', 5))) {
            throw new AiStudioException('Generation rate limit reached. Please try again later.');
        }
        RateLimiter::hit($key, 60);

        $oldStatus = $job->status;
        AiAuditEvent::record($job->id, $actorId, 'generation.started', $oldStatus, $oldStatus, ['type' => $job->type]);
        try {
            if ($job->type === AiGenerationJob::TYPE_ARTICLE) {
                $result = $this->provider->generateArticle($job->prompt, $job->instructions);
                foreach (['title', 'slug', 'excerpt', 'body'] as $required) {
                    if (! is_string($result[$required] ?? null) || trim($result[$required]) === '') {
                        throw new AiStudioException('The provider returned an incomplete article preview.');
                    }
                }
                $sanitizer = new HtmlSanitizer((new HtmlSanitizerConfig())->allowSafeElements()->allowRelativeLinks()->allowRelativeMedias()->withMaxInputLength(1_000_000));
                $job->fill([
                    'result_title' => mb_substr(trim($result['title']), 0, 255),
                    'result_slug' => Str::slug($result['slug']) ?: Str::slug($result['title']),
                    'result_excerpt' => trim($result['excerpt']),
                    'result_body' => $sanitizer->sanitize($result['body']),
                ]);
                if (BlogPost::query()->where('slug', $job->result_slug)->exists()) {
                    $job->result_slug = mb_substr($job->result_slug, 0, 220).'-ai-'.$job->id;
                }
            } elseif ($job->type === AiGenerationJob::TYPE_IMAGE) {
                $result = $this->provider->generateImage($job->prompt, $job->instructions);
                $this->validateImage($result['bytes'] ?? null, $result['mime'] ?? null);
                $extension = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$result['mime']];
                $path = 'ai-studio/previews/'.Str::uuid().'.'.$extension;
                if (! Storage::disk('local')->put($path, $result['bytes'])) {
                    throw new AiStudioException('The image preview could not be stored.');
                }
                $job->fill(['preview_path' => $path, 'preview_mime' => $result['mime'], 'preview_size' => strlen($result['bytes'])]);
            } else {
                throw new AiStudioException('Unknown generation job type.');
            }

            DB::transaction(function () use ($job, $actorId, $oldStatus): void {
                $job->fill([
                    'provider' => mb_substr((string) config('ai_studio.provider', 'none'), 0, 100),
                    'model' => is_string(config('ai_studio.model')) ? mb_substr(config('ai_studio.model'), 0, 150) : null,
                    'status' => AiGenerationJob::STATUS_AWAITING_REVIEW,
                    'failure_message' => null,
                ])->save();
                AiAuditEvent::record($job->id, $actorId, 'generation.completed', $oldStatus, $job->status, ['type' => $job->type, 'provider' => $job->provider, 'model' => $job->model]);
            });
        } catch (Throwable $exception) {
            if ($job->type === AiGenerationJob::TYPE_IMAGE && isset($path) && Storage::disk('local')->exists($path)) {
                Storage::disk('local')->delete($path);
            }
            \Illuminate\Support\Facades\Log::warning('AI Studio generation failed.', [
                'job_id' => $job->id,
                'error_type' => $exception::class,
            ]);
            $safeMessage = $exception instanceof AiStudioException
                ? $exception->getMessage()
                : 'Generation failed. Check server logs for the internal error.';
            DB::transaction(function () use ($job, $actorId, $oldStatus, $safeMessage, $exception): void {
                $job->fill(['status' => AiGenerationJob::STATUS_FAILED, 'failure_message' => $safeMessage])->save();
                AiAuditEvent::record($job->id, $actorId, 'generation.failed', $oldStatus, $job->status, ['type' => $job->type, 'error_type' => $exception::class]);
            });
        }

        return $job->refresh();
    }

    public function review(AiGenerationJob $job, int $actorId, bool $approve, ?string $notes = null): AiGenerationJob
    {
        $this->authorize($actorId, 'review_ai_generations');
        Validator::make(['notes' => $notes], ['notes' => ['nullable', 'string', 'max:5000']])->validate();
        if (! $approve && trim((string) $notes) === '') {
            throw new AiStudioException('A rejection reason is required.');
        }
        if ($job->status !== AiGenerationJob::STATUS_AWAITING_REVIEW) {
            throw new AiStudioException('Only jobs awaiting review can be approved or rejected.');
        }
        if ($approve && $job->type === AiGenerationJob::TYPE_IMAGE) {
            if (! is_string($job->preview_path) || ! preg_match('~^ai-studio/previews/[0-9a-f-]{36}\.(jpg|png|webp)$~i', $job->preview_path)) {
                throw new AiStudioException('The stored image preview path is invalid.');
            }
            $bytes = Storage::disk('local')->exists($job->preview_path) ? Storage::disk('local')->get($job->preview_path) : null;
            $this->validateImage($bytes, $job->preview_mime);
            $extension = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$job->preview_mime];
            $path = 'ai-generated/'.Str::uuid().'.'.$extension;
            if (! Storage::disk('public')->put($path, $bytes)) {
                throw new AiStudioException('The approved image could not be stored.');
            }
            $job->approved_image_path = $path;
        }
        $from = $job->status;
        try {
            DB::transaction(function () use ($job, $actorId, $approve, $notes, $from): void {
                $job->fill([
                    'status' => $approve ? AiGenerationJob::STATUS_APPROVED : AiGenerationJob::STATUS_REJECTED,
                    'reviewed_by' => $actorId,
                    'reviewed_at' => now(),
                    'review_notes' => $notes,
                ])->save();
                AiAuditEvent::record($job->id, $actorId, $approve ? 'review.approved' : 'review.rejected', $from, $job->status, []);
            });
        } catch (Throwable $exception) {
            if ($approve && $job->type === AiGenerationJob::TYPE_IMAGE && isset($path)) {
                Storage::disk('public')->delete($path);
            }
            throw $exception;
        }

        return $job->refresh();
    }

    public function createBlogDraft(AiGenerationJob $job, int $actorId): BlogPost
    {
        $this->authorize($actorId, 'create_blog');
        if ($job->type !== AiGenerationJob::TYPE_ARTICLE || $job->status !== AiGenerationJob::STATUS_APPROVED) {
            throw new AiStudioException('Only approved article jobs can create a blog draft.');
        }
        if ($job->associated_model || $job->associated_id) {
            throw new AiStudioException('This job is already associated with editorial content.');
        }
        $post = DB::transaction(function () use ($job, $actorId): BlogPost {
            $post = BlogPost::create([
                'user_id' => $actorId,
                'title' => $job->result_title,
                'slug' => $job->result_slug,
                'excerpt' => $job->result_excerpt,
                'content' => $job->result_body,
                'status' => 'draft',
                'featured' => false,
            ]);
            $job->update(['associated_model' => BlogPost::class, 'associated_id' => $post->id]);
            AiAuditEvent::record($job->id, $actorId, 'editorial.blog_draft_created', $job->status, $job->status, ['blog_post_id' => $post->id]);
            return $post;
        });

        return $post;
    }

    public function attachImageToBlogPost(AiGenerationJob $job, BlogPost $post, int $actorId): void
    {
        $this->authorize($actorId, 'manage_media');
        $this->authorize($actorId, 'edit_blog');
        if ($job->type !== AiGenerationJob::TYPE_IMAGE || $job->status !== AiGenerationJob::STATUS_APPROVED || ! $job->approved_image_path) {
            throw new AiStudioException('Only approved image jobs can be attached to a blog post.');
        }
        DB::transaction(function () use ($job, $post, $actorId): void {
            $post->update(['featured_image' => $job->approved_image_path]);
            $job->update(['associated_model' => BlogPost::class, 'associated_id' => $post->id]);
            AiAuditEvent::record($job->id, $actorId, 'image.attached_to_blog_post', $job->status, $job->status, ['blog_post_id' => $post->id]);
        });
    }

    private function validateImage(mixed $bytes, mixed $declaredMime): void
    {
        if (! is_string($bytes) || $bytes === '' || strlen($bytes) > (int) config('ai_studio.image_max_bytes')) {
            throw new AiStudioException('Image data is empty or exceeds the configured size limit.');
        }
        $info = @getimagesizefromstring($bytes);
        $allowed = config('ai_studio.image_allowed_mimes', []);
        $pixelCount = is_array($info) ? ((int) ($info[0] ?? 0) * (int) ($info[1] ?? 0)) : 0;
        if (! is_array($info) || ! in_array($info['mime'] ?? null, $allowed, true) || $info['mime'] !== $declaredMime
            || (int) ($info[0] ?? 0) < 1 || (int) ($info[1] ?? 0) < 1 || $pixelCount > (int) config('ai_studio.image_max_pixels')) {
            throw new AiStudioException('The provider result is not a supported, valid image.');
        }
    }

    private function authorize(int $actorId, string $permission): void
    {
        $user = auth()->user();
        if (! $user || (int) $user->getAuthIdentifier() !== $actorId || ! $user->can($permission)) {
            throw new AiStudioException('You are not authorized to perform this AI Studio action.');
        }
    }
}
