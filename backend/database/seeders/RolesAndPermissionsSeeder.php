<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'view_products', 'create_products', 'edit_products', 'delete_products',
            'view_services', 'create_services', 'edit_services', 'delete_services',
            'view_news', 'create_news', 'edit_news', 'delete_news',
            'view_blog', 'create_blog', 'edit_blog', 'delete_blog', 'review_blog',
            'manage_media', 'manage_settings', 'manage_users',
            'manage_messages', 'manage_subscribers',
            'view_ai_studio', 'create_ai_generations', 'review_ai_generations', 'manage_ai_prompts',
            'view_news_discoveries', 'manage_news_sources', 'refresh_news_sources',
            'rewrite_news_discoveries', 'review_news_discoveries',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $rolePermissions = [
            'super_admin' => $permissions,
            'admin' => array_values(array_diff($permissions, ['manage_users'])),
            'editor' => [
                'view_products','edit_products',
                'view_services','edit_services',
                'view_news','create_news','edit_news',
                'view_blog','create_blog','edit_blog','review_blog',
                'manage_media','manage_messages','manage_subscribers',
                'view_ai_studio','create_ai_generations','review_ai_generations',
                'view_news_discoveries','refresh_news_sources','rewrite_news_discoveries','review_news_discoveries',
            ],
            'author' => [
                'view_blog','create_blog','edit_blog','manage_media',
            ],
        ];

        foreach ($rolePermissions as $role => $perms) {
            $roleModel = Role::findOrCreate($role, 'web');
            $roleModel->syncPermissions($perms);
        }
    }
}
