<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiGenerationJob extends Model
{
    public const TYPE_ARTICLE = 'article';
    public const TYPE_IMAGE = 'image';
    public const STATUS_DRAFT = 'draft';
    public const STATUS_AWAITING_REVIEW = 'awaiting_review';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'type', 'status', 'prompt', 'instructions', 'prompt_template_id', 'prompt_template_version',
        'requested_by', 'provider', 'model', 'result_title', 'result_slug', 'result_excerpt', 'result_body',
        'failure_message', 'result_metadata', 'preview_path', 'preview_mime', 'preview_size', 'approved_image_path',
        'reviewed_by', 'reviewed_at', 'review_notes', 'associated_model', 'associated_id',
    ];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime', 'preview_size' => 'integer', 'result_metadata' => 'array'];
    }

    public function requester(): BelongsTo { return $this->belongsTo(User::class, 'requested_by'); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function promptTemplate(): BelongsTo { return $this->belongsTo(AiPromptTemplate::class, 'prompt_template_id'); }
    public function auditEvents(): HasMany { return $this->hasMany(AiAuditEvent::class, 'job_id')->orderBy('id'); }

    protected static function booted(): void
    {
        static::creating(function (self $job): void {
            if ($job->prompt_template_id && ! $job->prompt_template_version) {
                $job->prompt_template_version = AiPromptTemplate::query()->whereKey($job->prompt_template_id)->value('version');
            }
        });

        static::created(function (self $job): void {
            AiAuditEvent::record($job->id, $job->requested_by, 'job.created', null, $job->status, [
                'type' => $job->type,
                'prompt_template_version' => $job->prompt_template_version,
            ]);
        });
    }
}
