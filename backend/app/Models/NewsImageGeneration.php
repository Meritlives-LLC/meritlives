<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsImageGeneration extends Model
{
    protected $fillable = [
        'news_id', 'user_id', 'image_path', 'prompt', 'model', 'quality',
        'estimated_cost_usd', 'status', 'error_message', 'approved_at',
    ];

    protected $casts = [
        'estimated_cost_usd' => 'decimal:4',
        'approved_at' => 'datetime',
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