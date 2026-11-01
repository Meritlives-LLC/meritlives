<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use App\Support\HtmlContent;

class NewsResource extends JsonResource
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
            'content' => $this->when($request->routeIs('*.show'), HtmlContent::sanitize($this->content)),
            'author_name' => $this->author_name,
            'source' => [
                'name' => $this->source_name,
                'url' => $this->source_url,
            ],
            'image_url' => $this->image_url,
            'featured_image' => $this->featured_image
                ? Storage::disk('public')->url($this->featured_image)
                : null,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'published_at' => $this->published_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'featured' => $this->featured,
        ];
    }
}
