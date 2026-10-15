<?php

namespace Tests\Feature;

use App\Models\News;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class NewsImportSafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_rss_import_creates_pending_drafts_and_preserves_published_articles_on_repeat_sync(): void
    {
        $firstFeed = $this->rss([
            ['guid' => 'https://example.com/story-1', 'title' => 'A new technology report', 'link' => 'https://example.com/story-1'],
        ]);
        Http::fake([
            'https://techcrunch.com/feed/' => Http::response($firstFeed, 200),
            'https://techcrunch.com/category/artificial-intelligence/feed/' => Http::response($this->rss([['guid' => 'https://example.com/story-2', 'title' => 'Another technology update', 'link' => 'https://example.com/story-2']]), 200),
        ]);

        $this->artisan('news:sync-rss')->assertExitCode(0);

        $news = News::where('external_id', 'https://example.com/story-1')->firstOrFail();
        $this->assertSame('pending', $news->status);
        $this->assertSame('draft', $news->editorial_status);

        $news->forceFill([
            'status' => 'published',
            'editorial_status' => 'approved',
            'article_reviewed_at' => now(),
            'image_review_status' => 'approved',
            'image_reviewed_at' => now(),
        ])->save();

        $changedFeed = $this->rss([
            ['guid' => 'https://example.com/story-1', 'title' => 'Changed feed title must not overwrite reviewed work', 'link' => 'https://example.com/story-1'],
        ]);
        Http::fake([
            'https://techcrunch.com/feed/' => Http::response($changedFeed, 200),
            'https://techcrunch.com/category/artificial-intelligence/feed/' => Http::response($this->rss([['guid' => 'https://example.com/story-2', 'title' => 'Another technology update', 'link' => 'https://example.com/story-2']]), 200),
        ]);

        $this->artisan('news:sync-rss')->assertExitCode(0);

        $this->assertSame('published', $news->fresh()->status);
        $this->assertSame('A new technology report', $news->fresh()->title);
    }

    public function test_wordpress_import_creates_pending_drafts_and_does_not_overwrite_published_articles(): void
    {
        config(['database.connections.wordpress' => [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]]);
        DB::purge('wordpress');
        $schema = Schema::connection('wordpress');

        $schema->create('posts', function (Blueprint $table): void {
            $table->integer('ID')->primary();
            $table->string('post_type');
            $table->string('post_status');
            $table->dateTime('post_date');
            $table->string('post_title');
            $table->longText('post_content');
            $table->text('post_excerpt')->nullable();
            $table->string('post_name');
            $table->text('guid');
        });
        $schema->create('term_relationships', function (Blueprint $table): void {
            $table->integer('object_id');
            $table->integer('term_taxonomy_id');
        });
        $schema->create('term_taxonomy', function (Blueprint $table): void {
            $table->integer('term_taxonomy_id')->primary();
            $table->integer('term_id');
            $table->string('taxonomy');
        });
        $schema->create('terms', function (Blueprint $table): void {
            $table->integer('term_id')->primary();
            $table->string('name');
        });
        $schema->create('postmeta', function (Blueprint $table): void {
            $table->integer('post_id');
            $table->string('meta_key');
            $table->text('meta_value')->nullable();
        });

        DB::connection('wordpress')->table('posts')->insert([
            'ID' => 101,
            'post_type' => 'post',
            'post_status' => 'publish',
            'post_date' => now()->subDay()->toDateTimeString(),
            'post_title' => 'A WordPress technology story',
            'post_content' => 'Imported content with verified details.',
            'post_excerpt' => 'Imported excerpt',
            'post_name' => 'wordpress-technology-story',
            'guid' => 'https://wordpress.example/story-101',
        ]);

        $this->artisan('news:import-wordpress', ['--no-images' => true])->assertExitCode(0);

        $news = News::where('external_id', '101')->firstOrFail();
        $this->assertSame('pending', $news->status);
        $this->assertSame('draft', $news->editorial_status);

        $news->forceFill([
            'status' => 'published',
            'editorial_status' => 'approved',
            'article_reviewed_at' => now(),
            'image_review_status' => 'approved',
            'image_reviewed_at' => now(),
        ])->save();

        DB::connection('wordpress')->table('posts')->where('ID', 101)->update([
            'post_title' => 'Changed WordPress title must not overwrite reviewed work',
        ]);

        $this->artisan('news:import-wordpress', ['--no-images' => true])->assertExitCode(0);

        $this->assertSame('published', $news->fresh()->status);
        $this->assertSame('A WordPress technology story', $news->fresh()->title);
    }

    /** @param array<int, array{guid:string,title:string,link:string}> $items */
    private function rss(array $items): string
    {
        $xml = '<rss version="2.0"><channel><title>Test Feed</title>';
        foreach ($items as $item) {
            $xml .= '<item><guid>'.$item['guid'].'</guid><title>'.$item['title'].'</title><link>'.$item['link'].'</link><description>Verified source description.</description><pubDate>'.now()->toRfc2822String().'</pubDate></item>';
        }
        return $xml.'</channel></rss>';
    }
}
