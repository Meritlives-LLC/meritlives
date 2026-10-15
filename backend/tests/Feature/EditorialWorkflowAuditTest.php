<?php

namespace Tests\Feature;

use App\Models\News;
use App\Models\NewsArticleGeneration;
use App\Models\NewsEditorialEvent;
use App\Models\NewsImageGeneration;
use App\Services\EditorialWorkflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EditorialWorkflowAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_submission_records_auditable_readiness_result(): void
    {
        $news = News::create([
            'title' => 'A draft submitted for editorial review',
            'slug' => 'editorial-audit-'.uniqid(),
            'excerpt' => 'Short excerpt',
            'content' => 'Not enough content to pass editorial readiness.',
            'source_name' => 'Example Source',
            'source_url' => 'https://example.com/story',
            'status' => 'draft',
            'editorial_status' => 'draft',
        ]);

        $result = app(EditorialWorkflow::class)->submit($news, null);

        $this->assertFalse($result['ready']);
        $this->assertSame('pending', $news->fresh()->status);
        $this->assertSame('needs_work', $news->fresh()->editorial_status);

        $this->assertDatabaseHas('news_editorial_events', [
            'news_id' => $news->id,
            'event_type' => 'submitted_for_review',
            'from_status' => 'draft',
            'to_status' => 'needs_work',
        ]);

        $event = NewsEditorialEvent::where('news_id', $news->id)->firstOrFail();
        $this->assertNull($event->user_id);
    }

    public function test_approvals_publication_and_return_for_changes_are_recorded_in_audit_history(): void
    {
        $category = \App\Models\Category::create([
            'name' => 'Technology',
            'slug' => 'audit-technology-'.uniqid(),
            'type' => 'news',
            'status' => 'active',
        ]);
        $user = \App\Models\User::factory()->create();
        $news = News::create([
            'category_id' => $category->id,
            'title' => 'An audited article with a complete headline',
            'slug' => 'audit-flow-'.uniqid(),
            'excerpt' => 'An excerpt for audit flow testing.',
            'content' => str_repeat('Verified reporting material supports the details in this example. ', 70),
            'source_name' => 'Test Source',
            'source_url' => 'https://example.com/audited-story',
            'image_url' => 'https://example.com/audited-image.jpg',
            'status' => 'pending',
            'editorial_status' => 'pending_review',
            'image_review_status' => 'pending',
        ]);

        $workflow = app(EditorialWorkflow::class);
        $workflow->approveArticle($news, (int) $user->id, 'Article reviewed');
        $workflow->approveImage($news, (int) $user->id, 'Image reviewed');
        $workflow->publish($news, (int) $user->id);
        $workflow->returnForChanges($news, (int) $user->id, 'Please revise the article.');

        $this->assertSame('pending', $news->fresh()->status);
        $this->assertSame('needs_work', $news->fresh()->editorial_status);
        $this->assertDatabaseHas('news_editorial_events', ['news_id' => $news->id, 'event_type' => 'article_approved']);
        $this->assertDatabaseHas('news_editorial_events', ['news_id' => $news->id, 'event_type' => 'image_approved']);
        $this->assertDatabaseHas('news_editorial_events', ['news_id' => $news->id, 'event_type' => 'published']);
        $this->assertDatabaseHas('news_editorial_events', [
            'news_id' => $news->id,
            'event_type' => 'returned_for_changes',
            'notes' => 'Please revise the article.',
        ]);
    }


    public function test_ai_article_generator_cannot_approve_its_own_generated_draft(): void
    {
        $category = \\App\\Models\\Category::create([
            'name' => 'Technology',
            'slug' => 'independent-review-'.uniqid(),
            'type' => 'news',
            'status' => 'active',
        ]);
        $user = \\App\\Models\\User::factory()->create();
        $news = News::create([
            'category_id' => $category->id,
            'title' => 'An article requiring independent editorial review',
            'slug' => 'independent-article-'.uniqid(),
            'excerpt' => 'A verified source excerpt.',
            'content' => str_repeat('Verified reporting material supports the details in this example. ', 70),
            'source_name' => 'Test Source',
            'source_url' => 'https://example.com/independent-article',
            'status' => 'pending',
            'editorial_status' => 'pending_review',
        ]);
        NewsArticleGeneration::create([
            'news_id' => $news->id,
            'user_id' => $user->id,
            'model' => 'test-model',
            'input_words' => 200,
            'estimated_cost_usd' => 0.05,
            'status' => 'succeeded',
            'source_material_hash' => hash('sha256', 'verified material'),
        ]);

        $this->expectException(\\RuntimeException::class);
        $this->expectExceptionMessage('A different editor must approve an AI-generated article draft.');
        app(EditorialWorkflow::class)->approveArticle($news, (int) $user->id);
    }

    public function test_ai_image_generator_cannot_approve_its_own_generated_image(): void
    {
        $user = \\App\\Models\\User::factory()->create();
        $imagePath = 'news-generated/1/editorial-test.jpg';
        $news = News::create([
            'title' => 'An article with an AI generated image',
            'slug' => 'independent-image-'.uniqid(),
            'excerpt' => 'A verified source excerpt.',
            'content' => str_repeat('Verified reporting material supports the details in this example. ', 70),
            'source_name' => 'Test Source',
            'source_url' => 'https://example.com/independent-image',
            'featured_image' => $imagePath,
            'status' => 'pending',
            'editorial_status' => 'draft',
            'image_review_status' => 'pending',
        ]);
        NewsImageGeneration::create([
            'news_id' => $news->id,
            'user_id' => $user->id,
            'image_path' => $imagePath,
            'prompt' => 'A conceptual editorial illustration',
            'model' => 'test-image-model',
            'quality' => 'low',
            'estimated_cost_usd' => 0.10,
            'status' => 'succeeded',
        ]);

        $this->expectException(\\RuntimeException::class);
        $this->expectExceptionMessage('A different editor must approve an AI-generated image.');
        app(EditorialWorkflow::class)->approveImage($news, (int) $user->id);
    }

}
