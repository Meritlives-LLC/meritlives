<?php

return [
    // AI remains unavailable until explicitly enabled and configured.
    'enabled' => (bool) env('AI_STUDIO_ENABLED', false),
    'provider' => env('AI_STUDIO_PROVIDER', 'none'),
    'model' => env('AI_STUDIO_MODEL', ''),
    'api_key' => env('OPENAI_API_KEY', ''),
    'connect_timeout_seconds' => (int) env('AI_STUDIO_CONNECT_TIMEOUT_SECONDS', 5),
    'timeout_seconds' => (int) env('AI_STUDIO_TIMEOUT_SECONDS', 45),
    'max_output_tokens' => (int) env('AI_STUDIO_MAX_OUTPUT_TOKENS', 1200),
    'max_response_bytes' => 100000,
    'image_max_bytes' => 10 * 1024 * 1024,
    'image_max_pixels' => 40000000,
    'image_allowed_mimes' => ['image/jpeg', 'image/png', 'image/webp'],
    'generation_limit_per_minute' => 5,
];
