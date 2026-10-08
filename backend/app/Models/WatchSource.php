<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WatchSource extends Model
{
    public const PLATFORM_YOUTUBE = 'youtube';

    public const CATEGORIES = [
        'technology' => 'Technology',
        'business' => 'Business',
        'podcast' => 'Podcast',
        'africa' => 'Africa',
    ];

    protected $fillable = [
        'name',
        'platform',
        'platform_channel_id',
        'category',
        'description',
        'is_active',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'priority' => 'integer',
        ];
    }

    public function videos(): HasMany
    {
        return $this->hasMany(WatchVideo::class);
    }
}
