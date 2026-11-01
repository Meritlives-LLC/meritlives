<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $pageSize = \App\Support\PublicPagination::size($request);
        $categories = Category::query()
            ->where('status', 'active')
            ->when($request->filled('type'), fn ($query) =>
                $query->where('type', $request->string('type')->toString())
            )
            ->orderBy('name')
            ->paginate($pageSize);

        return CategoryResource::collection($categories);
    }
}
