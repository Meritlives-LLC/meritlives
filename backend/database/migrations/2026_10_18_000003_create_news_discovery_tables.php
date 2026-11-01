<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_sources', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 150);
            $table->string('type', 20)->default('rss')->index();
            $table->text('feed_url');
            $table->boolean('enabled')->default(false)->index();
            $table->dateTime('last_fetched_at')->nullable();
            $table->dateTime('last_successful_fetch_at')->nullable();
            $table->string('last_error', 500)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users', 'id', 'nd_new_sources_created_by_fk')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('news_source_category', function (Blueprint $table): void {
            $table->foreignId('news_source_id')->constrained('news_sources', 'id', 'nd_new_source_category_source_fk')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories', 'id', 'nd_new_source_category_category_fk')->cascadeOnDelete();
            $table->primary(['news_source_id', 'category_id']);
        });

        Schema::create('news_discoveries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('news_source_id')->nullable()->constrained('news_sources')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('matched_category_name', 150)->nullable();
            $table->string('source_name', 150);
            $table->text('source_url');
            $table->text('canonical_url');
            $table->char('canonical_url_hash', 64)->index();
            $table->text('external_id')->nullable();
            $table->char('source_identity_hash', 64);
            $table->string('original_title', 255);
            // DATETIME avoids MySQL's legacy TIMESTAMP implicit-default and 2038-range limits.
            $table->dateTime('source_published_at')->nullable()->index();
            $table->dateTime('retrieved_at')->index();
            $table->text('source_excerpt')->nullable();
            $table->string('status', 32)->default('discovered')->index();
            $table->foreignId('duplicate_of_id')->nullable()->constrained('news_discoveries')->nullOnDelete();
            $table->foreignId('duplicate_news_id')->nullable()->constrained('news')->nullOnDelete();
            $table->foreignId('rewrite_job_id')->nullable()->constrained('ai_generation_jobs')->nullOnDelete();
            $table->foreignId('image_job_id')->nullable()->constrained('ai_generation_jobs')->nullOnDelete();
            $table->string('draft_model', 100)->nullable();
            $table->unsignedBigInteger('draft_id')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();
            $table->unique(['news_source_id', 'source_identity_hash'], 'news_discovery_source_identity_unique');
            $table->unique(['news_source_id', 'canonical_url_hash'], 'news_discovery_source_canonical_unique');
            $table->index(['category_id', 'status', 'source_published_at'], 'news_discovery_review_queue_index');
            $table->index(['draft_model', 'draft_id']);
        });

        Schema::create('news_discovery_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('news_discovery_id')->nullable()->constrained('news_discoveries')->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event', 100)->index();
            $table->string('from_status', 32)->nullable();
            $table->string('to_status', 32)->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('created_at')->useCurrent()->index();
        });

        Schema::table('ai_generation_jobs', function (Blueprint $table): void {
            $table->json('result_metadata')->nullable()->after('result_body');
        });

        Schema::table('news', function (Blueprint $table): void {
            $table->string('seo_title', 70)->nullable()->after('excerpt');
            $table->string('seo_description', 170)->nullable()->after('seo_title');
        });
    }

    public function down(): void
    {
        throw new \LogicException('The news discovery migration is forward-only to preserve source provenance and editorial audit history.');
    }
};
