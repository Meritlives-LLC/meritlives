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
        $posts = BlogPost::query()
            ->with(['author', 'category', 'tags'])
            ->where('status', 'published')
            ->when($request->filled('category'), function ($query) use ($request) {
                $query->whereHas('category', fn ($category) =>
                    $category->where('slug', $request->string('category')->toString())
                );
            })
            ->when($request->boolean('featured'), fn ($query) => $query->where('featured', true))
            ->latest('published_at')
            ->paginate($request->integer('per_page', 12));

        return BlogPostResource::collection($posts);
    }

    public function show(string $slug)
    {
        $post = BlogPost::query()
            ->with(['author', 'category', 'tags'])
            ->where('status', 'published')
            ->where('slug', $slug)
            ->firstOrFail();

        return new BlogPostResource($post);
    }
}
