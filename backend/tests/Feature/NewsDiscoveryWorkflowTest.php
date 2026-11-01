<?php

namespace Tests\Feature;

use App\Models\AiGenerationJob;
use App\Models\AiPromptTemplate;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\News;
use App\Models\NewsDiscovery;
use App\Models\NewsSource;
use App\Models\User;
use App\Services\AiStudio\AiStudioException;
use App\Services\AiStudio\AiGenerationProvider;
use App\Services\AiStudio\AiStudioManager;
use App\Services\AiStudio\OpenAiGenerationProvider;
use App\Services\NewsDiscovery\AiStudioNewsRewriteProvider;
use App\Services\NewsDiscovery\NewsDiscoveryException;
use App\Services\NewsDiscovery\NewsDiscoveryManager;
use App\Services\NewsDiscovery\NewsRewriteProvider;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Support\FakeNewsRewriteProvider;
use Tests\Support\FakeAiGenerationProvider;
use Tests\TestCase;

class NewsDiscoveryWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $editor;
    private Category $category;
    private NewsSource $source;
    private FakeNewsRewriteProvider $rewriteProvider;
    private const FEED = <<<'XML'
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0"><channel>
          <item><title>Digital services update announced in Abuja</title><link>https://publisher.test/story?utm_source=rss</link><guid>publisher-story-445</guid><pubDate>Tue, 13 Oct 2026 10:00:00 GMT</pubDate><description><![CDATA[Officials announced a new digital services plan in Abuja. The source says the plan will improve access to government services.]]></description></item>
        </channel></rss>
        XML;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->editor = User::factory()->create();
        $this->editor->assignRole('editor');
        $this->actingAs($this->editor);
        $this->category = Category::query()->where('slug', 'technology')->firstOrFail();
        $this->source = NewsSource::query()->create(['name' => 'Approved Feed', 'type' => 'rss', 'feed_url' => 'https://feeds.test/feed.xml', 'enabled' => true]);
        $this->source->categories()->attach($this->category);
        Storage::fake('local');
        Storage::fake('public');
        config(['news_discovery.allowed_hosts' => ['feeds.test'], 'ai_studio.enabled' => true, 'ai_studio.provider' => 'fake']);
        $this->rewriteProvider = new FakeNewsRewriteProvider();
        $this->app->instance(NewsRewriteProvider::class, $this->rewriteProvider);
    }

    public function test_category_matching_deduplicates_repeated_refreshes_and_keeps_discovery_out_of_news(): void
    {
        $this->fakeDefaultFeed();
        $manager = app(NewsDiscoveryManager::class);
        $this->assertSame(1, $manager->refresh($this->source, $this->editor->id));
        $this->assertSame(0, $manager->refresh($this->source, $this->editor->id));
        $this->assertDatabaseCount('news_discoveries', 1);
        $this->assertDatabaseCount('news', 0);
        $discovery = NewsDiscovery::query()->firstOrFail();
        $this->assertSame(NewsDiscovery::STATUS_DISCOVERED, $discovery->status);
        $this->assertSame($this->category->id, $discovery->category_id);
        $this->assertSame('https://publisher.test/story', $discovery->canonical_url);
        $this->assertSame('publisher-story-445', $discovery->external_id);
        $this->assertNotNull($discovery->retrieved_at);
    }

    public function test_canonical_duplicate_from_another_source_is_flagged_and_not_rewritten(): void
    {
        Http::fake(static fn () => Http::response(self::FEED, 200));
        app(NewsDiscoveryManager::class)->refresh($this->source, $this->editor->id);
        $second = NewsSource::query()->create(['name' => 'Another Feed', 'type' => 'rss', 'feed_url' => 'https://other.test/feed.xml', 'enabled' => true]);
        $second->categories()->attach($this->category);
        config(['news_discovery.allowed_hosts' => ['feeds.test', 'other.test']]);
        app(NewsDiscoveryManager::class)->refresh($second, $this->editor->id);
        $duplicate = NewsDiscovery::query()->where('news_source_id', $second->id)->firstOrFail();
        $this->assertSame(NewsDiscovery::STATUS_DUPLICATE, $duplicate->status);
        $this->assertNotNull($duplicate->duplicate_of_id);
        $this->expectException(NewsDiscoveryException::class);
        app(NewsDiscoveryManager::class)->requestRewrite($duplicate, $this->editor->id);
    }

    public function test_unapproved_host_is_rejected_before_any_request(): void
    {
        config(['news_discovery.allowed_hosts' => []]);
        try { app(NewsDiscoveryManager::class)->refresh($this->source, $this->editor->id); $this->fail('Expected allowlist rejection.'); }
        catch (NewsDiscoveryException $exception) { $this->assertStringNotContainsString('password', $exception->getMessage()); }
        $this->assertSame(0, NewsDiscovery::query()->count());
    }

    public function test_redirect_is_rejected_and_never_followed(): void
    {
        $this->source->update(['feed_url' => 'https://redirect.test/feed.xml']);
        config(['news_discovery.allowed_hosts' => ['redirect.test']]);
        Http::fake(['https://redirect.test/*' => Http::response('', 302, ['Location' => 'http://127.0.0.1/internal'])]);
        try { app(NewsDiscoveryManager::class)->refresh($this->source, $this->editor->id); $this->fail('Expected redirect rejection.'); }
        catch (NewsDiscoveryException $exception) { $this->assertStringContainsString('redirect', $exception->getMessage()); }
    }

    public function test_external_entity_xml_is_rejected(): void
    {
        config(['news_discovery.allowed_hosts' => ['feeds.test']]);
        Http::fake(['https://feeds.test/*' => Http::response('<!DOCTYPE foo [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss><channel><item/></channel></rss>')]);
        try { app(NewsDiscoveryManager::class)->refresh($this->source, $this->editor->id); $this->fail('Expected unsafe XML rejection.'); }
        catch (NewsDiscoveryException $exception) { $this->assertStringContainsString('XML', $exception->getMessage()); }
    }

    public function test_oversized_feed_is_rejected_after_the_configured_limit(): void
    {
        config(['news_discovery.allowed_hosts' => ['feeds.test'], 'news_discovery.max_feed_bytes' => 32]);
        Http::fake(['https://feeds.test/*' => Http::response(str_repeat('x', 100), 200)]);
        try { app(NewsDiscoveryManager::class)->refresh($this->source, $this->editor->id); $this->fail('Expected response size rejection.'); }
        catch (NewsDiscoveryException $exception) { $this->assertStringContainsString('size limit', $exception->getMessage()); }
        $this->assertSame(0, NewsDiscovery::query()->count());
    }

    public function test_rewrite_disabled_and_invalid_provider_results_fail_without_fake_success(): void
    {
        $this->fakeDefaultFeed();
        app(NewsDiscoveryManager::class)->refresh($this->source, $this->editor->id);
        $discovery = NewsDiscovery::query()->firstOrFail();
        config(['ai_studio.enabled' => false]);
        try { app(NewsDiscoveryManager::class)->requestRewrite($discovery, $this->editor->id); $this->fail('Expected disabled provider.'); }
        catch (NewsDiscoveryException $exception) { $this->assertStringContainsString('unavailable', $exception->getMessage()); }
        $this->assertSame(0, $this->rewriteProvider->calls);
        $this->assertSame(NewsDiscovery::STATUS_DISCOVERED, $discovery->fresh()->status);

        config(['ai_studio.enabled' => true]);
        $this->rewriteProvider->malformed = true;
        try { app(NewsDiscoveryManager::class)->requestRewrite($discovery->fresh(), $this->editor->id); $this->fail('Expected malformed result rejection.'); }
        catch (NewsDiscoveryException $exception) { $this->assertStringContainsString('structure', $exception->getMessage()); }
        $this->assertSame(NewsDiscovery::STATUS_FAILED, $discovery->fresh()->status);
        $this->assertSame(AiGenerationJob::STATUS_FAILED, $discovery->fresh()->rewriteJob->status);
    }

    public function test_openai_rewrite_with_invalid_required_schema_fails_news_validation(): void
    {
        $content = json_encode([
            'headline' => 'Digital services update',
            'lead' => 'Officials announced a digital services plan in Abuja.',
            'paragraphs' => 'This must be an array of paragraphs.',
            'slug' => 'digital-services-update',
            'seo_title' => 'Digital services update report',
            'meta_description' => 'Officials announced a digital services plan for Abuja residents.',
            'verification_flags' => [],
        ], JSON_THROW_ON_ERROR);
        Http::fake(function ($request) use ($content) {
            if (str_starts_with($request->url(), 'https://feeds.test/')) {
                return Http::response(self::FEED, 200);
            }

            return Http::response(['choices' => [['message' => ['content' => $content]]]], 200);
        });
        config([
            'ai_studio.enabled' => true,
            'ai_studio.provider' => 'openai',
            'ai_studio.api_key' => 'news-test-api-key',
            'ai_studio.model' => 'test-model',
        ]);
        $provider = app(OpenAiGenerationProvider::class);
        $this->app->instance(AiGenerationProvider::class, $provider);
        $this->app->instance(NewsRewriteProvider::class, new AiStudioNewsRewriteProvider($provider));

        $manager = app(NewsDiscoveryManager::class);
        $manager->refresh($this->source, $this->editor->id);
        $discovery = NewsDiscovery::query()->firstOrFail();

        try {
            $manager->requestRewrite($discovery, $this->editor->id);
            $this->fail('Expected News Discovery schema validation to reject the malformed paragraphs field.');
        } catch (NewsDiscoveryException $exception) {
            $this->assertSame('The rewrite response did not meet the required editorial structure.', $exception->getMessage());
        }

        $this->assertSame(NewsDiscovery::STATUS_FAILED, $discovery->fresh()->status);
        $this->assertSame(AiGenerationJob::STATUS_FAILED, $discovery->fresh()->rewriteJob->status);
        Http::assertSent(fn ($request): bool => str_contains($request->url(), 'api.openai.com')
            && $request['response_format']['type'] === 'json_object'
            && str_contains($request['messages'][0]['content'], 'Return exactly one JSON object'));
    }

    public function test_provider_failure_is_safely_reported_and_audited(): void
    {
        $this->fakeDefaultFeed();
        app(NewsDiscoveryManager::class)->refresh($this->source, $this->editor->id);
        $this->rewriteProvider->fail = true;
        $discovery = NewsDiscovery::query()->firstOrFail();
        try { app(NewsDiscoveryManager::class)->requestRewrite($discovery, $this->editor->id); $this->fail('Expected provider failure.'); }
        catch (NewsDiscoveryException $exception) { $this->assertStringNotContainsString('credential', $exception->getMessage()); }
        $this->assertSame(NewsDiscovery::STATUS_FAILED, $discovery->fresh()->status);
        $this->assertDatabaseHas('ai_audit_events', ['job_id' => $discovery->fresh()->rewrite_job_id, 'event' => 'rewrite.failed']);
        $this->assertStringNotContainsString('credential', $discovery->fresh()->rewriteJob->failure_message);
    }

    public function test_human_review_then_explicit_unpublished_news_draft_and_publication_are_separate(): void
    {
        $this->fakeDefaultFeed();
        app(NewsDiscoveryManager::class)->refresh($this->source, $this->editor->id);
        $manager = app(NewsDiscoveryManager::class);
        $discovery = NewsDiscovery::query()->firstOrFail();
        $template = AiPromptTemplate::query()->create([
            'name' => 'News rewrite', 'slug' => 'news-rewrite', 'prompt' => 'Use the approved editorial house style.',
            'instructions' => 'Avoid unsupported claims.', 'created_by' => $this->editor->id,
        ]);
        $template->refresh();
        $job = $manager->requestRewrite($discovery, $this->editor->id);
        $this->assertSame(AiGenerationJob::STATUS_AWAITING_REVIEW, $job->status);
        $this->assertSame($template->version, $job->prompt_template_version);
        $this->assertStringContainsString('approved editorial house style', $job->prompt);
        $this->assertSame('fake', $job->provider);
        $this->assertSame('deterministic', $job->model);
        $this->assertStringNotContainsString('<script>', $job->result_body);
        $this->assertNotEmpty($job->result_metadata['verification_flags']);

        $manager->reviewRewrite($discovery->fresh(), $this->editor->id, true, 'Checked source attribution.', [
            'headline' => $job->result_title, 'slug' => $job->result_slug, 'lead' => $job->result_excerpt,
            'paragraphs' => [
                'The source summary says the plan will improve access to government services for residents.',
                'The source excerpt does not include costs, implementation dates or independently verified outcomes.',
            ],
            'seo_title' => $job->result_metadata['seo_title'], 'meta_description' => $job->result_metadata['meta_description'],
            'verification_flags' => $job->result_metadata['verification_flags'],
        ]);
        $this->assertSame(NewsDiscovery::STATUS_APPROVED_FOR_DRAFT, $discovery->fresh()->status);
        $draft = $manager->createDraft($discovery->fresh(), $this->editor->id, 'news');
        $this->assertInstanceOf(News::class, $draft);
        $this->assertSame('pending', $draft->status);
        $this->assertNull($draft->published_at);
        $this->assertSame('Approved Feed', $draft->source_name);
        $this->assertSame('https://publisher.test/story?utm_source=rss', $draft->source_url);
        $this->assertSame(NewsDiscovery::STATUS_DRAFT_SAVED, $discovery->fresh()->status);
        $this->getJson('/api/v1/news')->assertOk()->assertJsonMissing(['slug' => $draft->slug]);

        $draft->update(['status' => 'published', 'published_at' => now()]);
        $this->assertSame(NewsDiscovery::STATUS_PUBLISHED, $discovery->fresh()->status);
        $this->getJson('/api/v1/news')->assertOk()->assertJsonFragment(['slug' => $draft->slug]);
    }

    public function test_unapproved_editorial_actions_are_rejected_server_side(): void
    {
        $this->fakeDefaultFeed();
        app(NewsDiscoveryManager::class)->refresh($this->source, $this->editor->id);
        $unassigned = User::factory()->create();
        $this->actingAs($unassigned);
        $this->expectException(AiStudioException::class);
        app(NewsDiscoveryManager::class)->requestRewrite(NewsDiscovery::query()->firstOrFail(), $unassigned->id);
    }

    public function test_blog_draft_and_image_approval_are_separate_and_attachment_is_explicit(): void
    {
        $this->fakeDefaultFeed();
        $manager = app(NewsDiscoveryManager::class);
        $manager->refresh($this->source, $this->editor->id);
        $discovery = NewsDiscovery::query()->firstOrFail();
        $rewrite = $manager->requestRewrite($discovery, $this->editor->id);
        $manager->reviewRewrite($discovery, $this->editor->id, true, null, [
            'headline' => $rewrite->result_title, 'slug' => $rewrite->result_slug, 'lead' => $rewrite->result_excerpt,
            'paragraphs' => ['The source summary says the plan will improve access to government services for residents.', 'The source excerpt does not include costs, implementation dates or independently verified outcomes.'],
            'seo_title' => $rewrite->result_metadata['seo_title'], 'meta_description' => $rewrite->result_metadata['meta_description'],
            'verification_flags' => $rewrite->result_metadata['verification_flags'],
        ]);
        $draft = $manager->createDraft($discovery->fresh(), $this->editor->id, 'blog');
        $this->assertInstanceOf(BlogPost::class, $draft);
        $this->assertSame('draft', $draft->status);
        $this->assertNull($draft->featured_image);

        $imageJob = $manager->createImageJob($discovery->fresh(), $this->editor->id, ['prompt' => 'Illustrate the reported digital services plan.', 'instructions' => 'Use a neutral editorial style.']);
        $fakeImageProvider = new FakeAiGenerationProvider();
        $this->app->instance(AiGenerationProvider::class, $fakeImageProvider);
        $imageJob = app(AiStudioManager::class)->generate($imageJob, $this->editor->id);
        $this->assertSame(AiGenerationJob::STATUS_AWAITING_REVIEW, $imageJob->status);
        $this->assertNull($draft->fresh()->featured_image);
        $imageJob = app(AiStudioManager::class)->review($imageJob, $this->editor->id, true, null);
        $this->assertSame(AiGenerationJob::STATUS_APPROVED, $imageJob->status);
        $this->assertNull($draft->fresh()->featured_image);
        $manager->attachApprovedImage($discovery->fresh(), $this->editor->id);
        $this->assertSame($imageJob->approved_image_path, $draft->fresh()->featured_image);
        $this->assertSame('draft', $draft->fresh()->status);
    }

    public function test_existing_published_news_is_marked_duplicate_without_being_overwritten(): void
    {
        $this->fakeDefaultFeed();
        News::query()->create([
            'category_id' => $this->category->id, 'title' => 'Editor approved title', 'slug' => 'editor-approved-title',
            'excerpt' => 'Editorial excerpt.', 'content' => '<p>Published editorial body.</p>', 'source_name' => 'Approved Feed',
            'source_url' => 'https://publisher.test/story?utm_source=rss', 'external_id' => 'publisher-story-445',
            'status' => 'published', 'published_at' => now(),
        ]);
        app(NewsDiscoveryManager::class)->refresh($this->source, $this->editor->id);
        $discovery = NewsDiscovery::query()->firstOrFail();
        $this->assertSame(NewsDiscovery::STATUS_DUPLICATE, $discovery->status);
        $this->assertSame('Editor approved title', News::query()->firstOrFail()->title);
        $this->assertSame('<p>Published editorial body.</p>', News::query()->firstOrFail()->content);
    }

    private function fakeDefaultFeed(): void
    {
        Http::fake(static fn () => Http::response(self::FEED, 200));
    }
}
