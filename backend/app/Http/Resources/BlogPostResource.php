<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Support\HtmlContent;

class BlogPostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $media = $this->resource->relationLoaded('featuredMedia') ? $this->resource->getRelation('featuredMedia') : null;
        return [
            'featured_image_alt' => $media?->alt_text,
            'featured_image_disclosure' => ($media?->metadata['ai_generated'] ?? false) ? $media->metadata['disclosure'] : null,
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->when($request->routeIs('*.show'), fn () => HtmlContent::sanitize($this->content)),
            'featured_image' => $this->featured_image
                ? (Str::startsWith($this->featured_image, ['http://', 'https://'])
                    ? $this->featured_image
                    : Storage::disk('public')->url($this->featured_image))
                : null,
            'author' => $this->whenLoaded('author', fn () => [
                'id' => $this->author?->id,
                'name' => $this->author?->name,
            ]),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->map(fn ($tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
            ])),
            'status' => $this->status,
            'published_at' => $this->published_at?->toISOString(),
            'featured' => $this->featured,
            'seo' => [
                'title' => $this->seo_title,
                'description' => $this->seo_description,
                'canonical_url' => $this->canonical_url,
            ],
        ];
    }
}
