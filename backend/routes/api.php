<?php

use App\Http\Controllers\Api\V1\BlogController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\NewsController;
use App\Http\Controllers\Api\V1\NewsletterController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\WatchController;
use Illuminate\Support\Facades\Route;

// Merged from phase1 (base), phase3 (full route set) and phase7 (named
// rate limiters + hardening). See docs/MERGE-NOTES.md.

Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'data' => [
                'status' => 'ok',
                'application' => config('app.name'),
            ],
            'meta' => [],
        ]);
    })->name('api.health');

    Route::get('/products', [ProductController::class, 'index'])->name('api.products.index');
    Route::get('/products/{slug}', [ProductController::class, 'show'])->name('api.products.show');

    Route::get('/services', [ServiceController::class, 'index'])->name('api.services.index');
    Route::get('/services/{slug}', [ServiceController::class, 'show'])->name('api.services.show');

    Route::get('/news', [NewsController::class, 'index'])->name('api.news.index');
    Route::get('/news/{slug}', [NewsController::class, 'show'])->name('api.news.show');

    Route::get('/blog', [BlogController::class, 'index'])->name('api.blog.index');
    Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('api.blog.show');

    Route::get('/watch', [WatchController::class, 'index'])->name('api.watch.index');
    Route::get('/watch/{slug}', [WatchController::class, 'show'])->name('api.watch.show');

    Route::get('/categories', [CategoryController::class, 'index'])->name('api.categories.index');
    Route::get('/search', SearchController::class)->name('api.search');

    // Phase 7 replaces the flat throttle:10,1 with named limiters defined in
    // AppServiceProvider (contact: 5/min per IP, newsletter: 10/min per IP).
    Route::post('/contact', [ContactController::class, 'store'])
        ->middleware('throttle:contact')
        ->name('api.contact.store');

    Route::post('/newsletter', [NewsletterController::class, 'store'])
        ->middleware('throttle:newsletter')
        ->name('api.newsletter.store');
});
