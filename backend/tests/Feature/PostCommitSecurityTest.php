<?php

namespace Tests\Feature;

use App\Filament\Resources\BlogPostResource\Pages\EditBlogPost;
use App\Models\{AiGenerationJob, BlogPost, User};
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{Http, Storage};
use Livewire\Livewire;
use Tests\TestCase;

class PostCommitSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSame(['sqlite'], array_keys(config('database.connections')));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_author_edit_of_approved_blog_requires_fresh_review(): void
    {
        $author = User::factory()->create();
        $author->assignRole('author');
        $post = BlogPost::create(['user_id' => $author->id, 'title' => 'Approved original',
            'slug' => 'approved-original', 'content' => '<p>Reviewed body</p>', 'status' => 'published',
            'published_at' => now()->subMinute(), 'is_public_approved' => true, 'featured' => true]);
        $this->getJson('/api/v1/blog/approved-original')->assertOk();
        $this->actingAs($author);
        Livewire::test(EditBlogPost::class, ['record' => $post->id])
            ->fillForm(['content' => '<p>Unreviewed author replacement</p>'])
            ->call('save')->assertHasNoFormErrors();
        $post->refresh();
        $this->assertSame('<p>Unreviewed author replacement</p>', $post->content);
        $this->assertSame('draft', $post->status);
        $this->assertFalse($post->is_public_approved);
        $this->assertNull($post->published_at);
        $this->assertFalse($post->featured);
        $this->getJson('/api/v1/blog/approved-original')->assertNotFound();
        $this->getJson('/api/v1/blog')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/search?q=Unreviewed')->assertJsonCount(0, 'data.blog');

        $reviewer = User::factory()->create();
        $reviewer->assignRole('editor');
        $this->actingAs($reviewer);
        Livewire::test(EditBlogPost::class, ['record' => $post->id])
            ->fillForm(['status' => 'published', 'published_at' => now()->subMinute()->format('Y-m-d H:i:s'),
                'is_public_approved' => true])->call('save')->assertHasNoFormErrors();
        $this->getJson('/api/v1/blog/approved-original')->assertOk();
    }

    public function test_retained_preview_permission_does_not_bypass_panel_role_revocation(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $user->givePermissionTo('view_ai_studio');
        $job = $this->previewJob($user);
        $this->actingAs($user)->get(route('ai-studio.preview', $job))->assertForbidden();
        $user->assignRole('editor');
        $this->get(route('ai-studio.preview', $job))->assertOk()->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_oversized_legacy_preview_is_rejected_before_reading_the_file(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $user->assignRole('editor');
        $job = $this->previewJob($user);
        $disk = \Mockery::mock(\Illuminate\Filesystem\FilesystemAdapter::class);
        $disk->shouldReceive('exists')->with($job->preview_path)->andReturn(true);
        $disk->shouldReceive('size')->with($job->preview_path)->andReturn(100);
        $disk->shouldNotReceive('get');
        Storage::shouldReceive('disk')->with('local')->andReturn($disk);
        config(['ai_studio.image_max_bytes' => 1]);
        $this->actingAs($user)->get(route('ai-studio.preview', $job))->assertNotFound();
    }

    private function previewJob(User $user): AiGenerationJob
    {
        $path = 'ai-studio/previews/12345678-1234-1234-1234-123456789abc.png';
        $bytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=');
        Storage::disk('local')->put($path, $bytes);
        return AiGenerationJob::create(['type' => 'image', 'status' => 'awaiting_review', 'prompt' => 'Disposable test',
            'requested_by' => $user->id, 'preview_path' => $path, 'preview_mime' => 'image/png', 'preview_size' => strlen($bytes)]);
    }

    public function test_oversized_rss_is_rejected_even_with_a_false_content_length(): void
    {
        $seen = [];
        Http::fake(function ($request, $options) use (&$seen) {
            $seen[] = $options;
            return Http::response(str_repeat('x', 1_500_001), 200, ['Content-Length' => '1']);
        });
        $this->artisan('news:sync-rss')->assertExitCode(1);
        $this->assertDatabaseCount('news', 0);
        $this->assertCount(2, $seen);
        foreach ($seen as $options) {
            $this->assertTrue($options['stream']);
            $this->assertFalse($options['allow_redirects']);
        }
    }

    public function test_redirecting_rss_is_not_followed(): void
    {
        $seen = [];
        Http::fake(function ($request, $options) use (&$seen) {
            $seen[] = $options;
            return Http::response('', 302, ['Location' => 'http://127.0.0.1/private']);
        });
        $this->artisan('news:sync-rss')->assertExitCode(1);
        $this->assertDatabaseCount('news', 0);
        Http::assertSentCount(2);
        foreach ($seen as $options) $this->assertFalse($options['allow_redirects']);
    }

    public function test_rss_transport_exception_details_are_not_printed(): void
    {
        Http::fake(fn () => throw new \RuntimeException('PRIVATE-TRANSPORT-DETAIL'));
        $this->artisan('news:sync-rss')->doesntExpectOutputToContain('PRIVATE-TRANSPORT-DETAIL')->assertExitCode(1);
    }

    public function test_editorial_transport_runtime_exception_does_not_escape_the_provider_boundary(): void
    {
        config(['ai_studio.api_key' => 'disposable-test', 'ai_editorial.model' => 'mocked-model']);
        Http::fake(fn () => throw new \RuntimeException('PRIVATE-TRANSPORT-DETAIL'));
        try {
            app(\App\Services\AiEditorial\ResponsesEditorialProvider::class)->suggest([], []);
            $this->fail('Transport failure should throw.');
        } catch (\RuntimeException $e) {
            $this->assertSame('AI request failed; your article is unchanged.', $e->getMessage());
        }
    }

    public function test_editorial_quota_failure_keeps_its_safe_actionable_message(): void
    {
        config(['ai_studio.api_key' => 'disposable-test', 'ai_editorial.model' => 'mocked-model']);
        Http::fake(['api.openai.com/*' => Http::response(['error' => ['message' => 'PRIVATE-QUOTA-DETAIL']], 429)]);
        try {
            app(\App\Services\AiEditorial\ResponsesEditorialProvider::class)->suggest([], []);
            $this->fail('Quota failure should throw.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('quota or rate limit', $e->getMessage());
            $this->assertStringNotContainsString('PRIVATE-QUOTA-DETAIL', $e->getMessage());
        }
    }

    public function test_stale_ai_studio_job_cannot_repeat_a_completed_generation(): void
    {
        $user = User::factory()->create();
        $user->assignRole('editor');
        $this->actingAs($user);
        config(['ai_studio.enabled' => true, 'ai_studio.provider' => 'fake']);
        $provider = new \Tests\Support\FakeAiGenerationProvider;
        app()->instance(\App\Services\AiStudio\AiGenerationProvider::class, $provider);
        $manager = app(\App\Services\AiStudio\AiStudioManager::class);
        $job = $manager->createJob($user->id, ['type' => 'article', 'prompt' => 'Disposable article generation']);
        $stale = AiGenerationJob::findOrFail($job->id);
        $manager->generate($job, $user->id);
        try {
            $manager->generate($stale, $user->id);
            $this->fail('Stale draft state must not permit a second generation.');
        } catch (\App\Services\AiStudio\AiStudioException $e) {
            $this->assertStringContainsString('Only draft or failed', $e->getMessage());
        }
        $this->assertSame(1, $provider->articleCalls);
        $this->assertSame('awaiting_review', $job->fresh()->status);
    }

    public function test_ai_studio_inflight_lock_prevents_provider_calls(): void
    {
        $user = User::factory()->create();
        $user->assignRole('editor');
        $this->actingAs($user);
        config(['ai_studio.enabled' => true, 'ai_studio.provider' => 'fake']);
        $provider = new \Tests\Support\FakeAiGenerationProvider;
        app()->instance(\App\Services\AiStudio\AiGenerationProvider::class, $provider);
        $manager = app(\App\Services\AiStudio\AiStudioManager::class);
        $job = $manager->createJob($user->id, ['type' => 'article', 'prompt' => 'Disposable locked generation']);
        $lock = \Illuminate\Support\Facades\Cache::lock('ai-studio-generation:'.$job->id, 60);
        $this->assertTrue($lock->get());
        try {
            $manager->generate($job, $user->id);
            $this->fail('A concurrent generation must be rejected.');
        } catch (\App\Services\AiStudio\AiStudioException $e) {
            $this->assertStringContainsString('already generating', $e->getMessage());
            $this->assertSame(0, $provider->articleCalls);
        } finally {
            $lock->release();
        }
    }
}
