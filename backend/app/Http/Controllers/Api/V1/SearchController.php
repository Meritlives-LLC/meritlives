<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BlogPostResource;
use App\Http\Resources\NewsResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ServiceResource;
use App\Services\SearchService;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request, SearchService $searchService)
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $results = $searchService->search($validated['q']);

        return response()->json([
            'data' => [
                'news' => NewsResource::collection($results['news']),
                'blog' => BlogPostResource::collection($results['blog']),
                'products' => ProductResource::collection($results['products']),
                'services' => ServiceResource::collection($results['services']),
            ],
            'meta' => [
                'query' => $validated['q'],
            ],
        ]);
    }
}
