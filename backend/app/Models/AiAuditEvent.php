<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiAuditEvent extends Model
{
    public $timestamps = false;

    protected $fillable = ['job_id', 'actor_id', 'event', 'from_status', 'to_status', 'metadata', 'created_at'];

    protected function casts(): array { return ['metadata' => 'array', 'created_at' => 'datetime']; }

    public function job(): BelongsTo { return $this->belongsTo(AiGenerationJob::class, 'job_id'); }
    public function actor(): BelongsTo { return $this->belongsTo(User::class, 'actor_id'); }

    /** Audit rows are append-only through the application. */
    public static function record(?int $jobId, ?int $actorId, string $event, ?string $from, ?string $to, array $metadata = []): self
    {
        return static::query()->create([
            'job_id' => $jobId,
            'actor_id' => $actorId,
            'event' => $event,
            'from_status' => $from,
            'to_status' => $to,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new \LogicException('AI audit events are append-only.'));
        static::deleting(fn () => throw new \LogicException('AI audit events cannot be deleted.'));
    }
}
