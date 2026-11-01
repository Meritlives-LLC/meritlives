<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\News;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SyncRssNewsModerationTest extends TestCase
{
    use RefreshDatabase;

    private const FEED = <<<'XML'
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0"><channel>
          <item><title>Review required for imported story</title><link>https://techcrunch.com/story</link><guid>https://techcrunch.com/story</guid><description>Short feed summary</description></item>
        </channel></rss>
        XML;

    public function test_dry_run_does_not_write_news_or_categories(): void
    {
        $categoryCount = Category::query()->count();
        Http::fake(['techcrunch.com/*' => fn () => Http::response(self::FEED)]);

        $this->artisan('news:sync-rss --dry-run')->assertExitCode(0);

        $this->assertDatabaseCount('news', 0);
        $this->assertSame($categoryCount, Category::query()->count());
    }

    public function test_new_rss_stories_are_pending_and_existing_review_status_is_preserved(): void
    {
        Http::fake(['techcrunch.com/*' => fn () => Http::response(self::FEED)]);

        $this->artisan('news:sync-rss')->assertExitCode(0);

        $story = News::query()->where('external_id', 'https://techcrunch.com/story')->firstOrFail();
        $this->assertSame('pending', $story->status);

        $story->update(['status' => 'archived']);
        $this->artisan('news:sync-rss')->assertExitCode(0);

        $this->assertSame('archived', $story->fresh()->status);
        $this->assertSame(1, News::query()->count());
    }

    public function test_rss_sync_does_not_overwrite_published_editorial_copy(): void
    {
        $published = News::query()->create([
            'title' => 'Editor title', 'slug' => 'editor-title', 'excerpt' => 'Editor excerpt',
            'content' => '<p>Approved editorial copy.</p>', 'source_name' => 'TechCrunch',
            'source_url' => 'https://techcrunch.com/story', 'external_id' => 'https://techcrunch.com/story',
            'status' => 'published', 'published_at' => now(),
        ]);
        Http::fake(['techcrunch.com/*' => fn () => Http::response(self::FEED)]);

        $this->artisan('news:sync-rss')->assertExitCode(0);

        $this->assertSame('Editor title', $published->fresh()->title);
        $this->assertSame('Editor excerpt', $published->fresh()->excerpt);
        $this->assertSame('<p>Approved editorial copy.</p>', $published->fresh()->content);
        $this->assertSame('published', $published->fresh()->status);
    }
}
