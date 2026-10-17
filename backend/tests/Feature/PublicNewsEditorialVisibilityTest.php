<?php

namespace Tests\Feature;

use App\Models\News;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicNewsEditorialVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_news_api_excludes_pending_editorial_drafts(): void
    {
        News::create([
            'title' => 'Published editorial article headline',
            'slug' => 'published-editorial-'.uniqid(),
            'excerpt' => 'Published excerpt',
            'content' => 'Published content.',
            'source_name' => 'Example Source',
            'source_url' => 'https://example.com/published',
            'status' => 'published',
            'editorial_status' => 'approved',
            'image_review_status' => 'approved',
            'article_reviewed_at' => now(),
            'image_reviewed_at' => now(),
            'published_at' => now(),
        ]);

        News::create([
            'title' => 'Pending draft must remain private',
            'slug' => 'pending-editorial-'.uniqid(),
            'excerpt' => 'Draft excerpt',
            'content' => 'Draft content.',
            'source_name' => 'Example Source',
            'source_url' => 'https://example.com/draft',
            'status' => 'pending',
            'editorial_status' => 'pending_review',
        ]);

        $response = $this->getJson('/api/v1/news');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Published editorial article headline')
            ->assertJsonMissing(['title' => 'Pending draft must remain private']);
    }

    public function test_pending_draft_cannot_be_fetched_by_slug(): void
    {
        $draft = News::create([
            'title' => 'Private editorial draft headline',
            'slug' => 'private-editorial-'.uniqid(),
            'excerpt' => 'Draft excerpt',
            'content' => 'Draft content.',
            'source_name' => 'Example Source',
            'source_url' => 'https://example.com/draft',
            'status' => 'pending',
            'editorial_status' => 'pending_review',
        ]);

        $this->getJson('/api/v1/news/'.$draft->slug)->assertNotFound();
    }
}
