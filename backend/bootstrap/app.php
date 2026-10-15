<?php

use App\Http\Middleware\ForceJson;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

// Merged from the Laravel skeleton's default bootstrap/app.php + phase7's
// bootstrap/app.php.example (API routing, security headers, forced JSON on
// API responses). This is the real, wired file — not an example to merge
// by hand.
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        \\App\\Console\\Commands\\CollectWatchVideos::class,
        \\App\\Console\\Commands\\SyncRssNews::class,
        \\App\\Console\\Commands\\ImportWordPressNews::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'force.json' => ForceJson::class,
            'security.headers' => SecurityHeaders::class,
        ]);

        $middleware->append(SecurityHeaders::class);
        $middleware->api(append: [
            ForceJson::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
