<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FilamentAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Fixed: phase4's original seeder hardcoded the password
        // "ChangeThisPasswordImmediately!" and never actually assigned the
        // super_admin role, so canAccessPanel() would always fail. This
        // version reads the password from the environment (falling back to
        // a random one, printed once, if none is set) and assigns the role.
        $password = env('ADMIN_SEED_PASSWORD');
        $generated = false;

        if (! $password) {
            $password = Str::password(20);
            $generated = true;
        }

        $admin = User::firstOrCreate(
            ['email' => env('ADMIN_SEED_EMAIL', 'admin@meritlives.local')],
            [
                'name' => 'MERITLIVES Administrator',
                'password' => Hash::make($password),
            ]
        );

        $admin->assignRole('super_admin');

        if ($generated) {
            $this->command?->warn("Generated admin password (save this now, it will not be shown again): {$password}");
        }
    }
}
