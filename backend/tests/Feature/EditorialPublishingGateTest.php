<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\News;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class EditorialPublishingGateTest extends TestCase
{
    use RefreshDatabase;

    private function makeNews(array $overrides = []): News
    {
        $category = Category::create([
            'name' => 'Technology',
            'slug' => 'technology-test',
            'type' => 'news',
            'status' => 'active',
        ]);

        return News::create(array_merge([
            'category_id' => $category->id,
            'title' => 'A sufficiently descriptive test headline',
            'slug' => 'test-news-'.uniqid(),
            'excerpt' => 'A test excerpt.',
            'content' => str_repeat('Verified source material supports this sentence. ', 70),
            'source_name' => 'Test Source',
            'source_url' => 'https://example.com/source',
            'image_url' => 'https://example.com/image.jpg',
            'status' => 'pending',
            'editorial_status' => 'draft',
            'image_review_status' => 'pending',
        ], $overrides));
    }

    public function test_publishing_is_blocked_without_both_approvals(): void
    {
        $news = $this->makeNews();
        $news->status = 'published';

        $this->expectException(RuntimeException::class);
        $news->save();
    }

    public function test_article_edits_revoke_article_and_image_approvals_and_unpublish(): void
    {
        $news = $this->makeNews([
            'status' => 'published',
            'editorial_status' => 'approved',
            'article_reviewed_at' => now(),
            'image_review_status' => 'approved',
            'image_reviewed_at' => now(),
        ]);

        $news->title = 'Updated headline that requires a new review';
        $news->save();
        $fresh = $news->fresh();

        $this->assertSame('pending', $fresh->status);
        $this->assertSame('needs_work', $fresh->editorial_status);
        $this->assertNull($fresh->article_reviewed_at);
        $this->assertSame('pending', $fresh->image_review_status);
        $this->assertNull($fresh->image_reviewed_at);
    }

    public function test_image_edits_revoke_image_approval_and_unpublish(): void
    {
        $news = $this->makeNews([
            'status' => 'published',
            'editorial_status' => 'approved',
            'article_reviewed_at' => now(),
            'image_review_status' => 'approved',
            'image_reviewed_at' => now(),
        ]);

        $news->image_url = 'https://example.com/replacement-image.jpg';
        $news->save();
        $fresh = $news->fresh();

        $this->assertSame('pending', $fresh->status);
        $this->assertSame('approved', $fresh->editorial_status);
        $this->assertSame('pending', $fresh->image_review_status);
        $this->assertNull($fresh->image_reviewed_at);
    }
}
