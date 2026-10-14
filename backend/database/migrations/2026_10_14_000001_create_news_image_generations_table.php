<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_image_generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('news_id')->constrained('news')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('image_path')->nullable();
            $table->text('prompt');
            $table->string('model', 100);
            $table->string('quality', 20)->default('low');
            $table->decimal('estimated_cost_usd', 8, 4)->default(0);
            $table->string('status', 20)->default('pending')->index();
            $table->text('error_message')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->index(['news_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_image_generations');
    }
};