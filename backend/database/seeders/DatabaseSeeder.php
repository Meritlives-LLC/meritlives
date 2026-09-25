<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

// Merged: phase4 added RolesAndPermissionsSeeder + FilamentAdminSeeder but
// dropped phase2's demo content seeding. Both are needed, so DatabaseSeeder
// now runs all three (content seeding moved to ContentSeeder.php, unchanged
// from phase2 other than the class rename). See docs/MERGE-NOTES.md.
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            FilamentAdminSeeder::class,
            ContentSeeder::class,
        ]);
    }
}
