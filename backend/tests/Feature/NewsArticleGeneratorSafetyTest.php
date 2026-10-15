<?php

namespace Tests\Feature;

use App\Models\News;
use App\Services\NewsArticleGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class NewsArticleGeneratorSafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_rejects_thin_source_material_before_making_an_api_request(): void
    {
        config([
            'openai_articles.minimum_source_words' => 180,
            'openai_articles.api_key' => 'test-key-not-used',
        ]);

        $news = News::create([
            'title' => 'A headline with too little source information',
            'slug' => 'thin-source-'.uniqid(),
            'source_name' => 'Example Source',
            'source_url' => 'https://example.com/story',
            'excerpt' => 'A very short excerpt.',
            'content' => 'Only a short sentence is available.',
            'status' => 'pending',
            'editorial_status' => 'draft',
        ]);

        try {
            app(NewsArticleGenerator::class)->generate($news, 'No additional verified notes.', 1);
            $this->fail('The generator should reject insufficient source material.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('Not enough source material', $exception->getMessage());
        }

        $this->assertDatabaseCount('news_article_generations', 0);
        $this->assertSame('pending', $news->fresh()->status);
        $this->assertSame('draft', $news->fresh()->editorial_status);
    }
}
