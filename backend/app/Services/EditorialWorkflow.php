<?php

namespace App\Services;

use App\Models\News;
use App\Models\NewsArticleGeneration;
use App\Models\NewsEditorialEvent;
use App\Models\NewsImageGeneration;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class EditorialWorkflow
{
    public function __construct(private readonly EditorialReadiness $readiness) {}

    public function submit(News $news, ?int $userId = null): array
    {
        $from = $news->editorial_status;
        $result = $this->readiness->inspectArticle($news);
        $news->forceFill([
            'status' => 'pending',
            'editorial_status' => $result['ready'] ? 'pending_review' : 'needs_work',
            'article_reviewed_by' => null,
            'article_reviewed_at' => null,
            'article_review_notes' => null,
        ])->save();

        $this->recordEvent($news, $userId, 'submitted_for_review', $from, $news->editorial_status);

        return $result;
    }

    public function approveArticle(News $news, int $reviewerId, ?string $notes = null): void
    {
        $generatorId = NewsArticleGeneration::query()
            ->where('news_id', $news->id)
            ->where('status', 'succeeded')
            ->latest('id')
            ->value('user_id');
        if ($generatorId !== null && (int) $generatorId === $reviewerId) {
            throw new RuntimeException('A different editor must approve an AI-generated article draft.');
        }

        $result = $this->readiness->inspectArticle($news);
        if (! $result['ready']) {
            $failed = collect($result['checks'])->filter(fn (array $check) => ! $check['passed'])
                ->map(fn (array $check) => $check['message'])->implode(' ');
            throw new RuntimeException('Article is not ready for approval. '.$failed);
        }

        $from = $news->editorial_status;
        $news->forceFill([
            'editorial_status' => 'approved',
            'article_reviewed_by' => $reviewerId,
            'article_reviewed_at' => now(),
            'article_review_notes' => $notes,
        ])->save();

        $this->recordEvent($news, $reviewerId, 'article_approved', $from, 'approved', $notes);
    }

    public function approveImage(News $news, int $reviewerId, ?string $notes = null): void
    {
        $generatedImage = NewsImageGeneration::query()
            ->where('news_id', $news->id)
            ->where('image_path', $news->featured_image)
            ->where('status', 'succeeded')
            ->latest('id')
            ->first();
        if ($generatedImage && (int) $generatedImage->user_id === $reviewerId) {
            throw new RuntimeException('A different editor must approve an AI-generated image.');
        }

        if (trim((string) ($news->featured_image ?? '')) === '' && trim((string) ($news->image_url ?? '')) === '') {
            throw new RuntimeException('An image must be attached before image approval.');
        }

        $from = $news->image_review_status;
        $news->forceFill([
            'image_review_status' => 'approved',
            'image_reviewed_by' => $reviewerId,
            'image_reviewed_at' => now(),
            'image_review_notes' => $notes,
        ])->save();

        $this->recordEvent($news, $reviewerId, 'image_approved', $from, 'approved', $notes);
    }

    public function publish(News $news, ?int $userId = null): void
    {
        $result = $this->readiness->inspect($news);
        if (! $result['ready'] || $news->editorial_status !== 'approved') {
            throw new RuntimeException('Publishing blocked: the article and featured image must pass checks and have separate approvals.');
        }

        $from = $news->status;
        DB::transaction(function () use ($news, $userId, $from): void {
            $news->forceFill([
                'status' => 'published',
                'published_at' => $news->published_at ?: now(),
            ])->save();

            $this->recordEvent($news, $userId, 'published', $from, 'published');
        });
    }

    public function returnForChanges(News $news, int $reviewerId, string $notes): void
    {
        $from = $news->editorial_status;
        $news->forceFill([
            'status' => 'pending',
            'editorial_status' => 'needs_work',
            'article_reviewed_by' => $reviewerId,
            'article_reviewed_at' => now(),
            'article_review_notes' => $notes,
        ])->save();

        $this->recordEvent($news, $reviewerId, 'returned_for_changes', $from, 'needs_work', $notes);
    }

    private function recordEvent(
        News $news,
        ?int $userId,
        string $eventType,
        ?string $fromStatus,
        ?string $toStatus,
        ?string $notes = null,
        array $metadata = [],
    ): void {
        NewsEditorialEvent::create([
            'news_id' => $news->id,
            'user_id' => $userId,
            'event_type' => $eventType,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'notes' => $notes,
            'metadata' => $metadata ?: null,
        ]);
    }
}
