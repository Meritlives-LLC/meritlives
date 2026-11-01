<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsDiscoveryEvent extends Model
{
    public $timestamps = false;

    protected $fillable = ['news_discovery_id', 'actor_id', 'event', 'from_status', 'to_status', 'metadata', 'created_at'];

    protected function casts(): array { return ['metadata' => 'array', 'created_at' => 'datetime']; }

    public function discovery(): BelongsTo { return $this->belongsTo(NewsDiscovery::class); }
    public function actor(): BelongsTo { return $this->belongsTo(User::class, 'actor_id'); }

    protected static function booted(): void
    {
        static::updating(fn () => throw new \LogicException('News discovery audit events are append-only.'));
        static::deleting(fn () => throw new \LogicException('News discovery audit events cannot be deleted.'));
    }

    public static function record(?int $discoveryId, ?int $actorId, string $event, ?string $from = null, ?string $to = null, array $metadata = []): self
    {
        return self::query()->create([
            'news_discovery_id' => $discoveryId,
            'actor_id' => $actorId,
            'event' => $event,
            'from_status' => $from,
            'to_status' => $to,
            'metadata' => $metadata ?: null,
            'created_at' => now(),
        ]);
    }
}
