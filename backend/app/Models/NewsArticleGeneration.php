<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsArticleGeneration extends Model
{
    protected $fillable = [
        'news_id', 'user_id', 'model', 'input_words', 'output_tokens',
        'estimated_cost_usd', 'status', 'source_material_hash', 'error_message',
    ];

    protected $casts = [
        'estimated_cost_usd' => 'decimal:4',
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