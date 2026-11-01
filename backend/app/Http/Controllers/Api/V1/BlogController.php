<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BlogPostResource;
use App\Models\BlogPost;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $pageSize = \App\Support\PublicPagination::size($request);
        $posts = BlogPost::query()
            ->with(['author', 'category' => fn ($query) => $query->where('type', 'blog'), 'tags'])
            ->publiclyEligible()
            ->when($request->filled('category'), function ($query) use ($request) {
                $query->whereHas('category', fn ($category) =>
                    $category->where('type', 'blog')->where('status', 'active')
                        ->where('slug', $request->string('category')->toString())
                );
            })
            ->when($request->boolean('featured'), fn ($query) => $query->where('featured', true))
            ->latest('published_at')
            ->paginate($pageSize);

        \App\Support\EditorialImageMetadata::attach($posts->getCollection());
        return BlogPostResource::collection($posts)->response()->header('Cache-Control', 'private, no-store, max-age=0');
    }

    public function show(string $slug)
    {
        $post = BlogPost::query()
            ->with(['author', 'category' => fn ($query) => $query->where('type', 'blog'), 'tags'])
            ->publiclyEligible()
            ->where('slug', $slug)
            ->firstOrFail();

        \App\Support\EditorialImageMetadata::attach([$post]);
        return (new BlogPostResource($post))->response()->header('Cache-Control', 'private, no-store, max-age=0');
    }
}
