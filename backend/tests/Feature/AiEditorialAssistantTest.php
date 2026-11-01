<?php

namespace Tests\Feature;

use App\Filament\Resources\NewsResource\Pages\CreateNews;
use App\Filament\Resources\BlogPostResource\Pages\CreateBlogPost;
use App\Filament\Resources\BlogPostResource\Pages\EditBlogPost;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\News;
use App\Models\User;
use App\Services\AiEditorial\EditorialAssistant;
use App\Services\AiEditorial\MockEditorialProvider;
use App\Services\AiEditorial\ResponsesEditorialProvider;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Livewire\Livewire;
use RuntimeException;
use Tests\TestCase;

class AiEditorialAssistantTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $editor = User::factory()->create();
        $editor->assignRole('editor');
        $this->actingAs($editor);
        config(['ai_editorial.enabled' => true, 'ai_editorial.provider' => 'mock']);
        Http::preventStrayRequests();
    }

    private function input(): array
    {
        return ['topic' => 'Nigerian technology', 'operation' => 'draft', 'length' => 'short',
            'source_text' => 'Editor verified facts about the technology sector.',
            'source_name' => 'Original source', 'source_url' => 'https://example.com/original'];
    }

    public function test_mock_preserves_attribution_and_never_creates_content(): void
    {
        $result = app(EditorialAssistant::class)->generate('news', $this->input());
        $this->assertStringContainsString('[Mock', $result['title']);
        $this->assertSame('https://example.com/original', $result['source_url']);
        $this->assertNull($result['category_id']);
        $this->assertNotEmpty($result['verification_checklist']);
        $this->assertDatabaseCount('news', 0);
        Http::assertNothingSent();
    }

    public function test_news_url_without_facts_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        app(EditorialAssistant::class)->generate('news', array_replace($this->input(), ['source_text' => '']));
    }

    public function test_oversized_input_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        app(EditorialAssistant::class)->generate('news', array_replace($this->input(), ['source_text' => str_repeat('x', 16001)]));
    }

    public function test_generation_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            app(EditorialAssistant::class)->generate('news', $this->input());
        }
        $this->expectException(ValidationException::class);
        app(EditorialAssistant::class)->generate('news', $this->input());
    }

    public function test_wrong_category_type_and_inactive_categories_are_rejected(): void
    {
        $category = Category::create(['name' => 'Blog', 'slug' => 'blog', 'type' => 'blog', 'status' => 'active']);
        $output = app(MockEditorialProvider::class)->suggest($this->input(), []);
        $output['category_id'] = $category->id;
        $this->expectException(RuntimeException::class);
        app(EditorialAssistant::class)->validateOutput($output, 'news');
    }

    public function test_author_cannot_edit_another_authors_blog_or_generate_news(): void
    {
        $author = User::factory()->create();
        $author->assignRole('author');
        $post = BlogPost::create(['user_id' => auth()->id(), 'title' => 'Private', 'slug' => 'private', 'content' => 'Text', 'status' => 'draft']);
        $this->actingAs($author);
        foreach ([['blog', $post->id], ['news', null]] as [$type, $id]) {
            try {
                app(EditorialAssistant::class)->generate($type, $this->input(), $id);
                $this->fail('Authorization should reject this request.');
            } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
                $this->assertSame(403, $e->getStatusCode());
            }
        }
    }

    public function test_responses_request_is_structured_and_uses_backend_key(): void
    {
        config(['ai_studio.api_key' => 'test-secret', 'ai_editorial.model' => 'test-model']);
        $output = app(MockEditorialProvider::class)->suggest($this->input(), []);
        Http::fake(['api.openai.com/*' => Http::response(['status' => 'completed', 'output' => [
            ['type' => 'message', 'content' => [['type' => 'output_text', 'text' => json_encode($output)]]],
        ]])]);
        $this->assertSame($output, app(ResponsesEditorialProvider::class)->suggest($this->input(), []));
        Http::assertSent(fn ($request) => $request->url() === 'https://api.openai.com/v1/responses'
            && $request->hasHeader('Authorization', 'Bearer test-secret') && $request['store'] === false
            && $request['text']['format']['strict'] === true);
    }

    public function test_insufficient_credits_returns_safe_message(): void
    {
        config(['ai_studio.api_key' => 'test-secret', 'ai_editorial.model' => 'test-model']);
        Http::fake(['api.openai.com/*' => Http::response(['error' => ['message' => 'private prompt secret', 'code' => 'insufficient_quota']], 429)]);
        $this->expectExceptionMessage('AI quota or rate limit reached.');
        app(ResponsesEditorialProvider::class)->suggest($this->input(), []);
    }

    public function test_unassigned_user_and_disabled_feature_are_denied(): void
    {
        config(['ai_editorial.enabled' => false]);
        try {
            app(EditorialAssistant::class)->generate('news', $this->input());
            $this->fail('Disabled assistance must reject generation.');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $this->assertSame(503, $e->getStatusCode());
        }
        config(['ai_editorial.enabled' => true]);
        $this->actingAs(User::factory()->create());
        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);
        app(EditorialAssistant::class)->generate('blog', $this->input());
    }

    public function test_malformed_refused_and_incomplete_provider_output_fails_safely(): void
    {
        config(['ai_studio.api_key' => 'test-secret', 'ai_editorial.model' => 'test-model']);
        foreach ([['status' => 'incomplete'], ['status' => 'completed', 'output' => [['content' => [['type' => 'refusal']]]]],
            ['status' => 'completed', 'output' => [['content' => [['type' => 'output_text', 'text' => 'invalid JSON private prompt']]]]]] as $payload) {
            Http::fake(['api.openai.com/*' => Http::response($payload)]);
            try {
                app(ResponsesEditorialProvider::class)->suggest($this->input(), []);
                $this->fail('Invalid output must be rejected.');
            } catch (RuntimeException $e) {
                $this->assertStringNotContainsString('private prompt', $e->getMessage());
                $this->assertStringNotContainsString('test-secret', $e->getMessage());
            }
        }
    }

    public function test_inactive_category_is_rejected_and_html_is_removed(): void
    {
        $category = Category::create(['name' => 'Technology', 'slug' => 'inactive-technology-test', 'type' => 'news', 'status' => 'inactive']);
        $output = app(MockEditorialProvider::class)->suggest($this->input(), []);
        $output['body'] = '<script>alert(1)</script><p>Text</p>';
        $safe = app(EditorialAssistant::class)->validateOutput($output, 'news');
        $this->assertStringNotContainsString('<', $safe['body']);
        $output['category_id'] = $category->id;
        $this->expectException(RuntimeException::class);
        app(EditorialAssistant::class)->validateOutput($output, 'news');
    }

    public function test_blog_outline_requires_explicit_apply_and_saves_draft(): void
    {
        $author = User::factory()->create();
        $author->assignRole('author');
        $this->actingAs($author);
        Livewire::test(CreateBlogPost::class)
            ->fillForm(['title' => 'Original blog', 'slug' => 'original-blog', 'content' => '<p>Existing text</p>'])
            ->callAction('aiAssist', array_replace($this->input(), ['operation' => 'outline']))
            ->assertHasNoActionErrors()
            ->assertSet('data.content', '<p>Existing text</p>')
            ->callAction('reviewAi', ['fields' => ['body'], 'confirm' => true])
            ->assertHasNoActionErrors()
            ->call('create')
            ->assertHasNoFormErrors();
        $post = BlogPost::sole();
        $this->assertSame('draft', $post->status);
        $this->assertFalse($post->is_public_approved);
        $this->assertNull($post->published_at);
        $this->assertSame($author->id, $post->user_id);
        $this->assertStringContainsString('Evidence to verify', $post->content);
    }

    public function test_filament_generate_review_apply_and_save_stays_pending(): void
    {
        Livewire::test(CreateNews::class)
            ->fillForm(['title' => 'Original', 'slug' => 'original', 'source_name' => 'Original', 'source_url' => 'https://example.com/original', 'status' => 'published', 'published_at' => now(), 'featured' => true])
            ->callAction('aiAssist', $this->input())
            ->assertHasNoActionErrors()
            ->assertSet('data.title', 'Original')
            ->callAction('reviewAi', ['fields' => ['title', 'body'], 'confirm' => true])
            ->assertHasNoActionErrors()
            ->assertSet('data.status', 'pending')
            ->set('data.status', 'published')
            ->call('create')
            ->assertHasNoFormErrors();
        $article = News::sole();
        $this->assertSame('pending', $article->status);
        $this->assertNull($article->published_at);
        $this->assertFalse($article->featured);
        $this->assertSame('original', $article->slug);
    }

    public function test_introduction_requires_confirmation_preserves_remainder_and_revokes_approval(): void
    {
        $post = BlogPost::create(['user_id' => auth()->id(), 'title' => 'Published blog', 'slug' => 'published-blog',
            'content' => '<h2>Context</h2><p>Old introduction</p><p>Keep this evidence.</p>',
            'status' => 'published', 'is_public_approved' => true, 'featured' => true, 'published_at' => now()]);
        Livewire::test(EditBlogPost::class, ['record' => $post->getRouteKey()])
            ->callAction('aiAssist', array_replace($this->input(), ['operation' => 'introduction', 'existing_content' => $post->content]))
            ->assertHasNoActionErrors()
            ->callAction('reviewAi', ['fields' => ['body'], 'confirm' => false])
            ->assertHasActionErrors(['confirm' => 'accepted'])
            ->assertSet('data.content', $post->content)
            ->callAction('reviewAi', ['fields' => ['body'], 'confirm' => true])
            ->assertHasNoActionErrors()
            ->call('save')
            ->assertHasNoFormErrors();
        $post->refresh();
        $this->assertStringContainsString('<h2>Context</h2>', $post->content);
        $this->assertStringContainsString('<p>Keep this evidence.</p>', $post->content);
        $this->assertStringNotContainsString('Old introduction', $post->content);
        $this->assertSame('draft', $post->status);
        $this->assertFalse($post->is_public_approved);
        $this->assertFalse($post->featured);
        $this->assertNull($post->published_at);
    }
}
