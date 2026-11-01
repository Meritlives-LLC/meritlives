<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class WatchMigrationLengthGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_column_length_migration_refuses_to_shorten_existing_values(): void
    {
        DB::table('watch_sources')->insert([
            'name' => 'Long platform fixture',
            'platform' => str_repeat('p', 33),
            'platform_channel_id' => 'UCsBjURrPoezykLs9EqgamOA',
            'category' => 'technology',
            'is_active' => false,
            'priority' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require database_path('migrations/2026_10_18_000001_align_watch_column_lengths.php');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('existing data uses 33 characters');

        $migration->up();
    }
}
