<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->string('source_name');
            $table->text('source_url');
            $table->text('image_url')->nullable();
            $table->timestamp('published_at')->nullable()->index();
            $table->string('external_id')->nullable();
            $table->string('status')->default('pending')->index();
            $table->boolean('featured')->default(false);
            $table->timestamps();

            $table->unique(['source_url']);
            $table->index(['category_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news');
    }
};
