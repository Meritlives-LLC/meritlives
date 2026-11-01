<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    private const BLOG = [
        'Company Updates',
        'Projects & Operations',
        'Industry Insights & Thought Leadership',
        'Team & Culture',
        'Knowledge Base',
        'Policies & Procedures',
    ];

    public function up(): void
    {
        $now = now();

        // Fail before making changes if a desired slug is already owned by another category type.
        foreach (self::BLOG as $name) {
            $category = DB::table('categories')->where('slug', Str::slug($name))->first();

            if ($category && $category->type !== 'blog') {
                throw new RuntimeException("Cannot create Blog category '{$name}': its slug is already used by a non-Blog category.");
            }
        }

        foreach (self::BLOG as $name) {
            $this->ensureBlogCategory($name, $now);
        }

        // Retire legacy Blog categories without deleting rows or changing post associations.
        DB::table('categories')->where('type', 'blog')->whereNotIn('name', self::BLOG)->update([
            'status' => 'inactive', 'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        // Keep taxonomy and content intact on rollback; restoring retired categories may expose legacy labels.
    }

    private function ensureBlogCategory(string $name, $now): void
    {
        $slug = Str::slug($name);
        $category = DB::table('categories')->where('slug', $slug)->first();

        if ($category) {
            DB::table('categories')->where('id', $category->id)->update([
                'name' => $name, 'status' => 'active', 'updated_at' => $now,
            ]);

            return;
        }

        DB::table('categories')->insert([
            'name' => $name, 'slug' => $slug, 'type' => 'blog', 'status' => 'active',
            'created_at' => $now, 'updated_at' => $now,
        ]);
    }
};
