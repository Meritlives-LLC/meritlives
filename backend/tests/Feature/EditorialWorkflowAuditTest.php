<?php

namespace Tests\Feature;

use App\Models\News;
use App\Models\NewsEditorialEvent;
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
}
