<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BlogPost extends Model
{
    protected $fillable = [
        'user_id','category_id','title','slug','excerpt','content',
        'featured_image','status','published_at','seo_title',
        'seo_description','canonical_url','featured','is_public_approved'
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'featured' => 'boolean',
        'is_public_approved' => 'boolean',
    ];

    public function scopePubliclyEligible(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where('is_public_approved', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function author(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function tags(): BelongsToMany { return $this->belongsToMany(Tag::class); }

    protected static function booted(): void
    {
        static::updated(function (self $post): void {
            if ($post->status === 'published' && $post->wasChanged('status')) {
                $discovery = \App\Models\NewsDiscovery::query()
                    ->where('draft_model', self::class)->where('draft_id', $post->id)
                    ->where('status', \App\Models\NewsDiscovery::STATUS_DRAFT_SAVED)->first();
                if ($discovery) {
                    $discovery->forceFill(['status' => \App\Models\NewsDiscovery::STATUS_PUBLISHED])->save();
                }
            }
        });
    }
}
