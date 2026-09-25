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
            'view_blog', 'create_blog', 'edit_blog', 'delete_blog',
            'manage_media', 'manage_settings', 'manage_users',
            'manage_messages', 'manage_subscribers',
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
                'view_blog','create_blog','edit_blog',
                'manage_media','manage_messages','manage_subscribers',
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
