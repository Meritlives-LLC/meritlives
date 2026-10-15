<?php

namespace App\Services;

use App\Models\News;
use App\Models\NewsArticleGeneration;
use App\Models\NewsEditorialEvent;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class NewsArticleGenerator
{
    public function generate(News $news, string $editorNotes, int $userId): NewsArticleGeneration
    {
        $editorNotes = trim($editorNotes);
        if (mb_strlen($editorNotes) > 12000) {
            throw new RuntimeException('Editor notes must be 12,000 characters or fewer.');
        }

        $sourceMaterial = trim(implode("\n\n", array_filter([
            'Headline: '.trim((string) $news->title),
            'Source: '.trim((string) $news->source_name).' — '.trim((string) $news->source_url),
            'Existing excerpt: '.trim((string) $news->excerpt),
            'Existing article/content: '.trim(strip_tags((string) $news->content)),
            'Editor-provided source notes: '.$editorNotes,
        ], fn (string $value): bool => ! in_array(trim($value), ['Headline:', 'Source: —', 'Existing excerpt:', 'Existing article/content:', 'Editor-provided source notes:'], true))));

        $wordCount = str_word_count(preg_replace('/\s+/', ' ', $sourceMaterial) ?? '');
        $minimumWords = max(80, (int) config('openai_articles.minimum_source_words', 180));
        if ($wordCount < $minimumWords) {
            throw new RuntimeException("Not enough source material ({$wordCount} words). Add verified notes or fuller source content; the generator will not invent missing facts.");
        }

        $apiKey = (string) config('openai_articles.api_key');
        if ($apiKey === '') {
            throw new RuntimeException('OPENAI_API_KEY is not configured.');
        }

        $estimate = max(0.01, (float) config('openai_articles.estimated_cost_per_article_usd', 0.05));
        $dailyLimit = max(1, (int) config('openai_articles.daily_limit', 10));
        $monthlyBudget = max(0, (float) config('openai_articles.monthly_budget_usd', 3));
        // Reserve budget atomically before making the external request. The pending
        // reservation counts toward both limits while the provider call is in flight.
        $generation = Cache::lock('news-ai-article-budget:'.now()->format('Y-m'), 30)->block(5, function () use ($news, $userId, $wordCount, $estimate, $dailyLimit, $monthlyBudget, $sourceMaterial): NewsArticleGeneration {
            $countedStatuses = ['pending', 'succeeded', 'failed'];
            $todayCount = NewsArticleGeneration::whereDate('created_at', today())->whereIn('status', $countedStatuses)->count();
            $monthSpend = (float) NewsArticleGeneration::whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)->whereIn('status', $countedStatuses)->sum('estimated_cost_usd');

            if ($todayCount >= $dailyLimit) {
                throw new RuntimeException('The daily article-generation limit has been reached.');
            }
            if ($monthSpend + $estimate > $monthlyBudget) {
                throw new RuntimeException('The configured monthly article-generation budget would be exceeded.');
            }

            return NewsArticleGeneration::create([
                'news_id' => $news->id,
                'user_id' => $userId,
                'model' => (string) config('openai_articles.model', 'gpt-4.1-mini'),
                'input_words' => $wordCount,
                'estimated_cost_usd' => $estimate,
                'status' => 'pending',
                'source_material_hash' => hash('sha256', $sourceMaterial),
            ]);
        });

        try {
            $response = Http::withToken($apiKey)->acceptJson()
                ->timeout((int) config('openai_articles.timeout_seconds', 120))
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('openai_articles.model', 'gpt-4.1-mini'),
                    'temperature' => 0.2,
                    'max_tokens' => max(600, (int) config('openai_articles.max_output_tokens', 1800)),
                    'response_format' => ['type' => 'json_object'],
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a cautious editorial assistant for MERITLIVES. Produce an unpublished draft only. Use only facts explicitly present in the supplied source material. Do not invent names, quotes, dates, numbers, events, causal claims, or source details. If the material cannot support a useful article, return {"insufficient_source_material":true,"reason":"..."} instead of writing an article. Never claim you independently verified facts. Paraphrase; do not copy long source passages. Return JSON with keys: insufficient_source_material (boolean), reason (string), title (string), excerpt (string), content_html (string). Content HTML may use only p, h2, h3, ul, ol, li, strong, em. Target 350–600 words only when supported by the supplied evidence.'],
                        ['role' => 'user', 'content' => "Create a careful news draft using the source material below. Keep source attribution and preserve uncertainty. Do not publish it.\n\n".$sourceMaterial],
                    ],
                ]);

            if (! $response->successful()) {
                throw new RuntimeException('OpenAI article request failed with HTTP '.$response->status().'.');
            }

            $content = $response->json('choices.0.message.content');
            if (! is_string($content) || $content === '') {
                throw new RuntimeException('OpenAI did not return article draft content.');
            }

            $draft = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
            if (($draft['insufficient_source_material'] ?? false) === true) {
                throw new RuntimeException('Insufficient source material: '.Str::limit((string) ($draft['reason'] ?? 'Add more verified notes.'), 400));
            }

            $title = trim((string) ($draft['title'] ?? ''));
            $excerpt = trim((string) ($draft['excerpt'] ?? ''));
            $html = trim((string) ($draft['content_html'] ?? ''));
            $allowedTags = '<p><h2><h3><ul><ol><li><strong><em>';
            $html = strip_tags($html, $allowedTags);
            // Remove every attribute from retained tags; the model cannot inject
            // event handlers, styles, links, or arbitrary attributes into HTML.
            $html = preg_replace('/<(\/?)((?:p|h2|h3|ul|ol|li|strong|em))\b[^>]*>/i', '<$1$2>', $html) ?? '';
            $draftWords = str_word_count(strip_tags($html));

            if (mb_strlen($title) < 15 || mb_strlen($title) > 180 || $excerpt === '' || $draftWords < (int) config('editorial.minimum_word_count', 300)) {
                throw new RuntimeException('Generated draft did not meet minimum headline, excerpt, and content standards. Add more verified source material and retry.');
            }

            $news->forceFill([
                'title' => $title,
                'slug' => Str::slug($title).'-'.substr(md5($generation->id.'-'.$sourceMaterial), 0, 8),
                'excerpt' => $excerpt,
                'content' => $html,
                'status' => 'pending',
                'editorial_status' => 'pending_review',
                'article_reviewed_by' => null,
                'article_reviewed_at' => null,
                'article_review_notes' => null,
            ])->save();

            $generation->update([
                'status' => 'succeeded',
                'output_tokens' => (int) ($response->json('usage.completion_tokens') ?? 0),
            ]);

            NewsEditorialEvent::create([
                'news_id' => $news->id,
                'user_id' => $userId,
                'event_type' => 'article_draft_generated',
                'from_status' => 'draft',
                'to_status' => 'pending_review',
                'notes' => 'AI-generated article draft; factual verification and editor approval required.',
                'metadata' => ['generation_id' => $generation->id, 'model' => $generation->model, 'source_material_hash' => $generation->source_material_hash],
            ]);

            return $generation->fresh();
        } catch (Throwable $e) {
            $generation->update([
                'status' => 'failed',
                'error_message' => mb_substr($e->getMessage(), 0, 2000),
            ]);
            throw $e;
        }
    }
}