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
        $pageSize = \App\Support\PublicPagination::size($request);
        $news = News::query()
            ->with(['category' => fn ($query) => $query->where('type', 'news')->where('status', 'active')])
            ->publiclyEligible()
            ->when($request->filled('category'), function ($query) use ($request) {
                $query->whereHas('category', fn ($category) =>
                    $category->where('type', 'news')->where('status', 'active')
                        ->where('slug', $request->string('category')->toString())
                );
            })
            ->when($request->boolean('featured'), fn ($query) => $query->where('featured', true))
            ->latest('published_at')
            ->paginate($pageSize);

        \App\Support\EditorialImageMetadata::attach($news->getCollection());
        return NewsResource::collection($news);
    }

    public function show(string $slug)
    {
        $news = News::query()
            ->with(['category' => fn ($query) => $query->where('type', 'news')->where('status', 'active')])
            ->publiclyEligible()
            ->where('slug', $slug)
            ->firstOrFail();

        \App\Support\EditorialImageMetadata::attach([$news]);
        return new NewsResource($news);
    }
}
