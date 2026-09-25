<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NewsResource;
use App\Models\News;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    public function index(Request $request)
    {
        $news = News::query()
            ->with('category')
            ->where('status', 'published')
            ->when($request->filled('category'), function ($query) use ($request) {
                $query->whereHas('category', fn ($category) =>
                    $category->where('slug', $request->string('category')->toString())
                );
            })
            ->when($request->boolean('featured'), fn ($query) => $query->where('featured', true))
            ->latest('published_at')
            ->paginate($request->integer('per_page', 12));

        return NewsResource::collection($news);
    }

    public function show(string $slug)
    {
        $news = News::query()
            ->with('category')
            ->where('status', 'published')
            ->where('slug', $slug)
            ->firstOrFail();

        return new NewsResource($news);
    }
}
