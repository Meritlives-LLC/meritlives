<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_article_generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('news_id')->constrained('news')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('model', 100);
            $table->unsignedInteger('input_words')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);
            $table->decimal('estimated_cost_usd', 8, 4)->default(0);
            $table->string('status', 20)->default('pending')->index();
            $table->string('source_material_hash', 64);
            $table->text('error_message')->nullable();
            $table->timestamps();
            $table->index(['news_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_article_generations');
    }
};