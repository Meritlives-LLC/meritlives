<?php

namespace Tests\Feature;

use App\Filament\Pages\NewsImageStudio;
use App\Filament\Resources\NewsResource;
use App\Models\News;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EditorialAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_news_resource_actions_follow_explicit_permissions(): void
    {
        Permission::findOrCreate('view_news', 'web');
        Permission::findOrCreate('create_news', 'web');
        Permission::findOrCreate('edit_news', 'web');
        Permission::findOrCreate('delete_news', 'web');

        $news = News::create([
            'title' => 'Permission test article',
            'slug' => 'permission-test-article',
            'source_name' => 'Test Source',
            'source_url' => 'https://example.com/permission-test',
            'status' => 'pending',
            'editorial_status' => 'draft',
        ]);

        $author = User::factory()->create();
        $this->actingAs($author);
        $this->assertFalse(NewsResource::canViewAny());
        $this->assertFalse(NewsResource::canCreate());
        $this->assertFalse(NewsResource::canEdit($news));
        $this->assertFalse(NewsResource::canDelete($news));

        $editor = User::factory()->create();
        $editor->givePermissionTo(['view_news', 'edit_news']);
        $this->actingAs($editor);
        $this->assertTrue(NewsResource::canViewAny());
        $this->assertFalse(NewsResource::canCreate());
        $this->assertTrue(NewsResource::canEdit($news));
        $this->assertFalse(NewsResource::canDelete($news));
    }


    public function test_manual_article_creator_cannot_approve_their_own_article(): void
    {
        $creator = User::factory()->create();
        $this->actingAs($creator);

        $news = News::create([
            'title' => 'Manual article created for review',
            'slug' => 'manual-article-created-for-review',
            'source_name' => 'Test Source',
            'source_url' => 'https://example.com/manual-article',
            'status' => 'pending',
            'editorial_status' => 'draft',
        ]);

        $this->assertSame($creator->id, $news->created_by);

        $this->expectException(\\RuntimeException::class);
        $this->expectExceptionMessage('A different editor must approve a manually authored article.');
        app(\\App\\Services\\EditorialWorkflow::class)->approveArticle($news, (int) $creator->id);
    }

    public function test_image_studio_requires_media_or_news_edit_permission(): void
    {
        Permission::findOrCreate('manage_media', 'web');
        Permission::findOrCreate('edit_news', 'web');

        $user = User::factory()->create();
        $this->actingAs($user);
        $this->assertFalse(NewsImageStudio::canAccess());

        $user->givePermissionTo('manage_media');
        $this->assertTrue(NewsImageStudio::canAccess());
    }

    public function test_filament_panel_access_requires_an_allowed_role(): void
    {
        Role::findOrCreate('editor', 'web');

        $user = User::factory()->create();
        $this->assertFalse($user->canAccessPanel(\Mockery::mock(\Filament\Panel::class)));

        $user->assignRole('editor');
        $this->assertTrue($user->canAccessPanel(app(\Filament\Panel::class)));
    }
}
