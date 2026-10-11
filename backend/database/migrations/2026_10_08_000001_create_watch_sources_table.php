<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('watch_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('platform', 32)->default('youtube');
            $table->string('platform_channel_id', 64);
            $table->string('category', 64);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(false);
            $table->unsignedTinyInteger('priority')->default(2);
            $table->timestamps();

            $table->unique(['platform', 'platform_channel_id']);
            $table->index(['is_active', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('watch_sources');
    }
};
