<?php

namespace App\Services;

use App\Models\BlogPost;
use App\Models\News;
use App\Models\Product;
use App\Models\Service;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SearchService
{
    public function search(string $term): array
    {
        $term = trim($term);

        return [
            'news' => $this->news($term),
            'blog' => $this->blog($term),
            'products' => $this->products($term),
            'services' => $this->services($term),
        ];
    }

    private function news(string $term): Collection
    {
        return News::query()
            ->with('category')
            ->where('status', 'published')
            ->where(function ($query) use ($term) {
                $query->where('title', 'like', "%{$term}%")
                    ->orWhere('excerpt', 'like', "%{$term}%");
            })
            ->latest('published_at')
            ->limit(10)
            ->get();
    }

    private function blog(string $term): Collection
    {
        return BlogPost::query()
            ->with(['category', 'author', 'tags'])
            ->where('status', 'published')
            ->where(function ($query) use ($term) {
                $query->where('title', 'like', "%{$term}%")
                    ->orWhere('excerpt', 'like', "%{$term}%")
                    ->orWhere('content', 'like', "%{$term}%");
            })
            ->latest('published_at')
            ->limit(10)
            ->get();
    }

    private function products(string $term): Collection
    {
        return Product::query()
            ->with('features')
            ->where('status', 'published')
            ->where(function ($query) use ($term) {
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('short_description', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%");
            })
            ->orderBy('sort_order')
            ->limit(10)
            ->get();
    }

    private function services(string $term): Collection
    {
        return Service::query()
            ->where('status', 'published')
            ->where(function ($query) use ($term) {
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('short_description', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%");
            })
            ->orderBy('sort_order')
            ->limit(10)
            ->get();
    }
}
