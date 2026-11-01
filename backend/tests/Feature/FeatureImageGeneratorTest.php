<?php
namespace Tests\Feature;

use App\Models\{AiGenerationJob, AiAuditEvent, Media, News, BlogPost, User};
use App\Filament\Resources\NewsResource\Pages\CreateNews;
use App\Filament\Resources\BlogPostResource\Pages\EditBlogPost;
use App\Services\AiImages\{FeatureImageService, ImageException, ImageProcessor, MockImageProvider, OpenAiImageProvider};
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{DB, Http, Storage};
use Illuminate\Validation\ValidationException;
use Livewire\Livewire;
use Tests\TestCase;

class FeatureImageGeneratorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
        $this->assertEmpty(config('database.connections.sqlite.url'));
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create(); $user->assignRole('editor'); $this->actingAs($user);
        config(['ai_image.enabled' => true, 'ai_image.provider' => 'mock']);
        Storage::fake('local'); Storage::fake('public'); Http::preventStrayRequests();
    }

    private function input(array $changes = []): array
    {
        return array_replace(['method' => 'article', 'title' => 'FICTIONAL QA robotics workshop in Lagos',
            'excerpt' => 'Imaginary test robots, not an actual event.', 'body' => '<p>Disposable fictional article context.</p>',
            'category' => 'Technology', 'custom_prompt' => '', 'style' => 'editorial', 'aspect_ratio' => '16:9'], $changes);
    }

    private function generate(array $changes = []): AiGenerationJob { return app(FeatureImageService::class)->generate('news', $this->input($changes)); }

    private function form()
    {
        return Livewire::test(CreateNews::class)->fillForm(['title' => 'Original fictional headline', 'slug' => 'fictional-image-qa',
            'excerpt' => 'Keep original excerpt', 'source_name' => 'QA fixture', 'source_url' => 'https://example.test/qa-image', 'status' => 'pending']);
    }

    private function consent($form, bool $replace = false)
    {
        return $form->mountAction('reviewFeatureImage')->set('mountedActionsData.0.alt_text', 'Illustration of fictional robots in a workspace.')
            ->set('mountedActionsData.0.confirm_image', true)->set('mountedActionsData.0.replace_image', $replace);
    }

    public function test_isolation_and_article_generation_create_only_private_preview_and_audit(): void
    {
        $this->assertSame('sqlite', DB::connection()->getPdo()->getAttribute(\PDO::ATTR_DRIVER_NAME));
        $this->assertSame('', DB::select('PRAGMA database_list')[0]->file);
        $this->assertNull(config('database.connections.mysql'));
        $job = $this->generate();
        $this->assertSame('feature_image', $job->type);
        $this->assertSame('awaiting_review', $job->status);
        $this->assertStringContainsString('Lagos', $job->prompt);
        $this->assertStringContainsString('not documentary', strtolower($job->prompt));
        $this->assertStringContainsString('MOCK TEST', $job->result_metadata['disclosure']);
        Storage::disk('local')->assertExists($job->preview_path);
        $this->assertDatabaseCount('media', 0); $this->assertDatabaseCount('news', 0);
        $this->assertTrue(AiAuditEvent::where('event', 'feature_image.generated')->exists());
        Http::assertNothingSent();
    }

    public function test_custom_prompts_do_not_invent_locations_and_all_styles_are_supported(): void
    {
        config(['ai_image.per_minute' => 10]);
        foreach (array_keys(config('ai_image.styles')) as $style) {
            $job = $this->generate(['method' => 'custom', 'title' => 'Fictional device concept', 'body' => '',
                'custom_prompt' => 'A conceptual unbranded circuit board on a neutral desk.', 'style' => $style]);
            $this->assertStringContainsString('circuit board', $job->prompt);
            $this->assertStringNotContainsString('Lagos', $job->prompt);
            $this->assertSame($style, $job->result_metadata['style']);
        }
    }

    public function test_ratios_use_supported_sizes_and_normalize_to_exact_dimensions(): void
    {
        foreach (config('ai_image.output_sizes') as $ratio => $size) {
            $job = $this->generate(['aspect_ratio' => $ratio]);
            $info = getimagesizefromstring(Storage::disk('local')->get($job->preview_path));
            $this->assertSame($size, [$info[0], $info[1]]); $this->assertSame('image/jpeg', $info['mime']);
        }
    }

    public function test_mock_is_deterministic_and_delay_never_sends_http(): void
    {
        config(['ai_image.mock_delay_ms' => 20]);
        $provider = app(MockImageProvider::class);
        $this->assertSame($provider->generate('QA prompt', '1024x1024'), $provider->generate('QA prompt', '1024x1024'));
        Http::assertNothingSent();
    }

    public function test_guest_and_user_without_media_permission_are_rejected(): void
    {
        auth()->logout();
        try { $this->generate(); $this->fail('Guest allowed.'); } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) { $this->assertSame(403, $e->getStatusCode()); }
        $user = User::factory()->create(); $this->actingAs($user);
        try { $this->generate(); $this->fail('Unassigned user allowed.'); } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) { $this->assertSame(403, $e->getStatusCode()); }
        $user->assignRole('editor'); \Spatie\Permission\Models\Role::findByName('editor')->revokePermissionTo('manage_media');
        try { $this->generate(); $this->fail('Missing media permission allowed.'); } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) { $this->assertSame(403, $e->getStatusCode()); }
        $this->assertDatabaseCount('ai_generation_jobs', 0);
    }

    public function test_blog_author_can_generate_for_own_record_but_not_another_or_news(): void
    {
        $other = BlogPost::create(['user_id' => auth()->id(), 'title' => 'Other draft', 'slug' => 'other-draft', 'content' => 'Private', 'status' => 'draft']);
        $author = User::factory()->create(); $author->assignRole('author'); $this->actingAs($author);
        try { app(FeatureImageService::class)->generate('blog', $this->input(), $other->id); $this->fail('Ownership bypass.'); }
        catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) { $this->assertSame(403, $e->getStatusCode()); }
        $own = BlogPost::create(['user_id' => $author->id, 'title' => 'Own draft', 'slug' => 'own-draft', 'content' => 'Private', 'status' => 'draft']);
        $this->assertSame('awaiting_review', app(FeatureImageService::class)->generate('blog', $this->input(), $own->id)->status);
        try { $this->generate(); $this->fail('Author generated News.'); } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) { $this->assertSame(403, $e->getStatusCode()); }
    }

    public function test_validation_limits_and_disabled_feature_make_no_provider_request(): void
    {
        foreach ([['custom_prompt' => str_repeat('x', 2001)], ['method' => 'custom', 'custom_prompt' => ''], ['style' => 'unknown'], ['aspect_ratio' => '3:2']] as $bad) {
            try { $this->generate($bad); $this->fail('Invalid input accepted.'); } catch (ValidationException $e) { $this->assertNotEmpty($e->errors()); }
        }
        config(['ai_image.enabled' => false]);
        try { $this->generate(); $this->fail('Disabled feature allowed.'); } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) { $this->assertSame(503, $e->getStatusCode()); }
        $this->assertDatabaseCount('ai_generation_jobs', 0); Http::assertNothingSent();
    }

    public function test_failure_quota_and_invalid_image_are_safely_audited(): void
    {
        foreach (['failure','quota','invalid'] as $scenario) {
            config(['ai_image.mock_scenario' => $scenario]);
            try { $this->generate(); $this->fail('Failed generation appeared successful.'); }
            catch (ImageException $e) { $this->assertNotEmpty($e->reason); }
        }
        $this->assertSame(3, AiGenerationJob::where('status', 'failed')->count());
        $this->assertSame(3, AiAuditEvent::where('event', 'feature_image.failed')->count());
        $this->assertDatabaseCount('media', 0); $this->assertDatabaseCount('news', 0);
    }

    public function test_openai_contract_uses_backend_credentials_and_no_arbitrary_size_or_url_fetch(): void
    {
        config(['ai_image.allow_billable' => true, 'ai_image.model' => 'gpt-image-2.5-flare', 'ai_studio.api_key' => 'test-secret-only']);
        $bytes = app(MockImageProvider::class)->generate('QA visual', '1024x1024');
        Http::fake([OpenAiImageProvider::ENDPOINT => Http::response(['data' => [['b64_json' => base64_encode($bytes)]]])]);
        $this->assertSame($bytes, app(OpenAiImageProvider::class)->generate('A sufficiently long test-only image prompt', '1024x1024', true));
        Http::assertSent(fn ($r) => $r->url() === OpenAiImageProvider::ENDPOINT && $r->hasHeader('Authorization', 'Bearer test-secret-only')
            && $r['n'] === 1 && $r['size'] === '1024x1024' && $r['output_format'] === 'png' && ! isset($r['response_format']));
        Http::assertSentCount(1);
    }

    public function test_real_provider_is_blocked_without_both_cost_authorizations(): void
    {
        foreach ([[false,true],[true,false]] as [$enabled,$confirmation]) {
            config(['ai_image.allow_billable' => $enabled]);
            try { app(OpenAiImageProvider::class)->generate('A test-only image prompt', '1024x1024', $confirmation); $this->fail('Cost authorization bypass.'); }
            catch (ImageException $e) { $this->assertSame('configuration', $e->reason); }
        }
        Http::assertNothingSent();
    }

    public function test_real_provider_quota_malformed_and_oversized_responses_are_safe(): void
    {
        config(['ai_image.allow_billable' => true, 'ai_image.model' => 'gpt-image-2.5-flare', 'ai_studio.api_key' => 'private-test-key']);
        foreach ([[429, ['error' => ['message' => 'private-test-key secret prompt', 'code' => 'insufficient_quota']]],
            [200, ['data' => [['url' => 'https://untrusted.example/image']]]], [200, 'invalid private-test-key JSON']] as [$status,$body]) {
            Http::fake([OpenAiImageProvider::ENDPOINT => Http::response($body, $status)]);
            try { app(OpenAiImageProvider::class)->generate('A test-only image prompt', '1024x1024', true); $this->fail('Malformed response accepted.'); }
            catch (ImageException $e) { $this->assertStringNotContainsString('private-test-key', $e->getMessage()); }
        }
        config(['ai_image.max_response_bytes' => 30]); Http::fake([OpenAiImageProvider::ENDPOINT => Http::response(str_repeat('x', 100))]);
        $this->expectException(ImageException::class);
        app(OpenAiImageProvider::class)->generate('A test-only image prompt', '1024x1024', true);
    }

    public function test_preview_auth_owner_context_expiration_and_cleanup(): void
    {
        $job = $this->generate(); $url = route('feature-images.preview', $job);
        $response = $this->get($url)->assertOk()->assertHeader('Content-Type', 'image/jpeg')->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertTrue($response->headers->hasCacheControlDirective('no-store'));
        $owner = auth()->user(); $other = User::factory()->create(); $other->assignRole('editor'); $this->actingAs($other);
        $this->get($url)->assertForbidden(); $this->actingAs($owner);
        $this->travel(31)->minutes(); $this->get($url)->assertStatus(410);
        $this->artisan('ai-images:cleanup')->assertExitCode(0); Storage::disk('local')->assertMissing($job->preview_path);
        $this->assertDatabaseHas('ai_generation_jobs', ['id' => $job->id]);
        auth()->logout(); $this->get($url)->assertRedirect('/admin/login');
    }

    public function test_media_storage_is_idempotent_with_alt_disclosure_and_dimensions(): void
    {
        $job = $this->generate(); $service = app(FeatureImageService::class);
        $media = $service->storeMedia($job->id, 'news', null, 'Illustration of fictional robots.');
        Storage::disk('public')->assertExists($media->path);
        $this->assertSame(1280, $media->width); $this->assertSame(720, $media->height);
        $this->assertTrue($media->metadata['ai_generated']); $this->assertStringContainsString('MOCK', $media->metadata['disclosure']);
        $this->assertSame($media->id, $service->storeMedia($job->id, 'news', null, 'Updated illustration alt.')->id);
        $this->assertDatabaseCount('media', 1);
        $this->travel(31)->minutes(); $service->cleanup(); Storage::disk('public')->assertExists($media->path);
    }

    public function test_regeneration_replaces_private_preview_and_preserves_editor_fields(): void
    {
        $form = $this->form()->callAction('aiFeatureImage', $this->input())->assertHasNoActionErrors();
        $first = AiGenerationJob::findOrFail($form->get('featureImageJobId'));
        $form->callAction('aiFeatureImage', $this->input(['method' => 'custom', 'custom_prompt' => 'A fictional circuit board for QA only.']))
            ->assertHasNoActionErrors()->assertSet('data.title', 'Original fictional headline')->assertSet('data.excerpt', 'Keep original excerpt');
        $this->assertNotSame($first->id, $form->get('featureImageJobId')); Storage::disk('local')->assertMissing($first->preview_path);
        $this->assertDatabaseCount('news', 0);
    }

    public function test_news_image_assignment_requires_review_and_existing_image_confirmation(): void
    {
        Storage::disk('public')->put('news-images/old.jpg', 'old-test-image');
        $form = $this->form()->set('data.featured_image', ['old' => 'news-images/old.jpg'])->callAction('aiFeatureImage', $this->input());
        $this->consent($form)->call('assignFeatureImage')->assertHasErrors(['mountedActionsData.0.replace_image']);
        $this->assertDatabaseCount('media', 0);
        $form->set('mountedActionsData.0.replace_image', true)->call('assignFeatureImage')->assertSet('data.title', 'Original fictional headline')
            ->assertSet('data.excerpt', 'Keep original excerpt')->assertSet('data.status', 'pending')
            ->set('data.status', 'published')->set('data.featured', true)->call('create')->assertHasNoFormErrors();
        $news = News::sole(); $this->assertSame(Media::sole()->path, $news->featured_image);
        $this->assertSame('pending', $news->status); $this->assertNull($news->published_at); $this->assertFalse($news->featured);
    }

    public function test_blog_assignment_preserves_copy_and_forces_draft_and_unapproved_save(): void
    {
        $post = BlogPost::create(['user_id' => auth()->id(), 'title' => 'Fictional Blog QA', 'slug' => 'fictional-blog-image', 'content' => '<p>Keep body</p>', 'status' => 'draft', 'is_public_approved' => true]);
        $form = Livewire::test(EditBlogPost::class, ['record' => $post->getRouteKey()])->callAction('aiFeatureImage', $this->input());
        $this->consent($form)->call('assignFeatureImage')->assertSet('data.content', '<p>Keep body</p>')
            ->set('data.status', 'published')->set('data.is_public_approved', true)->call('save')->assertHasNoFormErrors();
        $post->refresh(); $this->assertSame('draft', $post->status); $this->assertFalse($post->is_public_approved);
        $this->assertNull($post->published_at); $this->assertSame(Media::sole()->path, $post->featured_image);
    }

    public function test_save_to_library_does_not_assign_or_save_article(): void
    {
        $form = $this->form()->callAction('aiFeatureImage', $this->input());
        $this->consent($form)->call('saveFeatureImageMedia')->assertSet('data.title', 'Original fictional headline');
        $this->assertEmpty($form->get('data.featured_image'));
        $this->assertDatabaseCount('media', 1); $this->assertDatabaseCount('news', 0);
    }

    public function test_minute_and_daily_limits_are_shared_across_content_types(): void
    {
        config(['ai_image.per_minute' => 1, 'ai_image.per_day' => 1]); $this->generate();
        foreach ([0,61] as $seconds) {
            if ($seconds) $this->travel($seconds)->seconds();
            try { app(FeatureImageService::class)->generate('blog', $this->input()); $this->fail('Generation limit bypass.'); }
            catch (ValidationException $e) { $this->assertNotEmpty($e->errors()['custom_prompt']); }
        }
        $this->assertDatabaseCount('ai_generation_jobs', 1);
    }

    public function test_errors_preserve_form_and_do_not_create_fake_success(): void
    {
        config(['ai_image.mock_scenario' => 'quota']);
        $this->form()->callAction('aiFeatureImage', $this->input())->assertSet('featureImageJobId', null)
            ->assertSet('data.title', 'Original fictional headline')->assertSet('data.excerpt', 'Keep original excerpt')
            ->assertNotified('Image quota exhausted. Check credits or try later; your article is unchanged.');
        $this->assertDatabaseCount('media', 0);
    }

    public function test_metadata_is_exposed_by_resources_without_publishing_fixture_articles(): void
    {
        $job = $this->generate(); $media = app(FeatureImageService::class)->storeMedia($job->id, 'news', null, 'Illustration of QA devices.');
        $news = new News(['title' => 'Unpublished fixture', 'featured_image' => $media->path, 'status' => 'pending']);
        \App\Support\EditorialImageMetadata::attach([$news]);
        $data = (new \App\Http\Resources\NewsResource($news))->resolve(request());
        $this->assertSame('Illustration of QA devices.', $data['featured_image_alt']);
        $this->assertStringContainsString('not documentary', $data['featured_image_disclosure']);
        $this->assertDatabaseCount('news', 0);
    }

    public function test_failed_regeneration_keeps_prior_preview_and_prompt_open(): void
    {
        $form = $this->form()->callAction('aiFeatureImage', $this->input());
        $id = $form->get('featureImageJobId'); $path = AiGenerationJob::findOrFail($id)->preview_path;
        config(['ai_image.mock_scenario' => 'quota']);
        $form->callAction('aiFeatureImage', $this->input(['method' => 'custom', 'custom_prompt' => 'Keep this requested fictional robot scene.']))
            ->assertActionMounted('aiFeatureImage')->assertSet('featureImageJobId', $id)
            ->assertSet('mountedActionsData.0.custom_prompt', 'Keep this requested fictional robot scene.');
        Storage::disk('local')->assertExists($path);
    }

    public function test_regeneration_clears_billable_confirmation_and_requires_it_again(): void
    {
        config(['ai_image.provider' => 'openai', 'ai_image.allow_billable' => true, 'ai_image.model' => 'gpt-image-2.5-flare', 'ai_studio.api_key' => 'fake-test-key']);
        $bytes = app(MockImageProvider::class)->generate('QA fixture', '1536x1024');
        Http::fake([OpenAiImageProvider::ENDPOINT => Http::response(['data' => [['b64_json' => base64_encode($bytes)]]])]);
        $form = $this->form()->callAction('aiFeatureImage', $this->input(['authorize_cost' => true]))->assertHasNoActionErrors();
        $form->mountAction('reviewFeatureImage')->call('editFeatureImagePrompt')->assertActionMounted('aiFeatureImage')
            ->assertSet('mountedActionsData.0.authorize_cost', false)->callMountedAction()->assertHasActionErrors(['authorize_cost' => 'accepted']);
        Http::assertSentCount(1);
    }

    public function test_orphan_cleanup_and_traversal_protection_do_not_touch_other_workflows(): void
    {
        $path = FeatureImageService::PREVIEW_DIRECTORY.'/'.\Illuminate\Support\Str::uuid().'.jpg';
        Storage::disk('local')->put($path, 'Abandoned test bytes'); touch(Storage::disk('local')->path($path), time() - 4000);
        Storage::disk('local')->put('ai-studio/previews/legacy.jpg', 'Keep unrelated AI Studio file');
        app(FeatureImageService::class)->cleanup();
        Storage::disk('local')->assertMissing($path); Storage::disk('local')->assertExists('ai-studio/previews/legacy.jpg');
        $job = $this->generate(); $job->update(['preview_path' => '../../private-file.jpg']);
        $this->get(route('feature-images.preview', $job))->assertNotFound();
    }
}
