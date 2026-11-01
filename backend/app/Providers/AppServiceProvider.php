<?php

namespace App\Providers;

use App\Services\AiStudio\AiGenerationProvider;
use App\Services\AiStudio\OpenAiGenerationProvider;
use App\Services\AiStudio\UnavailableAiGenerationProvider;
use App\Services\NewsDiscovery\AiStudioNewsRewriteProvider;
use App\Services\NewsDiscovery\NewsRewriteProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(\App\Services\AiImages\ImageProvider::class, fn ($app) => match (config('ai_image.provider')) {
            'mock' => $app->make(\App\Services\AiImages\MockImageProvider::class),
            'openai' => $app->make(\App\Services\AiImages\OpenAiImageProvider::class),
            default => throw new \App\Services\AiImages\ImageException('Image provider is unavailable.', 'configuration'),
        });
        $this->app->bind(\App\Services\AiEditorial\EditorialProvider::class, function ($app) {
            return match (config('ai_editorial.provider')) {
                'mock' => $app->make(\App\Services\AiEditorial\MockEditorialProvider::class),
                'openai' => $app->make(\App\Services\AiEditorial\ResponsesEditorialProvider::class),
                default => throw new \RuntimeException('The editorial AI provider is unavailable.'),
            };
        });
        $this->app->singleton(AiGenerationProvider::class, function ($app): AiGenerationProvider {
            if (config('ai_studio.provider') === 'openai' && is_string(config('ai_studio.api_key')) && trim(config('ai_studio.api_key')) !== '') {
                return $app->make(OpenAiGenerationProvider::class);
            }

            return $app->make(UnavailableAiGenerationProvider::class);
        });
        $this->app->singleton(NewsRewriteProvider::class, AiStudioNewsRewriteProvider::class);
    }

    public function boot(): void
    {
        RateLimiter::for('public-read', fn (Request $request) => Limit::perMinute(120)->by($request->ip()));
        RateLimiter::for('public-search', fn (Request $request) => Limit::perMinute(30)->by($request->ip()));

        RateLimiter::for('contact', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('newsletter', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });
    }
}
