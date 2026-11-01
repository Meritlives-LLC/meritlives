<?php

namespace Tests\Feature;

use App\Filament\Resources\AiGenerationJobResource;
use App\Models\AiAuditEvent;
use App\Models\AiGenerationJob;
use App\Models\AiPromptTemplate;
use App\Models\BlogPost;
use App\Models\User;
use App\Services\AiStudio\AiGenerationProvider;
use App\Services\AiStudio\AiStudioException;
use App\Services\AiStudio\AiStudioManager;
use App\Services\AiStudio\OpenAiGenerationProvider;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;
use Tests\Support\FakeAiGenerationProvider;
use Tests\TestCase;

class AiStudioWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $editor;
    private FakeAiGenerationProvider $fake;
    private AiStudioManager $manager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->editor = User::factory()->create();
        $this->editor->assignRole(Role::findByName('editor', 'web'));
        $this->actingAs($this->editor);
        $this->fake = new FakeAiGenerationProvider();
        $this->app->instance(AiGenerationProvider::class, $this->fake);
        $this->manager = $this->app->make(AiStudioManager::class);
        Storage::fake('local');
        Storage::fake('public');
        config(['ai_studio.enabled' => true, 'ai_studio.provider' => 'fake', 'ai_studio.image_max_bytes' => 1024]);
    }

    public function test_default_disabled_configuration_prevents_provider_calls(): void
    {
        config(['ai_studio.enabled' => false]);
        $job = $this->makeJob();

        try {
            $this->manager->generate($job, $this->editor->id);
            $this->fail('Disabled provider should not be called.');
        } catch (AiStudioException $exception) {
            $this->assertStringContainsString('disabled', strtolower($exception->getMessage()));
        }

        $this->assertSame(0, $this->fake->articleCalls);
        $this->assertSame(AiGenerationJob::STATUS_DRAFT, $job->fresh()->status);
    }

    public function test_enabled_flag_without_provider_still_makes_no_provider_call(): void
    {
        config(['ai_studio.enabled' => true, 'ai_studio.provider' => 'none']);
        $job = $this->makeJob();
        $this->expectException(AiStudioException::class);
        $this->manager->generate($job, $this->editor->id);
    }

    public function test_unassigned_user_cannot_create_or_generate_ai_jobs(): void
    {
        $unassigned = User::factory()->create();
        $job = AiGenerationJob::create(['type' => 'article', 'status' => 'draft', 'prompt' => 'A valid test prompt.', 'requested_by' => $unassigned->id]);
        $this->actingAs($unassigned);

        $this->assertFalse(AiGenerationJobResource::canViewAny());
        $this->expectException(AiStudioException::class);
        $this->manager->generate($job, $unassigned->id);
    }

    public function test_prompt_validation_and_version_snapshot_are_enforced(): void
    {
        $template = AiPromptTemplate::create(['name' => 'Article', 'slug' => 'article', 'prompt' => 'Write a long-form article.', 'version' => 1, 'is_active' => true, 'created_by' => $this->editor->id]);

        try {
            $this->manager->createJob($this->editor->id, ['type' => 'article', 'prompt' => 'too short']);
            $this->fail('Short prompt should fail validation.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('prompt', $exception->errors());
        }

        $job = $this->manager->createJob($this->editor->id, ['type' => 'article', 'prompt' => 'Write a safe article preview.', 'prompt_template_id' => $template->id]);
        $this->assertSame(AiGenerationJob::STATUS_DRAFT, $job->status);
        $this->assertSame(1, $job->prompt_template_version);
        $template->update(['prompt' => 'Write an updated safe article preview.']);
        $this->assertSame(2, $template->fresh()->version);
    }

    public function test_article_preview_requires_review_and_only_explicitly_creates_unpublished_blog_draft(): void
    {
        $job = $this->manager->generate($this->makeJob(), $this->editor->id);
        $this->assertSame(AiGenerationJob::STATUS_AWAITING_REVIEW, $job->status);
        $this->assertSame('A Test Article', $job->result_title);
        $this->assertStringNotContainsString('<script', $job->result_body);
        $this->assertDatabaseCount('blog_posts', 0);

        $job = $this->manager->review($job, $this->editor->id, true, 'Reviewed by editor.');
        $this->assertSame(AiGenerationJob::STATUS_APPROVED, $job->status);
        $post = $this->manager->createBlogDraft($job, $this->editor->id);
        $this->assertSame('draft', $post->status);
        $this->assertSame(BlogPost::class, $job->fresh()->associated_model);
        $this->getJson('/api/v1/blog')->assertOk()->assertJsonMissing(['title' => 'A Test Article']);
        $this->assertDatabaseHas('ai_audit_events', ['event' => 'review.approved', 'to_status' => 'approved']);
        $this->assertDatabaseHas('ai_audit_events', ['event' => 'editorial.blog_draft_created']);
    }

    public function test_rejection_is_recorded_and_cannot_create_blog_content(): void
    {
        $job = $this->manager->generate($this->makeJob(), $this->editor->id);
        $job = $this->manager->review($job, $this->editor->id, false, 'Needs revision.');
        $this->assertSame(AiGenerationJob::STATUS_REJECTED, $job->status);
        $this->expectException(AiStudioException::class);
        $this->manager->createBlogDraft($job, $this->editor->id);
    }

    public function test_failed_provider_is_safely_reported_and_not_exposed(): void
    {
        $this->fake->fail = true;
        $job = $this->manager->generate($this->makeJob(), $this->editor->id);
        $this->assertSame(AiGenerationJob::STATUS_FAILED, $job->status);
        $this->assertStringNotContainsString('credential', $job->failure_message);
        $this->assertDatabaseHas('ai_audit_events', ['event' => 'generation.failed', 'to_status' => 'failed']);
    }

    public function test_openai_secrets_prompts_and_provider_body_do_not_leak_from_failed_workflow(): void
    {
        $apiKey = 'workflow-secret-api-key';
        $prompt = 'workflow-private-prompt-marker';
        $providerBody = 'workflow-private-provider-response-marker';
        config([
            'ai_studio.provider' => 'openai',
            'ai_studio.api_key' => $apiKey,
            'ai_studio.model' => 'test-model',
        ]);
        $this->manager = new AiStudioManager(app(OpenAiGenerationProvider::class));
        Http::fake(['api.openai.com/*' => Http::response(['error' => $providerBody.' '.$apiKey], 500)]);
        Log::spy();

        $job = $this->manager->createJob($this->editor->id, ['type' => 'article', 'prompt' => $prompt]);
        $job = $this->manager->generate($job, $this->editor->id);

        $this->assertSame(AiGenerationJob::STATUS_FAILED, $job->status);
        $this->assertSame('Generation failed. Check server logs for the internal error.', $job->failure_message);
        Http::assertSent(fn ($request): bool => $request->hasHeader('Authorization', 'Bearer '.$apiKey)
            && $request['messages'][1]['content'] === $prompt);

        $audit = AiAuditEvent::query()->where('job_id', $job->id)->get();
        $auditText = json_encode($audit->pluck('metadata')->all(), JSON_THROW_ON_ERROR);
        $this->assertStringNotContainsString($apiKey, $auditText);
        $this->assertStringNotContainsString('Bearer '.$apiKey, $auditText);
        $this->assertStringNotContainsString($prompt, $auditText);
        $this->assertStringNotContainsString($providerBody, $auditText);

        Log::shouldHaveReceived('warning')->once()->withArgs(function (string $message, array $context) use ($apiKey, $prompt, $providerBody): bool {
            $text = json_encode([$message, $context], JSON_THROW_ON_ERROR);
            return ! str_contains($text, $apiKey)
                && ! str_contains($text, 'Bearer '.$apiKey)
                && ! str_contains($text, $prompt)
                && ! str_contains($text, $providerBody);
        });

        $publicResponse = $this->getJson('/api/v1/ai-studio/jobs');
        $this->assertNotSame(200, $publicResponse->getStatusCode());
        foreach ([$apiKey, 'Bearer '.$apiKey, $prompt, $providerBody] as $sensitive) {
            $this->assertStringNotContainsString($sensitive, $publicResponse->getContent());
            $this->assertStringNotContainsString($sensitive, $job->failure_message);
        }
    }

    public function test_approved_image_is_validated_stored_privately_then_attached_only_on_explicit_action(): void
    {
        $job = $this->manager->generate($this->makeJob('image'), $this->editor->id);
        $this->assertSame(AiGenerationJob::STATUS_AWAITING_REVIEW, $job->status);
        Storage::disk('local')->assertExists($job->preview_path);
        $job = $this->manager->review($job, $this->editor->id, true, null);
        Storage::disk('public')->assertExists($job->approved_image_path);

        $post = BlogPost::create(['user_id' => $this->editor->id, 'title' => 'Existing', 'slug' => 'existing', 'content' => 'Text', 'status' => 'draft']);
        $this->assertNull($post->fresh()->featured_image);
        $this->manager->attachImageToBlogPost($job, $post, $this->editor->id);
        $this->assertSame($job->approved_image_path, $post->fresh()->featured_image);
    }

    public function test_private_image_preview_requires_ai_view_permission(): void
    {
        $job = $this->manager->generate($this->makeJob('image'), $this->editor->id);
        $unassigned = User::factory()->create();
        $this->actingAs($unassigned)->get(route('ai-studio.preview', $job))->assertForbidden();
        $this->actingAs($this->editor)->get(route('ai-studio.preview', $job))->assertOk()->assertHeader('Content-Type', 'image/png');
    }

    public function test_invalid_image_data_fails_and_traversal_preview_path_is_rejected(): void
    {
        $this->fake->imageResult = ['bytes' => 'not-an-image', 'mime' => 'image/png'];
        $job = $this->manager->generate($this->makeJob('image'), $this->editor->id);
        $this->assertSame(AiGenerationJob::STATUS_FAILED, $job->status);

        $job->update(['status' => AiGenerationJob::STATUS_AWAITING_REVIEW, 'preview_path' => '../.env', 'preview_mime' => 'image/png']);
        $this->expectException(AiStudioException::class);
        $this->manager->review($job, $this->editor->id, true, null);
    }

    public function test_image_size_limit_is_enforced(): void
    {
        config(['ai_studio.image_max_bytes' => 1]);
        $job = $this->manager->generate($this->makeJob('image'), $this->editor->id);
        $this->assertSame(AiGenerationJob::STATUS_FAILED, $job->status);
        $this->assertStringContainsString('size limit', $job->failure_message);
        $this->assertNull($job->preview_path);
    }

    public function test_rejection_requires_a_reason(): void
    {
        $job = $this->manager->generate($this->makeJob(), $this->editor->id);
        $this->expectException(AiStudioException::class);
        $this->manager->review($job, $this->editor->id, false, null);
    }

    public function test_audit_events_are_append_only_and_ai_has_no_public_api(): void
    {
        $this->getJson('/api/v1/ai-studio/jobs')->assertNotFound();
        $this->assertDatabaseCount('ai_generation_jobs', 0);
        $this->assertDatabaseCount('ai_prompt_templates', 0);
        $this->assertDatabaseCount('ai_audit_events', 0);
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasTable('ai_generation_jobs'));
        $job = $this->makeJob();
        $event = $job->auditEvents()->firstOrFail();
        $this->expectException(\LogicException::class);
        $event->delete();
    }

    private function makeJob(string $type = 'article'): AiGenerationJob
    {
        return $this->manager->createJob($this->editor->id, [
            'type' => $type,
            'prompt' => 'Write a safe and useful MERITLIVES preview.',
        ]);
    }
}
