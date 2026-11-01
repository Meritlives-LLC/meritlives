<?php

namespace Tests\Feature;

use App\Filament\Resources\BlogPostResource\Pages\CreateBlogPost;
use App\Filament\Resources\NewsResource\Pages\CreateNews;
use App\Models\Category;
use App\Models\User;
use App\Services\AiEditorial\EditorialAssistant;
use App\Services\AiEditorial\EditorialProvider;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class EditorialAcceptanceTest extends TestCase
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
    }

    private function input(string $operation = 'draft'): array
    {
        return ['topic' => 'FICTIONAL QA: imaginary moon library', 'operation' => $operation,
            'length' => 'short', 'source_text' => 'TEST ONLY: fictional robots read imaginary books. No real event.',
            'existing_content' => 'Unsaved editor evidence.'];
    }

    public function test_guest_cannot_open_editors_or_generate(): void
    {
        auth()->logout();
        $this->get('/admin/news/create')->assertRedirect('/admin/login');
        $this->get('/admin/blog-posts/create')->assertRedirect('/admin/login');
        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);
        try {
            app(EditorialAssistant::class)->generate('news', $this->input());
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $this->assertSame(403, $e->getStatusCode());
            throw $e;
        }
    }

    public function test_news_preview_is_editable_confirmation_required_and_unselected_copy_survives(): void
    {
        $form = Livewire::test(CreateNews::class)
            ->fillForm(['title' => 'Unsaved original', 'slug' => 'unsaved-original',
                'content' => '<p>Keep unsaved evidence</p>', 'excerpt' => 'Keep excerpt', 'seo_title' => 'Keep SEO'])
            ->callAction('aiAssist', $this->input())->assertHasNoActionErrors()
            ->assertSet('data.title', 'Unsaved original')
            ->callAction('reviewAi', ['fields' => ['title'], 'title' => 'Human edited fictional preview', 'confirm' => false])
            ->assertHasActionErrors(['confirm' => 'accepted'])->assertSet('data.title', 'Unsaved original')
            ->callAction('reviewAi', ['fields' => ['title'], 'title' => 'Human edited fictional preview', 'confirm' => true])
            ->assertHasNoActionErrors()->assertSet('data.title', 'Human edited fictional preview')
            ->assertSet('data.slug', 'unsaved-original')->assertSet('data.content', '<p>Keep unsaved evidence</p>')
            ->assertSet('data.excerpt', 'Keep excerpt')->assertSet('data.seo_title', 'Keep SEO')
            ->assertSet('data.status', 'pending');
        $this->assertDatabaseCount('news', 0);
    }

    public function test_blog_seo_and_existing_category_apply_without_overwriting_unsaved_body(): void
    {
        $category = Category::where('type', 'blog')->where('status', 'active')->firstOrFail();
        $form = Livewire::test(CreateBlogPost::class)
            ->fillForm(['title' => 'Unsaved fictional blog', 'slug' => 'unsaved-fictional-blog',
                'content' => '<p>Keep unsaved body</p>', 'excerpt' => 'Keep excerpt'])
            ->callAction('aiAssist', $this->input('seo'))->assertHasNoActionErrors()
            ->callAction('reviewAi', ['fields' => ['seo_title', 'seo_description'],
                'seo_title' => 'Edited test SEO', 'seo_description' => 'Edited test description', 'confirm' => true])
            ->assertHasNoActionErrors()->assertSet('data.seo_title', 'Edited test SEO')
            ->assertSet('data.seo_description', 'Edited test description')
            ->callAction('aiAssist', $this->input('category'))->assertHasNoActionErrors()
            ->callAction('reviewAi', ['fields' => ['category_id'], 'category_id' => $category->id, 'confirm' => true])
            ->assertHasNoActionErrors()->assertSet('data.category_id', $category->id)
            ->assertSet('data.title', 'Unsaved fictional blog')->assertSet('data.content', '<p>Keep unsaved body</p>')
            ->assertSet('data.excerpt', 'Keep excerpt')->assertSet('data.status', 'draft')
            ->assertSet('data.is_public_approved', false);
        $this->assertDatabaseCount('blog_posts', 0);
    }

    public function test_provider_failure_and_validation_preserve_unsaved_news_form(): void
    {
        app()->instance(EditorialProvider::class, new class implements EditorialProvider {
            public function suggest(array $input, array $categories): array
            {
                throw new \RuntimeException('Mock provider unavailable; your article is unchanged.');
            }
        });
        Livewire::test(CreateNews::class)
            ->fillForm(['title' => 'Unsaved fictional news', 'slug' => 'unsaved-fictional-news', 'content' => '<p>Keep evidence</p>'])
            ->callAction('aiAssist', array_replace($this->input(), ['source_text' => '']))
            ->assertHasActionErrors(['source_text'])
            ->assertSet('data.title', 'Unsaved fictional news')->assertSet('data.content', '<p>Keep evidence</p>')
            ->callAction('aiAssist', $this->input())->assertNotified('Mock provider unavailable; your article is unchanged.')
            ->assertSet('data.title', 'Unsaved fictional news')->assertSet('data.content', '<p>Keep evidence</p>')
            ->assertSet('editorialPreviewToken', null);
        $this->assertDatabaseCount('news', 0);
    }

    public function test_duplicate_news_source_is_a_form_error_and_does_not_write(): void
    {
        \App\Models\News::create(['title' => 'Disposable original', 'slug' => 'disposable-original',
            'source_name' => 'QA', 'source_url' => 'https://example.test/duplicate', 'status' => 'pending']);
        Livewire::test(CreateNews::class)
            ->fillForm(['title' => 'Unsaved duplicate', 'slug' => 'unsaved-duplicate', 'source_name' => 'QA',
                'source_url' => 'https://example.test/duplicate', 'status' => 'pending'])
            ->call('create')->assertHasFormErrors(['source_url' => 'unique'])
            ->assertSet('data.title', 'Unsaved duplicate');
        $this->assertDatabaseCount('news', 1);
    }
}
