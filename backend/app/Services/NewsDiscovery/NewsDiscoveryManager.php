<?php

namespace App\Services\NewsDiscovery;

use App\Models\AiAuditEvent;
use App\Models\AiGenerationJob;
use App\Models\AiPromptTemplate;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\News;
use App\Models\NewsDiscovery;
use App\Models\NewsDiscoveryEvent;
use App\Models\NewsSource;
use App\Models\User;
use App\Services\AiStudio\AiStudioException;
use App\Services\AiStudio\AiStudioManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Throwable;

class NewsDiscoveryManager
{
    public function __construct(
        private readonly RssFeedParser $parser,
        private readonly NewsDiscoveryUrlPolicy $urlPolicy,
        private readonly NewsRewriteProvider $rewriteProvider,
    ) {}

    public function refresh(NewsSource $source, ?int $actorId = null): int
    {
        if ($actorId !== null) {
            $this->authorize($actorId, 'refresh_news_sources');
            $key = 'news-discovery-refresh:'.$actorId;
            if (RateLimiter::tooManyAttempts($key, (int) config('news_discovery.refresh_limit_per_minute', 3))) {
                throw new NewsDiscoveryException('The refresh rate limit was reached. Try again later.');
            }
            RateLimiter::hit($key, 60);
        }

        if ($source->type !== 'rss' || ! $this->urlPolicy->feedUrlIsAllowed($source->feed_url)) {
            $this->recordFetchFailure($source, 'Feed URL is not permitted by the configured HTTPS host allowlist.', $actorId);
            throw new NewsDiscoveryException('This feed URL is not permitted. Check the approved HTTPS host allowlist.');
        }
        if (! $source->enabled) {
            throw new NewsDiscoveryException('This source is disabled. Enable it before refreshing.');
        }

        try {
            $maxBytes = (int) config('news_discovery.max_feed_bytes', 1_500_000);
            $response = Http::connectTimeout((int) config('news_discovery.connect_timeout_seconds', 4))
                ->timeout((int) config('news_discovery.timeout_seconds', 12))
                ->withOptions([
                    'allow_redirects' => false,
                    'stream' => true,
                    'on_headers' => static function (\Psr\Http\Message\ResponseInterface $headers) use ($maxBytes): void {
                        $length = $headers->getHeaderLine('Content-Length');
                        if ($length !== '' && ctype_digit($length) && (int) $length > $maxBytes) {
                            throw new NewsDiscoveryException('The feed exceeds the configured response size limit.');
                        }
                    },
                    'progress' => static function (int $downloadTotal, int $downloaded) use ($maxBytes): void {
                        if ($downloaded > $maxBytes) {
                            throw new NewsDiscoveryException('The feed exceeds the configured response size limit.');
                        }
                    },
                ])
                ->get($source->feed_url);
            if ($response->status() >= 300 && $response->status() < 400) {
                throw new NewsDiscoveryException('The feed returned a redirect, which is not followed.');
            }
            if (! $response->successful()) {
                throw new NewsDiscoveryException('The feed returned HTTP '.$response->status().'.');
            }

            $xml = $this->readBoundedBody($response);
            $feed = $this->parser->parse($xml);
            $count = 0;
            $limit = (int) config('news_discovery.max_items_per_feed', 100);
            foreach ($feed->channel->item as $item) {
                if ($count >= $limit) {
                    break;
                }
                if ($this->storeItem($source, $item)) {
                    $count++;
                }
            }

            $source->forceFill([
                'last_fetched_at' => now(),
                'last_successful_fetch_at' => now(),
                'last_error' => null,
            ])->save();
            return $count;
        } catch (Throwable $exception) {
            $safe = $exception instanceof NewsDiscoveryException
                ? $exception->getMessage()
                : 'Feed request failed safely ('.class_basename($exception).').';
            $this->recordFetchFailure($source, $safe, $actorId);
            throw new NewsDiscoveryException($safe);
        }
    }

    public function requestRewrite(NewsDiscovery $discovery, int $actorId): AiGenerationJob
    {
        $this->authorize($actorId, 'rewrite_news_discoveries');
        if (! config('ai_studio.enabled') || config('ai_studio.provider', 'none') === 'none') {
            throw new NewsDiscoveryException('AI rewriting is unavailable. It is disabled or no provider is configured.');
        }
        if (! in_array($discovery->status, [NewsDiscovery::STATUS_DISCOVERED, NewsDiscovery::STATUS_FAILED], true)
            || $discovery->duplicate_of_id || $discovery->duplicate_news_id) {
            throw new NewsDiscoveryException('This discovery is not eligible for rewriting.');
        }
        if (! filled($discovery->source_excerpt)) {
            throw new NewsDiscoveryException('No permitted source excerpt is available to prepare a rewrite.');
        }

        $template = AiPromptTemplate::query()->where('slug', 'news-rewrite')->where('is_active', true)->first();
        $rewriteInput = [
            'original_headline' => $discovery->original_title,
            'source_name' => $discovery->source_name,
            'source_url' => $discovery->source_url,
            'source_published_at' => $discovery->source_published_at?->toIso8601String(),
            'retrieved_at' => $discovery->retrieved_at?->toIso8601String(),
            'permitted_source_excerpt' => $discovery->source_excerpt,
                'matched_category' => $discovery->matched_category_name,
            'prompt_template_name' => $template?->name,
            'prompt_template_slug' => $template?->slug,
            'prompt_template_version' => $template?->version,
            'prompt_template' => $template?->prompt ? mb_substr($template->prompt, 0, 50000) : null,
            'prompt_template_instructions' => $template?->instructions ? mb_substr($template->instructions, 0, 10000) : null,
        ];
        $job = AiGenerationJob::create([
            'type' => AiGenerationJob::TYPE_ARTICLE,
            'status' => AiGenerationJob::STATUS_DRAFT,
            'prompt' => 'Editorial rewrite of discovery #'.$discovery->id.PHP_EOL.json_encode($rewriteInput, JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'instructions' => 'Use the saved discovery source fields only. Preserve attribution and flag unsupported details.',
            'requested_by' => $actorId,
            'prompt_template_id' => $template?->id,
            'prompt_template_version' => $template?->version,
            'associated_model' => NewsDiscovery::class,
            'associated_id' => $discovery->id,
        ]);
        $from = $discovery->status;
        $discovery->forceFill(['status' => NewsDiscovery::STATUS_REWRITE_IN_PROGRESS])->save();
        NewsDiscoveryEvent::record($discovery->id, $actorId, 'rewrite.started', $from, $discovery->status, ['job_id' => $job->id]);

        $phase = 'provider';
        try {
            $structured = $this->rewriteProvider->rewrite($rewriteInput);
            $phase = 'validation';
            $validated = $this->validateRewrite($structured);
            $metadata = [
                'seo_title' => $validated['seo_title'],
                'meta_description' => $validated['meta_description'],
                'verification_flags' => $validated['verification_flags'],
                'category_id' => $discovery->category_id,
                'matched_category_name' => $discovery->matched_category_name,
                'attribution' => [
                    'source_name' => $discovery->source_name,
                    'source_url' => $discovery->source_url,
                    'published_at' => $discovery->source_published_at?->toIso8601String(),
                ],
            ];
            $body = '<p>'.e($validated['lead']).'</p>'.implode('', array_map(static fn (string $paragraph): string => '<p>'.e($paragraph).'</p>', $validated['paragraphs']));
            $providerName = $this->safeIdentifier($structured['provider'] ?? null, 100) ?? $this->safeIdentifier(config('ai_studio.provider'), 100);
            $modelName = $this->safeIdentifier($structured['model'] ?? null, 150) ?? $this->safeIdentifier(config('ai_studio.model'), 150);
            $job->forceFill([
                'status' => AiGenerationJob::STATUS_AWAITING_REVIEW,
                'provider' => $providerName,
                'model' => $modelName,
                'result_title' => $validated['headline'],
                'result_slug' => $validated['slug'],
                'result_excerpt' => $validated['lead'],
                'result_body' => $body,
                'result_metadata' => $metadata,
            ])->save();
            AiAuditEvent::record($job->id, $actorId, 'rewrite.ready_for_review', AiGenerationJob::STATUS_DRAFT, AiGenerationJob::STATUS_AWAITING_REVIEW, [
                'discovery_id' => $discovery->id,
                'prompt_template_version' => $job->prompt_template_version,
                'provider' => $job->provider,
                'model' => $job->model,
            ]);
            $discovery->forceFill(['rewrite_job_id' => $job->id, 'status' => NewsDiscovery::STATUS_REWRITE_READY])->save();
            NewsDiscoveryEvent::record($discovery->id, $actorId, 'rewrite.ready_for_review', NewsDiscovery::STATUS_REWRITE_IN_PROGRESS, $discovery->status, ['job_id' => $job->id]);
            return $job;
        } catch (Throwable $exception) {
            $safe = $exception instanceof InvalidNewsRewriteResponse
                ? $exception->getMessage()
                : ($phase === 'validation' && $exception instanceof NewsDiscoveryException
                    ? $exception->getMessage()
                    : 'The rewrite could not be completed safely.');
            $job->forceFill(['status' => AiGenerationJob::STATUS_FAILED, 'failure_message' => mb_substr($safe, 0, 500)])->save();
            AiAuditEvent::record($job->id, $actorId, 'rewrite.failed', AiGenerationJob::STATUS_DRAFT, AiGenerationJob::STATUS_FAILED);
            $discovery->forceFill(['rewrite_job_id' => $job->id, 'status' => NewsDiscovery::STATUS_FAILED])->save();
            NewsDiscoveryEvent::record($discovery->id, $actorId, 'rewrite.failed', NewsDiscovery::STATUS_REWRITE_IN_PROGRESS, $discovery->status);
            throw new NewsDiscoveryException($safe);
        }
    }

    public function reviewRewrite(NewsDiscovery $discovery, int $actorId, bool $approve, ?string $notes, array $edits = []): void
    {
        $this->authorize($actorId, 'review_news_discoveries');
        if ($discovery->status !== NewsDiscovery::STATUS_REWRITE_READY || ! $discovery->rewriteJob) {
            throw new NewsDiscoveryException('Only a rewrite awaiting review can be reviewed.');
        }
        $job = $discovery->rewriteJob;
        if ($job->status !== AiGenerationJob::STATUS_AWAITING_REVIEW) {
            throw new NewsDiscoveryException('The rewrite job is not awaiting review.');
        }
        if ($edits) {
            $validated = $this->validateRewrite([
                'headline' => $edits['headline'] ?? $job->result_title,
                'slug' => $edits['slug'] ?? $job->result_slug,
                'lead' => $edits['lead'] ?? $job->result_excerpt,
                'paragraphs' => $edits['paragraphs'] ?? $this->paragraphsFromHtml($job->result_body),
                'seo_title' => $edits['seo_title'] ?? data_get($job->result_metadata, 'seo_title'),
                'meta_description' => $edits['meta_description'] ?? data_get($job->result_metadata, 'meta_description'),
                'verification_flags' => $edits['verification_flags'] ?? data_get($job->result_metadata, 'verification_flags', []),
            ]);
            $body = '<p>'.e($validated['lead']).'</p>'.implode('', array_map(static fn (string $paragraph): string => '<p>'.e($paragraph).'</p>', $validated['paragraphs']));
            $metadata = $job->result_metadata ?? [];
            $metadata['seo_title'] = $validated['seo_title'];
            $metadata['meta_description'] = $validated['meta_description'];
            $metadata['verification_flags'] = $validated['verification_flags'];
            $job->forceFill(['result_title' => $validated['headline'], 'result_slug' => $validated['slug'], 'result_excerpt' => $validated['lead'], 'result_body' => $body, 'result_metadata' => $metadata])->save();
        }

        $to = $approve ? NewsDiscovery::STATUS_APPROVED_FOR_DRAFT : NewsDiscovery::STATUS_REJECTED;
        DB::transaction(function () use ($discovery, $job, $actorId, $approve, $notes, $to, $edits): void {
            $job->forceFill([
                'status' => $approve ? AiGenerationJob::STATUS_APPROVED : AiGenerationJob::STATUS_REJECTED,
                'reviewed_by' => $actorId,
                'reviewed_at' => now(),
                'review_notes' => $notes ? mb_substr($notes, 0, 5000) : null,
            ])->save();
            AiAuditEvent::record($job->id, $actorId, $approve ? 'rewrite.approved' : 'rewrite.rejected', AiGenerationJob::STATUS_AWAITING_REVIEW, $job->status, ['editorial_edits_saved' => (bool) $edits]);
            $discovery->forceFill(['status' => $to, 'reviewed_by' => $actorId, 'reviewed_at' => now(), 'review_notes' => $notes ? mb_substr($notes, 0, 5000) : null])->save();
            NewsDiscoveryEvent::record($discovery->id, $actorId, $approve ? 'rewrite.approved_for_draft' : 'rewrite.rejected', NewsDiscovery::STATUS_REWRITE_READY, $to);
        });
    }

    public function createDraft(NewsDiscovery $discovery, int $actorId, string $destination): News|BlogPost
    {
        $permission = $destination === 'news' ? 'create_news' : 'create_blog';
        $this->authorize($actorId, $permission);
        if ($discovery->status !== NewsDiscovery::STATUS_APPROVED_FOR_DRAFT || ! $discovery->rewriteJob
            || $discovery->rewriteJob->status !== AiGenerationJob::STATUS_APPROVED) {
            throw new NewsDiscoveryException('Approve the rewrite before creating an unpublished draft.');
        }
        if ($discovery->draft_id && $discovery->draft_model) {
            return $discovery->draft_model === News::class
                ? News::findOrFail($discovery->draft_id)
                : BlogPost::findOrFail($discovery->draft_id);
        }

        $job = $discovery->rewriteJob;
        $slug = $this->uniqueSlug((string) $job->result_slug, $destination);
        return DB::transaction(function () use ($discovery, $actorId, $destination, $job, $slug): News|BlogPost {
            if ($destination === 'news') {
                $existing = News::query()->where('source_url', $discovery->source_url)
                    ->when($discovery->external_id, fn ($query) => $query->orWhere('external_id', $discovery->external_id))
                    ->first();
                if ($existing) {
                    throw new NewsDiscoveryException('A News record already uses this source identity; review that record instead of creating a duplicate.');
                }
                $draft = News::create([
                    'category_id' => $discovery->category_id,
                    'title' => $job->result_title,
                    'slug' => $slug,
                    'excerpt' => $job->result_excerpt,
                    'content' => $job->result_body,
                    'seo_title' => data_get($job->result_metadata, 'seo_title'),
                    'seo_description' => data_get($job->result_metadata, 'meta_description'),
                    'source_name' => $discovery->source_name,
                    'source_url' => $discovery->source_url,
                    // Legacy News.external_id is VARCHAR(255); the complete
                    // feed identifier remains preserved on this discovery.
                    'external_id' => $discovery->external_id ? mb_substr($discovery->external_id, 0, 255) : null,
                    'published_at' => null,
                    'status' => 'pending',
                    'featured' => false,
                ]);
            } else {
                $draft = BlogPost::create([
                    'user_id' => $actorId,
                    'category_id' => $discovery->category_id,
                    'title' => $job->result_title,
                    'slug' => $slug,
                    'excerpt' => $job->result_excerpt,
                    'content' => $job->result_body,
                    'status' => 'draft',
                    'published_at' => null,
                    'seo_title' => data_get($job->result_metadata, 'seo_title'),
                    'seo_description' => data_get($job->result_metadata, 'meta_description'),
                    'canonical_url' => $discovery->canonical_url,
                    'featured' => false,
                ]);
            }

            $discovery->forceFill(['status' => NewsDiscovery::STATUS_DRAFT_SAVED, 'draft_model' => $draft::class, 'draft_id' => $draft->id])->save();
            $job->forceFill(['associated_model' => $draft::class, 'associated_id' => $draft->id])->save();
            NewsDiscoveryEvent::record($discovery->id, $actorId, 'editorial.unpublished_draft_created', NewsDiscovery::STATUS_APPROVED_FOR_DRAFT, $discovery->status, ['destination' => $destination, 'draft_id' => $draft->id]);
            AiAuditEvent::record($job->id, $actorId, 'editorial.unpublished_draft_created', $job->status, $job->status, ['model' => $draft::class, 'draft_id' => $draft->id]);
            return $draft;
        });
    }

    public function createImageJob(NewsDiscovery $discovery, int $actorId, array $input): AiGenerationJob
    {
        $this->authorize($actorId, 'create_ai_generations');
        $validated = Validator::make($input, [
            'prompt' => ['required', 'string', 'min:10', 'max:50000'],
            'instructions' => ['nullable', 'string', 'max:10000'],
        ])->validate();
        if (! in_array($discovery->status, [NewsDiscovery::STATUS_REWRITE_READY, NewsDiscovery::STATUS_APPROVED_FOR_DRAFT, NewsDiscovery::STATUS_DRAFT_SAVED], true)) {
            throw new NewsDiscoveryException('Create an article rewrite before requesting an associated image.');
        }
        if ($discovery->image_job_id) {
            throw new NewsDiscoveryException('This discovery already has an associated image job.');
        }
        $job = app(AiStudioManager::class)->createJob($actorId, ['type' => 'image', ...$validated]);
        $job->forceFill(['associated_model' => NewsDiscovery::class, 'associated_id' => $discovery->id])->save();
        $discovery->forceFill(['image_job_id' => $job->id])->save();
        NewsDiscoveryEvent::record($discovery->id, $actorId, 'image.job_created', $discovery->status, $discovery->status, ['job_id' => $job->id]);
        return $job;
    }

    public function attachApprovedImage(NewsDiscovery $discovery, int $actorId): void
    {
        $this->authorize($actorId, 'manage_media');
        if (! $discovery->draft_id || ! $discovery->draft_model || ! $discovery->imageJob
            || $discovery->status !== NewsDiscovery::STATUS_DRAFT_SAVED
            || $discovery->imageJob->type !== AiGenerationJob::TYPE_IMAGE
            || $discovery->imageJob->status !== AiGenerationJob::STATUS_APPROVED
            || ! is_string($discovery->imageJob->approved_image_path)
            || ! preg_match('~^ai-generated/[0-9a-f-]{36}\.(jpg|png|webp)$~i', $discovery->imageJob->approved_image_path)
            || ! \Illuminate\Support\Facades\Storage::disk('public')->exists($discovery->imageJob->approved_image_path)) {
            throw new NewsDiscoveryException('An approved image and saved draft are required before attachment.');
        }
        if ($discovery->draft_model === News::class) {
            $this->authorize($actorId, 'edit_news');
            $draft = News::findOrFail($discovery->draft_id);
            if ($draft->status === 'published') { throw new NewsDiscoveryException('Images can only be attached to an unpublished draft.'); }
            $draft->update(['featured_image' => $discovery->imageJob->approved_image_path]);
        } elseif ($discovery->draft_model === BlogPost::class) {
            $this->authorize($actorId, 'edit_blog');
            $draft = BlogPost::findOrFail($discovery->draft_id);
            if ($draft->status === 'published') { throw new NewsDiscoveryException('Images can only be attached to an unpublished draft.'); }
            $draft->update(['featured_image' => $discovery->imageJob->approved_image_path]);
        } else {
            throw new NewsDiscoveryException('The linked draft type is unsupported.');
        }
        NewsDiscoveryEvent::record($discovery->id, $actorId, 'image.attached_to_unpublished_draft', $discovery->status, $discovery->status, ['job_id' => $discovery->imageJob->id]);
        AiAuditEvent::record($discovery->imageJob->id, $actorId, 'image.attached_to_unpublished_draft', $discovery->imageJob->status, $discovery->imageJob->status, ['draft_model' => $discovery->draft_model, 'draft_id' => $discovery->draft_id]);
    }

    public function refreshEnabledSources(): int
    {
        $refreshed = 0;
        NewsSource::query()->where('enabled', true)->orderBy('id')->each(function (NewsSource $source) use (&$refreshed): void {
            try {
                $this->refresh($source);
                $refreshed++;
            } catch (Throwable) {
                // Each source records a bounded safe error; one bad feed must not stop later feeds.
            }
        });
        return $refreshed;
    }

    private function storeItem(NewsSource $source, \SimpleXMLElement $item): bool
    {
        $title = trim(strip_tags((string) $item->title));
        $url = trim((string) $item->link);
        $canonical = $this->urlPolicy->canonicalize($url);
        if ($title === '' || mb_strlen($title) > 255 || ! $canonical) {
            return false;
        }
        $guid = trim((string) $item->guid);
        $externalId = $guid !== '' ? mb_substr($guid, 0, 2000) : null;
        $canonicalHash = hash('sha256', $canonical);
        $sourceIdentityHash = hash('sha256', $source->id.'|'.($externalId ?: $canonical));
        $existing = NewsDiscovery::query()->where('news_source_id', $source->id)
            ->where(fn ($query) => $query->where('source_identity_hash', $sourceIdentityHash)->orWhere('canonical_url_hash', $canonicalHash))
            ->first();
        if ($existing) {
            return false;
        }

        $description = trim(html_entity_decode(strip_tags((string) $item->description), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        $excerpt = Str::limit(preg_replace('/\s+/u', ' ', $description) ?: '', (int) config('news_discovery.max_excerpt_length', 1200), '');
        $publishedAt = null;
        if ((string) $item->pubDate !== '') {
            try { $publishedAt = \Carbon\Carbon::parse((string) $item->pubDate); } catch (Throwable) { $publishedAt = null; }
        }
        $duplicate = NewsDiscovery::query()->where('canonical_url_hash', $canonicalHash)->first();
        $existingNews = News::query()->where('source_url', $url)->when($externalId, fn ($query) => $query->orWhere('external_id', $externalId))->first();
        $category = $this->matchCategory($source, $title.' '.$excerpt);
        $status = $duplicate || $existingNews ? NewsDiscovery::STATUS_DUPLICATE : NewsDiscovery::STATUS_DISCOVERED;

        $discovery = NewsDiscovery::query()->create([
            'news_source_id' => $source->id,
            'category_id' => $category?->id,
            'matched_category_name' => $category?->name,
            'source_name' => $source->name,
            'source_url' => $url,
            'canonical_url' => $canonical,
            'canonical_url_hash' => $canonicalHash,
            'external_id' => $externalId,
            'source_identity_hash' => $sourceIdentityHash,
            'original_title' => $title,
            'source_published_at' => $publishedAt,
            'retrieved_at' => now(),
            'source_excerpt' => $excerpt !== '' ? $excerpt : null,
            'status' => $status,
            'duplicate_of_id' => $duplicate?->id,
            'duplicate_news_id' => $existingNews?->id,
        ]);
        NewsDiscoveryEvent::record($discovery->id, null, $status === NewsDiscovery::STATUS_DUPLICATE ? 'discovery.duplicate' : 'discovery.created', null, $status, [
            'source_id' => $source->id,
            'canonical_url_hash' => $canonicalHash,
        ]);
        return true;
    }

    private function matchCategory(NewsSource $source, string $text): ?Category
    {
        $categories = $source->categories()->where('categories.type', 'news')->where('categories.status', 'active')->orderBy('categories.id')->get();
        if ($categories->count() === 1) {
            return $categories->first();
        }
        $normalized = mb_strtolower($text);
        $scores = [];
        foreach ($categories as $category) {
            $labels = array_unique(array_filter([$category->name, str_replace('-', ' ', $category->slug)]));
            $score = 0;
            foreach ($labels as $label) {
                $label = mb_strtolower(trim($label));
                if ($label !== '' && str_contains($normalized, $label)) {
                    $score += 3;
                }
                foreach (preg_split('/\W+/u', $label) ?: [] as $token) {
                    if (mb_strlen($token) >= 4 && preg_match('/\b'.preg_quote($token, '/').'\b/u', $normalized)) {
                        $score++;
                    }
                }
            }
            if ($score > 0) { $scores[$category->id] = [$score, $category]; }
        }
        if (! $scores) { return null; }
        usort($scores, static fn (array $a, array $b): int => $b[0] <=> $a[0]);
        if (isset($scores[1]) && $scores[0][0] === $scores[1][0]) { return null; }
        return $scores[0][1];
    }

    private function validateRewrite(array $input): array
    {
        $validator = Validator::make($input, [
            'headline' => ['required', 'string', 'min:8', 'max:200'],
            'lead' => ['required', 'string', 'min:20', 'max:1000'],
            'paragraphs' => ['required', 'array', 'min:2', 'max:20'],
            'paragraphs.*' => ['required', 'string', 'min:20', 'max:2500'],
            'slug' => ['required', 'string', 'min:3', 'max:180'],
            'seo_title' => ['required', 'string', 'min:8', 'max:70'],
            'meta_description' => ['required', 'string', 'min:30', 'max:170'],
            'verification_flags' => ['present', 'array', 'max:20'],
            'verification_flags.*' => ['required', 'string', 'min:3', 'max:400'],
        ]);
        if ($validator->fails()) {
            throw new NewsDiscoveryException('The rewrite response did not meet the required editorial structure.');
        }
        $value = $validator->validated();
        $plain = static fn (string $text): string => trim(preg_replace('/\s+/u', ' ', strip_tags($text)) ?: '');
        $value['headline'] = $plain($value['headline']);
        $value['lead'] = $plain($value['lead']);
        $value['paragraphs'] = array_map($plain, $value['paragraphs']);
        $value['slug'] = Str::slug($plain($value['slug']));
        $value['seo_title'] = $plain($value['seo_title']);
        $value['meta_description'] = $plain($value['meta_description']);
        $value['verification_flags'] = array_map($plain, $value['verification_flags']);
        $value['verification_flags'] = array_values(array_filter($value['verification_flags']));
        if ($value['headline'] === '' || mb_strlen($value['headline']) < 8 || $value['lead'] === '' || mb_strlen($value['lead']) < 20
            || $value['seo_title'] === '' || mb_strlen($value['seo_title']) < 8 || $value['meta_description'] === '' || mb_strlen($value['meta_description']) < 30
            || count(array_filter($value['paragraphs'], static fn (string $paragraph): bool => $paragraph !== '' && mb_strlen($paragraph) >= 20)) < 2
            || mb_strlen(implode(' ', $value['paragraphs'])) > 20000 || $value['slug'] === '') {
            throw new NewsDiscoveryException('The rewrite response exceeds the allowed content limits.');
        }
        return $value;
    }

    private function paragraphsFromHtml(?string $body): array
    {
        if (! is_string($body)) { return []; }
        preg_match_all('~<p>(.*?)</p>~s', $body, $matches);
        $paragraphs = array_map(static fn (string $p): string => trim(html_entity_decode(strip_tags($p), ENT_QUOTES | ENT_HTML5, 'UTF-8')), $matches[1] ?? []);
        return array_slice(array_values(array_filter($paragraphs)), 1);
    }

    private function uniqueSlug(string $slug, string $destination): string
    {
        $base = Str::slug($slug) ?: 'news-story';
        $model = $destination === 'news' ? News::class : BlogPost::class;
        $candidate = mb_substr($base, 0, 160);
        for ($suffix = 2; $model::query()->where('slug', $candidate)->exists(); $suffix++) {
            $candidate = mb_substr($base, 0, 150).'-'.$suffix;
        }
        return $candidate;
    }

    private function safeIdentifier(mixed $value, int $max): ?string
    {
        if (! is_string($value)) { return null; }
        $value = trim($value);
        return $value !== '' && mb_strlen($value) <= $max && preg_match('/^[A-Za-z0-9._-]+$/D', $value) ? $value : null;
    }

    private function readBoundedBody(\Illuminate\Http\Client\Response $response): string
    {
        $max = (int) config('news_discovery.max_feed_bytes', 1_500_000);
        $stream = $response->toPsrResponse()->getBody();
        $body = '';
        while (! $stream->eof()) {
            $remaining = $max + 1 - strlen($body);
            if ($remaining <= 0) {
                throw new NewsDiscoveryException('The feed exceeds the configured response size limit.');
            }
            $chunk = $stream->read(min(8192, $remaining));
            if ($chunk === '') {
                if ($stream->eof()) { break; }
                throw new NewsDiscoveryException('The feed response could not be read safely.');
            }
            $body .= $chunk;
            if (strlen($body) > $max) {
                throw new NewsDiscoveryException('The feed exceeds the configured response size limit.');
            }
        }
        return $body;
    }

    private function recordFetchFailure(NewsSource $source, string $safeMessage, ?int $actorId): void
    {
        $source->forceFill(['last_fetched_at' => now(), 'last_error' => mb_substr($safeMessage, 0, 500)])->save();
        NewsDiscoveryEvent::record(null, $actorId, 'source.fetch_failed', null, null, ['source_id' => $source->id, 'reason' => mb_substr($safeMessage, 0, 200)]);
    }

    private function authorize(int $actorId, string $permission): void
    {
        $user = auth()->user();
        if (! $user || (int) $user->getAuthIdentifier() !== $actorId || ! $user->can($permission)) {
            throw new AiStudioException('You are not authorized to perform this Editorial AI Studio action.');
        }
    }
}
