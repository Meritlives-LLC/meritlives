<?php

namespace Tests\Feature;

use App\Models\News;
use App\Services\NewsHeadlineDeduplicator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewsHeadlineDeduplicatorTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_detects_exact_headline_duplicates(): void
    {
        $news = $this->createNews('OpenAI launches a new AI tool for developers');

        $duplicate = app(NewsHeadlineDeduplicator::class)
            ->findDuplicate('OpenAI launches a new AI tool for developers');

        $this->assertNotNull($duplicate);
        $this->assertSame($news->id, $duplicate->id);
    }

    public function test_it_detects_near_duplicate_headlines(): void
    {
        $news = $this->createNews('OpenAI launches a new AI tool for developers');

        $duplicate = app(NewsHeadlineDeduplicator::class)
            ->findDuplicate('OpenAI launches new AI tools for developers');

        $this->assertNotNull($duplicate);
        $this->assertSame($news->id, $duplicate->id);
    }

    private function createNews(string $title): News
    {
        return News::create([
            'title' => $title,
            'slug' => 'test-'.uniqid(),
            'source_name' => 'Test source',
            'source_url' => 'https://example.com/'.uniqid(),
            'status' => 'pending',
            'editorial_status' => 'draft',
        ]);
    }
}
