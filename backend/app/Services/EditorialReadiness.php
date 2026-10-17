<?php

namespace App\Services;

use App\Models\News;

class EditorialReadiness
{
    /**
     * Article-only checks. Passing these checks does not verify factual accuracy.
     * @return array{ready: bool, checks: array<string, array{passed: bool, message: string}>, word_count: int}
     */
    public function inspectArticle(News $news): array
    {
        $title = trim((string) $news->title);
        $content = trim(strip_tags((string) $news->content));
        $wordCount = str_word_count(preg_replace('/\s+/', ' ', $content) ?? '');
        $sourceUrl = trim((string) ($news->source_url ?? ''));

        $checks = [
            'title' => [
                'passed' => mb_strlen($title) >= 15 && mb_strlen($title) <= 180,
                'message' => 'Headline must contain 15–180 characters.',
            ],
            'content' => [
                'passed' => $wordCount >= (int) config('editorial.minimum_word_count', 300),
                'message' => 'Article must contain at least '.(int) config('editorial.minimum_word_count', 300).' substantive words.',
            ],
            'category' => [
                'passed' => ! empty($news->category_id),
                'message' => 'A category must be assigned.',
            ],
            'source_url' => [
                'passed' => filter_var($sourceUrl, FILTER_VALIDATE_URL) !== false
                    && in_array(strtolower((string) parse_url($sourceUrl, PHP_URL_SCHEME)), ['http', 'https'], true),
                'message' => 'A valid HTTP(S) source URL is required.',
            ],
        ];

        return [
            'ready' => collect($checks)->every(fn (array $check): bool => $check['passed']),
            'checks' => $checks,
            'word_count' => $wordCount,
        ];
    }

    public function inspect(News $news): array
    {
        $result = $this->inspectArticle($news);
        $hasImage = trim((string) ($news->image_url ?? '')) !== ''
            || trim((string) ($news->featured_image ?? '')) !== '';

        $result['checks']['image'] = [
            'passed' => $hasImage,
            'message' => 'A featured image must be attached.',
        ];
        $result['checks']['image_approved'] = [
            'passed' => ($news->image_review_status ?? 'pending') === 'approved',
            'message' => 'The featured image must be approved separately.',
        ];
        $result['ready'] = collect($result['checks'])->every(fn (array $check): bool => $check['passed']);

        return $result;
    }
}