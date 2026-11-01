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
        RateLimiter::for('public-api', fn (Request $request) => Limit::perMinute(config('traffic.api_per_minute', 180))->by($request->ip()));
        RateLimiter::for('livewire-update', fn (Request $request) => [
            Limit::perMinute(config('traffic.livewire_ip_per_minute', 300))->by('ip:'.$request->ip()),
            Limit::perMinute(config('traffic.livewire_per_minute', 120))->by('actor:'.($request->user()?->id ?? $request->ip())),
        ]);
        RateLimiter::for('admin-uploads', fn (Request $request) => [
            Limit::perMinute(60)->by('ip:'.$request->ip()),
            Limit::perMinute(30)->by('user:'.$request->user()?->id),
        ]);
        \Livewire\Livewire::setUpdateRoute(fn ($handle) => \Illuminate\Support\Facades\Route::post('/livewire/update', $handle)
            ->middleware(['web', 'throttle:livewire-update']));
        config([
            'livewire.temporary_file_upload.disk' => 'local',
            'livewire.temporary_file_upload.middleware' => [
                \Filament\Http\Middleware\SetUpPanel::class.':admin',
                \Filament\Http\Middleware\Authenticate::class,
                'throttle:admin-uploads',
            ],
            'livewire.temporary_file_upload.rules' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
        ]);
        RateLimiter::for('public-read', fn (Request $request) => Limit::perMinute(120)->by($request->ip()));
        RateLimiter::for('public-search', fn (Request $request) => Limit::perMinute(30)->by($request->ip()));

        RateLimiter::for('contact', function (Request $request) {
            return [Limit::perMinute(5)->by('minute:'.$request->ip()),
                Limit::perHour(config('traffic.contact_per_hour', 30))->by('hour:'.$request->ip())];
        });

        RateLimiter::for('newsletter', function (Request $request) {
            return [Limit::perMinute(10)->by('minute:'.$request->ip()),
                Limit::perHour(config('traffic.newsletter_per_hour', 60))->by('hour:'.$request->ip())];
        });
    }
}
