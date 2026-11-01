<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AiStudioImagePreviewController;
use App\Http\Controllers\Admin\FeatureImagePreviewController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/admin/ai-studio/jobs/{job}/preview', AiStudioImagePreviewController::class)
    ->middleware(['auth', 'throttle:60,1'])
    ->name('ai-studio.preview');

Route::get('/admin/feature-images/{job}/preview', FeatureImagePreviewController::class)
    ->middleware([\Filament\Http\Middleware\SetUpPanel::class.':admin', \Filament\Http\Middleware\Authenticate::class, 'throttle:60,1'])
    ->name('feature-images.preview');
