<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WatchVideo extends Model
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'watch_source_id',
        'youtube_video_id',
        'title',
        'slug',
        'description',
        'thumbnail_url',
        'video_url',
        'category',
        'published_at',
        'duration',
        'relevance_score',
        'quality_score',
        'status',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'relevance_score' => 'decimal:2',
            'quality_score' => 'decimal:2',
            'is_featured' => 'boolean',
        ];
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(WatchSource::class, 'watch_source_id');
    }

    public function scopePubliclyAvailable(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_ACTIVE)
            ->whereRaw('LENGTH(youtube_video_id) = 11')
            ->whereNotNull('thumbnail_url')
            ->where('thumbnail_url', 'like', 'https://%')
            ->where(function (Builder $query) {
                $query->where('video_url', 'like', 'https://youtube.com/watch?v=%')
                    ->orWhere('video_url', 'like', 'https://www.youtube.com/watch?v=%')
                    ->orWhere('video_url', 'like', 'https://youtu.be/%');
            })
            ->whereRaw("(CASE
                WHEN video_url LIKE 'https://youtube.com/watch?v=%' THEN SUBSTR(video_url, INSTR(video_url, 'v=') + 2)
                WHEN video_url LIKE 'https://www.youtube.com/watch?v=%' THEN SUBSTR(video_url, INSTR(video_url, 'v=') + 2)
                WHEN video_url LIKE 'https://youtu.be/%' THEN SUBSTR(video_url, LENGTH('https://youtu.be/') + 1)
                ELSE ''
            END) = youtube_video_id");
    }
}
