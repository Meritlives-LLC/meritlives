<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsEditorialEvent extends Model
{
    protected $fillable = [
        'news_id', 'user_id', 'event_type', 'from_status', 'to_status', 'notes', 'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function news(): BelongsTo
    {
        return $this->belongsTo(News::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}