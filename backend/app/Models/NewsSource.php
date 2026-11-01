<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NewsSource extends Model
{
    protected $fillable = ['name', 'type', 'feed_url', 'enabled', 'created_by'];

    protected function casts(): array
    {
        return ['enabled' => 'boolean', 'last_fetched_at' => 'datetime', 'last_successful_fetch_at' => 'datetime'];
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'news_source_category');
    }

    public function discoveries(): HasMany
    {
        return $this->hasMany(NewsDiscovery::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
