<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\{AiRequestGuard, AiRequestLimitException};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{Cache, RateLimiter, Route};
use Tests\TestCase;

class RequestFloodProtectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSame(['sqlite'], array_keys(config('database.connections')));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
        config(['security.trusted_proxies' => []]);
    }

    public function test_api_budget_includes_health_and_invalid_requests_and_recovers_after_retry(): void
    {
        config(['traffic.api_per_minute' => 2]);
        $this->getJson('/api/v1/health')->assertOk();
        $this->getJson('/api/v1/search?q=x')->assertUnprocessable();
        $this->getJson('/api/v1/health')->assertStatus(429)->assertHeader('Retry-After');
        $this->travel(61)->seconds();
        $this->getJson('/api/v1/health')->assertOk();
    }

    public function test_spoofed_forwarded_headers_do_not_reset_a_direct_clients_ip_budget(): void
    {
        config(['traffic.api_per_minute' => 1]);
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10']);
        $this->withHeaders(['X-Forwarded-For' => '198.51.100.1'])->getJson('/api/v1/health')->assertOk();
        $this->withHeaders(['X-Forwarded-For' => '198.51.100.2', 'CF-Connecting-IP' => '198.51.100.3'])
            ->getJson('/api/v1/health')->assertStatus(429);
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.11'])->getJson('/api/v1/health')->assertOk();
    }

    public function test_exact_proxy_chain_uses_the_nearest_untrusted_address_not_an_injected_leftmost_ip(): void
    {
        config(['traffic.api_per_minute' => 1, 'security.trusted_proxies' => ['127.0.0.1']]);
        $this->withHeaders(['X-Forwarded-For' => '198.51.100.1, 203.0.113.5'])->getJson('/api/v1/health')->assertOk();
        $this->withHeaders(['X-Forwarded-For' => '198.51.100.2, 203.0.113.5'])->getJson('/api/v1/health')->assertStatus(429);
    }

    public function test_hourly_submission_limits_survive_the_minute_window(): void
    {
        config(['traffic.contact_per_hour' => 1, 'traffic.newsletter_per_hour' => 1]);
        foreach (['contact', 'newsletter'] as $endpoint) {
            $this->postJson('/api/v1/'.$endpoint, [])->assertUnprocessable();
            $this->travel(61)->seconds();
            $this->postJson('/api/v1/'.$endpoint, [])->assertStatus(429)->assertHeader('Retry-After');
        }
        $this->assertDatabaseCount('contact_messages', 0);
        $this->assertDatabaseCount('newsletter_subscribers', 0);
    }

    public function test_oversized_bodies_and_queries_are_rejected_before_controller_work(): void
    {
        $this->call('POST', '/api/v1/contact', [], [], [], ['CONTENT_TYPE' => 'application/json'], str_repeat('x', 65537))
            ->assertStatus(413);
        $this->getJson('/api/v1/health?q='.str_repeat('x', 4097))->assertStatus(414);
        $this->assertDatabaseCount('contact_messages', 0);
        $body = json_encode(['name' => 'Reader', 'message' => str_repeat('🙂', 10000)], JSON_UNESCAPED_UNICODE);
        $this->call('POST', '/api/v1/contact', [], [], [], ['CONTENT_TYPE' => 'application/json'], $body)
            ->assertUnprocessable(); // Required email/subject missing, but a legitimate Unicode body fits.
    }

    public function test_authenticated_component_budget_is_per_user_and_has_retry_headers(): void
    {
        config(['traffic.livewire_per_minute' => 1]);
        Route::middleware(['web', 'auth', 'throttle:livewire-update'])->get('/traffic-test/actor', fn () => 'ok');
        $this->actingAs(User::factory()->create())->get('/traffic-test/actor')->assertOk();
        $this->get('/traffic-test/actor')->assertStatus(429)->assertHeader('Retry-After');
        $this->actingAs(User::factory()->create())->get('/traffic-test/actor')->assertOk();
        $route = Route::getRoutes()->match(\Illuminate\Http\Request::create('/livewire/update', 'POST'));
        $this->assertContains('throttle:livewire-update', $route->gatherMiddleware());
    }

    public function test_guest_cannot_use_admin_temporary_uploads_and_raster_limits_apply(): void
    {
        $this->post('/livewire/upload-file')->assertRedirect('/admin/login');
        $this->assertContains('max:5120', config('livewire.temporary_file_upload.rules'));
        $this->assertContains('image', config('livewire.temporary_file_upload.rules'));
    }

    public function test_legitimate_signed_editor_upload_still_works_and_stays_on_private_disk(): void
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
        $editor = User::factory()->create();
        $editor->assignRole('editor');
        $this->actingAs($editor);
        // Livewire always uses this special disk in unit tests, regardless of the configured production disk.
        \Illuminate\Support\Facades\Storage::fake('tmp-for-tests');
        $url = \Illuminate\Support\Facades\URL::temporarySignedRoute('livewire.upload-file', now()->addMinute(), [], false);
        $this->post($url, ['files' => [\Illuminate\Http\UploadedFile::fake()->image('legitimate.png', 8, 8)]])
            ->assertOk()->assertJsonCount(1, 'paths');
        $this->assertSame('local', config('livewire.temporary_file_upload.disk'));
        $this->assertCount(1, \Illuminate\Support\Facades\Storage::disk('tmp-for-tests')->allFiles('livewire-tmp'));
        $this->post('/livewire/upload-file', ['files' => [\Illuminate\Http\UploadedFile::fake()->image('unsigned.png', 8, 8)]])
            ->assertUnauthorized();
    }

    public function test_shared_ai_budget_is_per_user_recovers_and_releases_locks_on_failures(): void
    {
        config(['traffic.ai_per_day' => 2]);
        $guard = app(AiRequestGuard::class);
        $this->assertSame('first', $guard->run(1, fn () => 'first'));
        try { $guard->run(1, fn () => throw new \RuntimeException('Mock failure')); }
        catch (\RuntimeException $e) { $this->assertSame('Mock failure', $e->getMessage()); }
        try { $guard->run(1, fn () => $this->fail('Quota must reject')); $this->fail('Expected limit'); }
        catch (AiRequestLimitException $e) { $this->assertStringContainsString('seconds', $e->getMessage()); }
        $this->assertSame('other', $guard->run(2, fn () => 'other'));
        $this->travel(86401)->seconds();
        $this->assertSame('retry', $guard->run(1, fn () => 'retry'));
    }

    public function test_global_ai_capacity_and_same_user_concurrency_fail_fast(): void
    {
        config(['traffic.ai_concurrency' => 1]);
        $guard = app(AiRequestGuard::class);
        $slot = Cache::lock('ai-request-slot:0', 180);
        $slot->get();
        try { $guard->run(1, fn () => $this->fail('Busy pool must not run')); $this->fail('Expected busy'); }
        catch (AiRequestLimitException $e) { $this->assertStringContainsString('capacity', $e->getMessage()); }
        finally { $slot->release(); }
        $guard->run(1, function () use ($guard) {
            try { $guard->run(1, fn () => $this->fail('Nested request must not run')); $this->fail('Expected busy user'); }
            catch (AiRequestLimitException $e) { $this->assertStringContainsString('already running', $e->getMessage()); }
        });
        $this->assertTrue($guard->run(1, fn () => true));
    }

    public function test_ai_draft_job_creation_has_a_separate_database_growth_budget(): void
    {
        config(['traffic.ai_jobs_per_minute' => 1]);
        $guard = app(AiRequestGuard::class);
        $guard->createJob(1);
        $this->expectException(AiRequestLimitException::class);
        $guard->createJob(1);
    }

    public function test_listing_and_search_do_not_sanitize_article_bodies_they_do_not_return(): void
    {
        $author = User::factory()->create();
        \App\Models\BlogPost::create(['user_id' => $author->id, 'title' => 'Matched large body', 'slug' => 'matched-large-body',
            'content' => str_repeat('x', 1_000_001), 'status' => 'published', 'is_public_approved' => true,
            'published_at' => now()->subMinute()]);
        $this->getJson('/api/v1/blog')->assertOk()->assertJsonCount(1, 'data')->assertJsonMissingPath('data.0.content');
        $this->getJson('/api/v1/search?q=Matched')->assertOk()->assertJsonCount(1, 'data.blog')->assertJsonMissingPath('data.blog.0.content');
    }

    public function test_ai_job_quota_halts_the_creation_page_with_a_safe_notification(): void
    {
        $author = \Mockery::mock(User::class)->makePartial();
        $author->id = 7;
        $author->shouldReceive('can')->with('create_ai_generations')->andReturn(true);
        $this->actingAs($author);
        config(['traffic.ai_jobs_per_minute' => 1]);
        app(AiRequestGuard::class)->createJob(7);
        $page = new \App\Filament\Resources\AiGenerationJobResource\Pages\CreateAiGenerationJob;
        $handler = new \ReflectionMethod($page, 'handleRecordCreation');
        try {
            $handler->invoke($page, ['type' => 'article', 'prompt' => 'Valid unsaved editorial prompt']);
            $this->fail('Quota denial must halt creation.');
        } catch (\Filament\Support\Exceptions\Halt $halt) {
            $this->assertTrue($halt->shouldRollbackDatabaseTransaction());
            $notifications = array_values(session('filament.notifications', []));
            $this->assertCount(1, $notifications);
            $notification = $notifications[0];
            $this->assertSame('danger', $notification['status']);
            $this->assertStringContainsString('AI request limit reached.', $notification['title']);
            \Filament\Notifications\Notification::assertNotified($notification['title']);
        }
    }
}
