<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequestSizeLimit
{
    public function handle(Request $request, Closure $next)
    {
        $path = $request->path();
        if (! str_starts_with($path, 'api/') && ! str_starts_with($path, 'livewire/')) {
            return $next($request);
        }
        abort_if(strlen($request->getQueryString() ?? '') > 4096, 414, 'Query string is too large.');
        $limit = $path === 'livewire/upload-file' ? 8 * 1024 * 1024
            : (str_starts_with($path, 'livewire/') ? 1024 * 1024 : 64 * 1024);
        $length = $request->server('CONTENT_LENGTH');
        abort_if(is_numeric($length) && (float) $length > $limit, 413, 'Request body is too large.');
        // Content-Length may be absent for chunked requests. The web server must also cap bodies.
        if (! str_contains(strtolower($request->header('Content-Type', '')), 'multipart/form-data')) {
            abort_if(strlen($request->getContent()) > $limit, 413, 'Request body is too large.');
        }
        return $next($request);
    }
}
