<?php

namespace Tests\Feature;

use App\Filament\Resources\BlogPostResource;
use App\Filament\Resources\CategoryResource;
use App\Filament\Resources\NewsResource;
use App\Filament\Resources\NewsDiscoveryResource;
use App\Filament\Resources\NewsSourceResource;
use App\Filament\Resources\ProductResource;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FilamentResourceAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_editor_permissions_are_enforced_at_resource_level(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $editor = User::factory()->create();
        $editor->assignRole(Role::findByName('editor', 'web'));
        $this->actingAs($editor);

        $this->assertTrue(NewsResource::canViewAny());
        $this->assertTrue(NewsResource::canCreate());
        $this->assertFalse(NewsResource::canDeleteAny());
        $this->assertTrue(BlogPostResource::canCreate());
        $this->assertTrue(ProductResource::canViewAny());
        $this->assertFalse(ProductResource::canCreate());
        $this->assertTrue(ProductResource::canEdit(new \App\Models\Product));
        $this->assertFalse(CategoryResource::canViewAny());
        $this->assertTrue(NewsDiscoveryResource::canViewAny());
        $this->assertFalse(NewsSourceResource::canViewAny());
    }

    public function test_unassigned_user_cannot_use_filament_resources(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->assertFalse(NewsResource::canViewAny());
        $this->assertFalse(NewsResource::canCreate());
        $this->assertFalse(BlogPostResource::canViewAny());
        $this->assertFalse(NewsDiscoveryResource::canViewAny());
        $this->assertFalse(NewsSourceResource::canViewAny());
    }

    public function test_admin_can_manage_news_sources(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $admin = User::factory()->create();
        $admin->assignRole(Role::findByName('admin', 'web'));
        $this->actingAs($admin);

        $this->assertTrue(NewsSourceResource::canViewAny());
        $this->assertTrue(NewsSourceResource::canCreate());
    }
}
