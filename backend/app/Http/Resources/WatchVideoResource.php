<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WatchVideoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'thumbnail_url' => $this->thumbnail_url,
            'video_url' => $this->video_url,
            'youtube_video_id' => $this->youtube_video_id,
            'category' => $this->category,
            'source_name' => $this->whenLoaded('source', fn () => $this->source?->name),
            'published_at' => $this->published_at?->toISOString(),
            'is_featured' => $this->is_featured,
        ];
    }
}
