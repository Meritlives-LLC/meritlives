<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_prompt_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 180)->unique();
            $table->longText('prompt');
            $table->text('instructions')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->boolean('is_active')->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('ai_generation_jobs', function (Blueprint $table): void {
            $table->id();
            $table->string('type', 20)->index();
            $table->string('status', 30)->default('draft')->index();
            $table->longText('prompt');
            $table->text('instructions')->nullable();
            $table->foreignId('prompt_template_id')->nullable()->constrained('ai_prompt_templates')->nullOnDelete();
            $table->unsignedInteger('prompt_template_version')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider', 100)->nullable();
            $table->string('model', 150)->nullable();
            $table->string('result_title')->nullable();
            $table->string('result_slug')->nullable();
            $table->text('result_excerpt')->nullable();
            $table->longText('result_body')->nullable();
            $table->string('failure_message', 500)->nullable();
            $table->string('preview_path', 255)->nullable();
            $table->string('preview_mime', 100)->nullable();
            $table->unsignedBigInteger('preview_size')->nullable();
            $table->string('approved_image_path', 255)->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->string('associated_model', 255)->nullable();
            $table->unsignedBigInteger('associated_id')->nullable();
            $table->timestamps();
            $table->index(['associated_model', 'associated_id']);
        });

        Schema::create('ai_audit_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('job_id')->nullable()->constrained('ai_generation_jobs')->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event', 100)->index();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        throw new \LogicException('The AI Studio migration is forward-only to preserve generation and review history.');
    }
};
