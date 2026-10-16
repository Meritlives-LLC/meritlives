<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use RuntimeException;

class News extends Model
{
    protected $fillable = [
        'category_id', 'title', 'slug', 'excerpt', 'content', 'author_name', 'created_by',
        'source_name', 'source_url', 'image_url', 'featured_image', 'published_at',
        'external_id', 'status', 'featured', 'editorial_status', 'article_reviewed_by',
        'article_reviewed_at', 'article_review_notes', 'image_review_status',
        'image_reviewed_by', 'image_reviewed_at', 'image_review_notes',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'article_reviewed_at' => 'datetime',
        'image_reviewed_at' => 'datetime',
        'featured' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (News $news): void {
            // Capture the authenticated CMS creator; CLI imports remain nullable.
            if ($news->created_by === null && auth()->check()) {
                $news->created_by = (int) auth()->id();
            }
        });

        static::saving(function (News $news): void {
            if ($news->status === 'published') {
                if ($news->editorial_status !== 'approved'
                    || $news->image_review_status !== 'approved'
                    || ! $news->article_reviewed_at
                    || ! $news->image_reviewed_at) {
                    throw new RuntimeException('Publishing blocked: article and image require separate editorial approvals.');
                }
            }
        });

        static::updating(function (News $news): void {
            $articleFields = ['title', 'slug', 'excerpt', 'content', 'category_id', 'source_name', 'source_url'];
            if ($news->isDirty($articleFields)) {
                if ($news->editorial_status !== 'pending_review') {
                    $news->editorial_status = 'needs_work';
                }
                $news->article_reviewed_by = null;
                $news->article_reviewed_at = null;
                $news->article_review_notes = null;
                $news->image_review_status = 'pending';
                $news->image_reviewed_by = null;
                $news->image_reviewed_at = null;
                $news->image_review_notes = null;
                if ($news->status === 'published') {
                    $news->status = 'pending';
                }
            }

            if ($news->isDirty(['image_url', 'featured_image'])) {
                $news->image_review_status = 'pending';
                $news->image_reviewed_by = null;
                $news->image_reviewed_at = null;
                $news->image_review_notes = null;
                if ($news->status === 'published') {
                    $news->status = 'pending';
                }
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function imageGenerations(): HasMany
    {
        return $this->hasMany(NewsImageGeneration::class);
    }

    public function articleGenerations(): HasMany
    {
        return $this->hasMany(NewsArticleGeneration::class);
    }

    public function editorialEvents(): HasMany
    {
        return $this->hasMany(NewsEditorialEvent::class)->latest();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function articleReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'article_reviewed_by');
    }

    public function imageReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'image_reviewed_by');
    }
}
