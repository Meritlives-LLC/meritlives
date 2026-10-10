<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('watch_videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('watch_source_id')->constrained()->restrictOnDelete();
            $table->string('youtube_video_id', 11)->unique();
            $table->string('title');
            $table->string('slug', 191)->unique();
            $table->text('description')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->text('video_url');
            $table->string('category', 64);
            $table->timestamp('published_at')->nullable()->index();
            $table->string('duration', 32)->nullable();
            $table->decimal('relevance_score', 5, 2)->default(0);
            $table->decimal('quality_score', 5, 2)->default(0);
            $table->string('status', 32)->default('inactive')->index();
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            $table->index(['status', 'is_featured', 'published_at']);
            $table->index(['category', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('watch_videos');
    }
};
