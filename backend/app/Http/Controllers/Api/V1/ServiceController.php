<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $pageSize = \App\Support\PublicPagination::size($request);
        $services = Service::query()
            ->where('status', 'published')
            ->when($request->boolean('featured'), fn ($query) => $query->where('featured', true))
            ->orderBy('sort_order')
            ->paginate($pageSize);

        return ServiceResource::collection($services);
    }

    public function show(string $slug)
    {
        $service = Service::query()
            ->where('status', 'published')
            ->where('slug', $slug)
            ->firstOrFail();

        return new ServiceResource($service);
    }
}
