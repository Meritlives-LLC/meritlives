<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const COLUMN_LENGTHS = [
        'watch_sources' => [
            'platform' => 32,
            'platform_channel_id' => 64,
            'category' => 50,
        ],
        'watch_videos' => [
            'slug' => 191,
            'category' => 50,
            'status' => 20,
        ],
    ];

    public function up(): void
    {
        $lengthFunction = DB::connection()->getDriverName() === 'sqlite' ? 'LENGTH' : 'CHAR_LENGTH';

        foreach (self::COLUMN_LENGTHS as $table => $columns) {
            foreach ($columns as $column => $maxLength) {
                $storedLength = DB::table($table)
                    ->selectRaw('MAX('.$lengthFunction.'(`'.$column.'`)) AS max_length')
                    ->value('max_length');

                if ($storedLength !== null && (int) $storedLength > $maxLength) {
                    throw new \RuntimeException(sprintf(
                        'Cannot shorten %s.%s to %d characters; existing data uses %d characters.',
                        $table,
                        $column,
                        $maxLength,
                        (int) $storedLength,
                    ));
                }
            }
        }

        Schema::table('watch_sources', function (Blueprint $table): void {
            $table->string('platform', 32)->default('youtube')->change();
            $table->string('platform_channel_id', 64)->change();
            $table->string('category', 50)->change();
        });

        Schema::table('watch_videos', function (Blueprint $table): void {
            $table->string('slug', 191)->change();
            $table->string('category', 50)->change();
            $table->string('status', 20)->default('inactive')->change();
        });
    }

    public function down(): void
    {
        Schema::table('watch_sources', function (Blueprint $table): void {
            $table->string('platform')->default('youtube')->change();
            $table->string('platform_channel_id')->change();
            $table->string('category')->change();
        });

        Schema::table('watch_videos', function (Blueprint $table): void {
            $table->string('slug')->change();
            $table->string('category')->change();
            $table->string('status')->default('inactive')->change();
        });
    }
};
