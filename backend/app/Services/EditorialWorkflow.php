<?php

namespace App\Services;

use App\Models\News;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class EditorialWorkflow
{
    public function __construct(private readonly EditorialReadiness $readiness) {}

    public function submit(News $news): array
    {
        $result = $this->readiness->inspectArticle($news);
        $news->forceFill([
            'status' => 'pending',
            'editorial_status' => $result['ready'] ? 'pending_review' : 'needs_work',
            'article_reviewed_by' => null,
            'article_reviewed_at' => null,
            'article_review_notes' => null,
        ])->save();

        return $result;
    }

    public function approveArticle(News $news, int $reviewerId, ?string $notes = null): void
    {
        $result = $this->readiness->inspectArticle($news);
        if (! $result['ready']) {
            $failed = collect($result['checks'])->filter(fn (array $check) => ! $check['passed'])
                ->map(fn (array $check) => $check['message'])->implode(' ');
            throw new RuntimeException('Article is not ready for approval. '.$failed);
        }

        $news->forceFill([
            'editorial_status' => 'approved',
            'article_reviewed_by' => $reviewerId,
            'article_reviewed_at' => now(),
            'article_review_notes' => $notes,
        ])->save();
    }

    public function approveImage(News $news, int $reviewerId, ?string $notes = null): void
    {
        if (trim((string) ($news->featured_image ?? '')) === '' && trim((string) ($news->image_url ?? '')) === '') {
            throw new RuntimeException('An image must be attached before image approval.');
        }

        $news->forceFill([
            'image_review_status' => 'approved',
            'image_reviewed_by' => $reviewerId,
            'image_reviewed_at' => now(),
            'image_review_notes' => $notes,
        ])->save();
    }

    public function publish(News $news): void
    {
        $result = $this->readiness->inspect($news);
        if (! $result['ready'] || $news->editorial_status !== 'approved') {
            throw new RuntimeException('Publishing blocked: the article and featured image must pass checks and have separate approvals.');
        }

        DB::transaction(function () use ($news): void {
            $news->forceFill([
                'status' => 'published',
                'published_at' => $news->published_at ?: now(),
            ])->save();
        });
    }

    public function returnForChanges(News $news, int $reviewerId, string $notes): void
    {
        $news->forceFill([
            'status' => 'pending',
            'editorial_status' => 'needs_work',
            'article_reviewed_by' => $reviewerId,
            'article_reviewed_at' => now(),
            'article_review_notes' => $notes,
        ])->save();
    }
}