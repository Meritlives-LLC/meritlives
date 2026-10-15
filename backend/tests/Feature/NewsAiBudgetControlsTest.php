<?php

namespace Tests\Feature;

use App\Models\News;
use App\Models\NewsArticleGeneration;
use App\Models\NewsImageGeneration;
use App\Models\User;
use App\Services\NewsArticleGenerator;
use App\Services\NewsImageGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class NewsAiBudgetControlsTest extends TestCase
{
    use RefreshDatabase;

    public function test_article_generation_stops_when_monthly_estimate_budget_is_exhausted(): void
    {
        config([
            'openai_articles.api_key' => 'test-key',
            'openai_articles.minimum_source_words' => 80,
            'openai_articles.estimated_cost_per_article_usd' => 0.05,
            'openai_articles.monthly_budget_usd' => 3.00,
            'openai_articles.daily_limit' => 10,
        ]);
        $news = $this->makeNews();

        NewsArticleGeneration::create([
            'news_id' => $news->id,
            'model' => 'test-model',
            'input_words' => 250,
            'estimated_cost_usd' => 3.00,
            'status' => 'failed',
            'source_material_hash' => hash('sha256', 'prior attempt'),
        ]);
        Http::fake();

        try {
            app(NewsArticleGenerator::class)->generate($news, str_repeat('Verified source notes provide context and factual details. ', 30), 1);
            $this->fail('Generation should be blocked when the monthly estimate budget is exhausted.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('monthly article-generation budget', $exception->getMessage());
        }

        Http::assertNothingSent();
    }

    public function test_image_generation_stops_when_daily_limit_is_reached(): void
    {
        config([
            'openai_images.api_key' => 'test-key',
            'openai_images.daily_limit' => 1,
            'openai_images.monthly_budget_usd' => 5.00,
            'openai_images.estimated_cost_per_image_usd' => 0.10,
        ]);
        $news = $this->makeNews();

        NewsImageGeneration::create([
            'news_id' => $news->id,
            'prompt' => 'Previous editorial illustration',
            'model' => 'test-image-model',
            'quality' => 'low',
            'estimated_cost_usd' => 0.10,
            'status' => 'failed',
        ]);
        Http::fake();

        try {
            app(NewsImageGenerator::class)->generate($news, 'A conceptual technology illustration', 1);
            $this->fail('Generation should be blocked when the daily image limit is reached.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('daily image generation limit', $exception->getMessage());
        }

        Http::assertNothingSent();
    }

    public function test_article_api_failure_is_logged_as_failed_and_keeps_the_article_unpublished(): void
    {
        config([
            'openai_articles.api_key' => 'test-key',
            'openai_articles.model' => 'configured-test-text-model',
            'openai_articles.minimum_source_words' => 80,
            'openai_articles.monthly_budget_usd' => 3.00,
        ]);
        $news = $this->makeNews();
        $user = User::factory()->create();
        Http::fake(['https://api.openai.com/*' => Http::response(['error' => 'test failure'], 503)]);

        try {
            app(NewsArticleGenerator::class)->generate($news, str_repeat('Verified source notes provide context and factual details. ', 30), (int) $user->id);
            $this->fail('The generator should surface the failed provider request.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('HTTP 503', $exception->getMessage());
        }

        $generation = NewsArticleGeneration::latest('id')->firstOrFail();
        $this->assertSame('configured-test-text-model', $generation->model);
        $this->assertSame('failed', $generation->status);
        $this->assertSame('pending', $news->fresh()->status);
        $this->assertSame('draft', $news->fresh()->editorial_status);
    }

    public function test_image_api_failure_is_logged_as_failed_and_does_not_approve_an_image(): void
    {
        config([
            'openai_images.api_key' => 'test-key',
            'openai_images.model' => 'configured-test-image-model',
            'openai_images.monthly_budget_usd' => 5.00,
        ]);
        $news = $this->makeNews();
        $user = User::factory()->create();
        Http::fake(['https://api.openai.com/*' => Http::response(['error' => 'test failure'], 503)]);

        try {
            app(NewsImageGenerator::class)->generate($news, 'A conceptual technology illustration', (int) $user->id);
            $this->fail('The image generator should surface the failed provider request.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('HTTP 503', $exception->getMessage());
        }

        $generation = NewsImageGeneration::latest('id')->firstOrFail();
        $this->assertSame('configured-test-image-model', $generation->model);
        $this->assertSame('failed', $generation->status);
        $this->assertSame('pending', $news->fresh()->image_review_status);
        $this->assertNull($news->fresh()->image_reviewed_at);
    }

    private function makeNews(): News
    {
        return News::create([
            'title' => 'A sufficiently descriptive technology report',
            'slug' => 'ai-budget-test-'.uniqid(),
            'excerpt' => 'Verified source excerpt for budget testing.',
            'content' => str_repeat('Verified reporting material supports this factual statement. ', 60),
            'source_name' => 'Test Source',
            'source_url' => 'https://example.com/source',
            'status' => 'pending',
            'editorial_status' => 'draft',
            'image_review_status' => 'pending',
        ]);
    }
}
