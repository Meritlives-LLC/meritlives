<?php

namespace App\Services;

use App\Models\News;
use App\Models\NewsImageGeneration;
use App\Models\NewsEditorialEvent;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class NewsImageGenerator
{
    public function generate(News $news, string $prompt, int $userId): NewsImageGeneration
    {
        $prompt = trim($prompt);
        if ($prompt === '' || mb_strlen($prompt) > 4000) {
            throw new RuntimeException('Provide an image prompt of 1–4000 characters.');
        }

        $apiKey = (string) config('openai_images.api_key');
        if ($apiKey === '') {
            throw new RuntimeException('OPENAI_API_KEY is not configured.');
        }

        // This is a configurable estimate, not an OpenAI billing guarantee.
        $estimate = max(0.01, (float) config('openai_images.estimated_cost_per_image_usd', 0.10));
        $dailyLimit = max(1, (int) config('openai_images.daily_limit', 10));
        $monthlyBudget = max(0, (float) config('openai_images.monthly_budget_usd', 5));
        // Reserve budget atomically before making the external request. The pending
        // reservation counts toward both limits while the provider call is in flight.
        $generation = Cache::lock('news-ai-image-budget:'.now()->format('Y-m'), 30)->block(5, function () use ($news, $userId, $prompt, $estimate, $dailyLimit, $monthlyBudget): NewsImageGeneration {
            $countedStatuses = ['pending', 'succeeded', 'failed'];
            $todayCount = NewsImageGeneration::whereDate('created_at', today())
                ->whereIn('status', $countedStatuses)->count();
            $monthSpend = (float) NewsImageGeneration::whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->whereIn('status', $countedStatuses)->sum('estimated_cost_usd');

            if ($todayCount >= $dailyLimit) {
                throw new RuntimeException('The daily image generation limit has been reached.');
            }
            if ($monthSpend + $estimate > $monthlyBudget) {
                throw new RuntimeException('The configured monthly image budget would be exceeded.');
            }

            return NewsImageGeneration::create([
                'news_id' => $news->id,
                'user_id' => $userId,
                'prompt' => $prompt,
                'model' => (string) config('openai_images.model', 'gpt-image-2'),
                'quality' => (string) config('openai_images.quality', 'low'),
                'estimated_cost_usd' => $estimate,
                'status' => 'pending',
            ]);
        });

        try {
            $response = Http::withToken($apiKey)->acceptJson()
                ->timeout((int) config('openai_images.timeout_seconds', 180))
                ->post('https://api.openai.com/v1/images/generations', [
                    'model' => config('openai_images.model', 'gpt-image-2'),
                    'prompt' => $prompt,
                    'size' => config('openai_images.size', '1536x1024'),
                    'quality' => config('openai_images.quality', 'low'),
                    'output_format' => config('openai_images.format', 'jpeg'),
                    'n' => 1,
                ]);

            if (! $response->successful()) {
                throw new RuntimeException('OpenAI image request failed with HTTP '.$response->status().'.');
            }

            $encoded = $response->json('data.0.b64_json');
            if (! is_string($encoded) || $encoded === '') {
                throw new RuntimeException('OpenAI did not return image bytes.');
            }

            $bytes = base64_decode($encoded, true);
            if ($bytes === false || strlen($bytes) < 100) {
                throw new RuntimeException('The generated image data was invalid.');
            }

            $extension = config('openai_images.format', 'jpeg') === 'png' ? 'png' : 'jpg';
            $path = 'news-generated/'.$news->id.'/'.uniqid('editorial-', true).'.'.$extension;
            Storage::disk('public')->put($path, $bytes);

            $generation->update(['image_path' => $path, 'status' => 'succeeded']);
            $news->forceFill([
                'featured_image' => $path,
                'image_review_status' => 'pending',
                'image_reviewed_by' => null,
                'image_reviewed_at' => null,
                'image_review_notes' => null,
            ])->save();

            NewsEditorialEvent::create([
                'news_id' => $news->id,
                'user_id' => $userId,
                'event_type' => 'image_generated',
                'from_status' => null,
                'to_status' => 'pending',
                'notes' => 'AI-generated editorial illustration; requires human image approval.',
                'metadata' => ['generation_id' => $generation->id, 'model' => $generation->model, 'prompt' => $prompt],
            ]);

            return $generation->fresh();
        } catch (Throwable $e) {
            $generation->update(['status' => 'failed', 'error_message' => mb_substr($e->getMessage(), 0, 2000)]);
            throw $e;
        }
    }
}
