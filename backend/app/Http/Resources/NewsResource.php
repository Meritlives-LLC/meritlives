<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->when($request->routeIs('*.show'), $this->content),
            'source' => [
                'name' => $this->source_name,
                'url' => $this->source_url,
            ],
            'image_url' => $this->image_url,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'published_at' => $this->published_at?->toISOString(),
            'featured' => $this->featured,
        ];
    }
}
