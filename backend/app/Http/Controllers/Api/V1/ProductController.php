<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::query()
            ->with('features')
            ->where('status', 'published')
            ->when($request->boolean('featured'), fn ($query) => $query->where('featured', true))
            ->orderBy('sort_order')
            ->paginate($request->integer('per_page', 12));

        return ProductResource::collection($products);
    }

    public function show(string $slug)
    {
        $product = Product::query()
            ->with('features')
            ->where('status', 'published')
            ->where('slug', $slug)
            ->firstOrFail();

        return new ProductResource($product);
    }
}
