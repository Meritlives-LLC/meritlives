<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\WatchVideoResource;
use App\Models\WatchVideo;
use Illuminate\Http\Request;

class WatchController extends Controller
{
    public function index(Request $request)
    {
        $pageSize = \App\Support\PublicPagination::size($request);

        $videos = WatchVideo::query()
            ->with('source:id,name')
            ->publiclyAvailable()
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate($pageSize);

        return WatchVideoResource::collection($videos);
    }

    public function show(string $slug)
    {
        $video = WatchVideo::query()
            ->with('source:id,name')
            ->publiclyAvailable()
            ->where('slug', $slug)
            ->firstOrFail();

        return new WatchVideoResource($video);
    }
}
