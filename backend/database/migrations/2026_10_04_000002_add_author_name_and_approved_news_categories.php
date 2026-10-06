<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    private const NEWS_CATEGORIES = ['Technology', 'Business', 'Digital Innovation'];

    public function up(): void
    {
        if (! Schema::hasColumn('news', 'author_name')) {
            Schema::table('news', function (Blueprint $table) {
                $table->string('author_name')->nullable()->after('content');
            });
        }

        foreach (self::NEWS_CATEGORIES as $name) {
            $slug = Str::slug($name);
            if (! DB::table('categories')->where('slug', $slug)->exists()) {
                DB::table('categories')->insert([
                    'name' => $name,
                    'slug' => $slug,
                    'type' => 'news',
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Keep category rows and editorial data intact on rollback.
        if (Schema::hasColumn('news', 'author_name')) {
            Schema::table('news', function (Blueprint $table) {
                $table->dropColumn('author_name');
            });
        }
    }
};
