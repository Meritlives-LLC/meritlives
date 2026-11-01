<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class News extends Model
{
    public function scopePubliclyEligible(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('status', 'published')->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    protected $fillable = [
        'category_id','title','slug','excerpt','content','author_name','source_name','source_url',
        'image_url','featured_image','published_at','external_id','status','featured','seo_title','seo_description'
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'featured' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    protected static function booted(): void
    {
        static::updated(function (self $news): void {
            if ($news->status === 'published' && $news->wasChanged('status')) {
                $discovery = \App\Models\NewsDiscovery::query()
                    ->where('draft_model', self::class)->where('draft_id', $news->id)
                    ->where('status', \App\Models\NewsDiscovery::STATUS_DRAFT_SAVED)->first();
                if ($discovery) {
                    $discovery->forceFill(['status' => \App\Models\NewsDiscovery::STATUS_PUBLISHED])->save();
                }
            }
        });
    }
}
