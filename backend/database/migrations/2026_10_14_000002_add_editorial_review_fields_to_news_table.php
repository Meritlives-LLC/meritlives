<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('news', function (Blueprint $table) {
            if (! Schema::hasColumn('news', 'editorial_status')) {
                $table->string('editorial_status', 32)->default('draft')->index();
            }
            if (! Schema::hasColumn('news', 'article_reviewed_by')) {
                $table->foreignId('article_reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('news', 'article_reviewed_at')) {
                $table->timestamp('article_reviewed_at')->nullable();
            }
            if (! Schema::hasColumn('news', 'article_review_notes')) {
                $table->text('article_review_notes')->nullable();
            }
            if (! Schema::hasColumn('news', 'image_review_status')) {
                $table->string('image_review_status', 32)->default('pending')->index();
            }
            if (! Schema::hasColumn('news', 'image_reviewed_by')) {
                $table->foreignId('image_reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('news', 'image_reviewed_at')) {
                $table->timestamp('image_reviewed_at')->nullable();
            }
            if (! Schema::hasColumn('news', 'image_review_notes')) {
                $table->text('image_review_notes')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('news', function (Blueprint $table) {
            foreach ([
                'article_reviewed_by', 'article_reviewed_at', 'article_review_notes',
                'image_reviewed_by', 'image_reviewed_at', 'image_review_notes',
                'editorial_status', 'image_review_status',
            ] as $column) {
                if (Schema::hasColumn('news', $column)) {
                    if (in_array($column, ['article_reviewed_by', 'image_reviewed_by'], true)) {
                        $table->dropConstrainedForeignId($column);
                    } else {
                        $table->dropColumn($column);
                    }
                }
            }
        });
    }
};