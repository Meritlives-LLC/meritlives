<?php

return [
    'enabled' => (bool) env('AI_IMAGE_ENABLED', false),
    'provider' => env('AI_IMAGE_PROVIDER', 'mock'),
    'allow_billable' => (bool) env('AI_IMAGE_ALLOW_BILLABLE', false),
    'model' => env('AI_IMAGE_MODEL', ''),
    'quality' => env('AI_IMAGE_QUALITY', 'medium'),
    // Verified against the official Images API reference, 2026-10-31. No retired DALL-E/GPT Image 1.
    'models' => ['gpt-image-1.5', 'gpt-image-2', 'gpt-image-2.5-sunburst', 'gpt-image-2.5-flare'],
    'sizes' => ['16:9' => '1536x1024', '1:1' => '1024x1024', '4:5' => '1024x1536'],
    'output_sizes' => ['16:9' => [1280, 720], '1:1' => [1024, 1024], '4:5' => [1024, 1280]],
    'styles' => ['editorial' => 'Photorealistic editorial photography', 'corporate' => 'Corporate photography',
        'technology' => 'Technology and innovation', 'cinematic' => 'Cinematic photography', 'illustration' => 'Professional illustration'],
    'max_bytes' => 5 * 1024 * 1024,
    'max_pixels' => 4000000,
    'max_response_bytes' => 8 * 1024 * 1024,
    'timeout_seconds' => 120,
    'connect_timeout_seconds' => 5,
    'per_minute' => (int) env('AI_IMAGE_PER_MINUTE', 3),
    'per_day' => (int) env('AI_IMAGE_PER_DAY', 20),
    'preview_minutes' => 30,
    // Mock failure/delay injection is server-side only and never inferred from an editor's prompt.
    'mock_scenario' => 'success',
    'mock_delay_ms' => 0,
];
