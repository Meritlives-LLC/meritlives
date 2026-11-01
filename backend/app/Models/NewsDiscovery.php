<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NewsDiscovery extends Model
{
    public const STATUS_DISCOVERED = 'discovered';
    public const STATUS_REWRITE_IN_PROGRESS = 'rewrite_in_progress';
    public const STATUS_REWRITE_READY = 'rewrite_ready';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_APPROVED_FOR_DRAFT = 'approved_for_draft';
    public const STATUS_DRAFT_SAVED = 'draft_saved';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_FAILED = 'failed';
    public const STATUS_DUPLICATE = 'duplicate';

    protected $fillable = [
        'news_source_id', 'category_id', 'matched_category_name', 'source_name', 'source_url', 'canonical_url', 'canonical_url_hash',
        'external_id', 'source_identity_hash', 'original_title', 'source_published_at', 'retrieved_at',
        'source_excerpt', 'status', 'duplicate_of_id', 'duplicate_news_id', 'rewrite_job_id', 'image_job_id',
        'draft_model', 'draft_id', 'reviewed_by', 'reviewed_at', 'review_notes',
    ];

    protected function casts(): array
    {
        return ['source_published_at' => 'datetime', 'retrieved_at' => 'datetime', 'reviewed_at' => 'datetime'];
    }

    public function source(): BelongsTo { return $this->belongsTo(NewsSource::class, 'news_source_id'); }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function duplicateOf(): BelongsTo { return $this->belongsTo(self::class, 'duplicate_of_id'); }
    public function rewriteJob(): BelongsTo { return $this->belongsTo(AiGenerationJob::class, 'rewrite_job_id'); }
    public function imageJob(): BelongsTo { return $this->belongsTo(AiGenerationJob::class, 'image_job_id'); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function events(): HasMany { return $this->hasMany(NewsDiscoveryEvent::class)->orderBy('id'); }

    protected static function booted(): void
    {
        static::updated(function (self $discovery): void {
            if ($discovery->wasChanged('status') && $discovery->status === self::STATUS_PUBLISHED) {
                NewsDiscoveryEvent::record($discovery->id, null, 'editorial.content_published', $discovery->getOriginal('status'), $discovery->status);
            }
        });
    }
}
