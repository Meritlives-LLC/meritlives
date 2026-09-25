<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'logo' => $this->logo,
            'cover_image' => $this->cover_image,
            'website_url' => $this->website_url,
            'cta_text' => $this->cta_text,
            'status' => $this->status,
            'featured' => $this->featured,
            'features' => ProductFeatureResource::collection($this->whenLoaded('features')),
        ];
    }
}
