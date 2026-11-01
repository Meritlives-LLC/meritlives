<?php

namespace Tests\Feature;

use App\Filament\Pages\ManageAboutPage;
use App\Models\{Setting, User};
use App\Services\AboutPageContent;
use App\Support\RasterUpload;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Livewire\Livewire;
use Tests\TestCase;

class AboutPageTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('admin');
        $this->actingAs($user);
        return $user;
    }

    public function test_public_defaults_are_available_without_creating_settings(): void
    {
        $response = $this->getJson('/api/v1/pages/about')->assertOk()
            ->assertJsonPath('data.hero_title', config('about.defaults.hero_title'))
            ->assertJsonCount(5, 'data.values')->assertJsonCount(5, 'data.approach');
        $this->assertTrue($response->headers->hasCacheControlDirective('no-store'));
        $this->assertDatabaseCount('settings', 0);
    }

    public function test_admin_can_save_preview_and_publish_without_exposing_drafts(): void
    {
        $this->admin();
        $page = Livewire::test(ManageAboutPage::class)->fillForm(['hero_title' => 'Private draft headline'])
            ->call('saveDraft')->assertHasNoFormErrors()->call('preview')->assertSet('previewData.hero_title', 'Private draft headline');
        $this->getJson('/api/v1/pages/about')->assertJsonPath('data.hero_title', config('about.defaults.hero_title'));
        $page->call('publish')->assertHasNoFormErrors();
        $this->getJson('/api/v1/pages/about')->assertJsonPath('data.hero_title', 'Private draft headline');
        $page->fillForm(['hero_title' => 'Later private changes'])->call('saveDraft');
        $this->getJson('/api/v1/pages/about')->assertJsonPath('data.hero_title', 'Private draft headline');
        $this->assertDatabaseCount('settings', 2);
    }

    public function test_guest_editor_and_author_cannot_manage_about_page(): void
    {
        $this->get('/admin/about-page')->assertRedirect('/admin/login');
        $this->seed(RolesAndPermissionsSeeder::class);
        foreach (['editor', 'author'] as $role) {
            $user = User::factory()->create(); $user->assignRole($role); $this->actingAs($user);
            $this->assertFalse(ManageAboutPage::canAccess());
            $this->get('/admin/about-page')->assertForbidden();
            try { app(AboutPageContent::class)->save(config('about.defaults'), true); $this->fail('Unauthorized publish.'); }
            catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) { $this->assertSame(403, $e->getStatusCode()); }
        }
        $this->assertDatabaseCount('settings', 0);
    }

    public function test_invalid_fields_and_invented_selections_do_not_publish(): void
    {
        $this->admin();
        Livewire::test(ManageAboutPage::class)->fillForm(['hero_title' => '', 'product_slugs' => ['invented-product']])
            ->call('publish')->assertHasFormErrors();
        $this->assertDatabaseCount('settings', 0);
    }

    public function test_removing_selections_and_reordering_items_are_published(): void
    {
        $this->admin();
        $data = config('about.defaults');
        $data['values'] = array_reverse($data['values']);
        $data['service_slugs'] = []; $data['product_slugs'] = [];
        app(AboutPageContent::class)->save($data, true);
        $this->getJson('/api/v1/pages/about')->assertJsonCount(0, 'data.service_slugs')
            ->assertJsonCount(0, 'data.product_slugs')->assertJsonPath('data.values.0.title', 'Customer Focus');
    }

    public function test_raster_upload_is_reused_and_only_published_image_is_exposed(): void
    {
        $this->admin(); Storage::fake('public');
        $file = UploadedFile::fake()->createWithContent('about.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='));
        $path = RasterUpload::store($file, 'general');
        Storage::disk('public')->assertExists($path);
        $data = config('about.defaults'); $data['hero_image'] = $path;
        app(AboutPageContent::class)->save($data);
        $this->getJson('/api/v1/pages/about')->assertJsonPath('data.hero_image', null);
        app(AboutPageContent::class)->save($data, true);
        $this->getJson('/api/v1/pages/about')->assertJsonPath('data.hero_image', Storage::disk('public')->url($path));
    }

    public function test_external_media_cannot_be_published(): void
    {
        $this->admin();
        $data = config('about.defaults'); $data['hero_image'] = 'https://example.test/image.svg';
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        app(AboutPageContent::class)->save($data, true);
    }

    public function test_publish_action_waits_for_confirmation(): void
    {
        $this->admin();
        $page = Livewire::test(ManageAboutPage::class)->fillForm(['hero_title' => 'Confirmed publication'])
            ->mountAction('publish')->assertActionMounted('publish');
        $this->assertDatabaseMissing('settings', ['key' => AboutPageContent::PUBLISHED]);
        $page->callMountedAction()->assertHasNoActionErrors();
        $this->getJson('/api/v1/pages/about')->assertJsonPath('data.hero_title', 'Confirmed publication');
    }
}
