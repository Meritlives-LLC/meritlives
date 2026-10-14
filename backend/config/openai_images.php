<?php

return [
    'api_key' => env('OPENAI_API_KEY'),
    'model' => env('OPENAI_IMAGE_MODEL', 'gpt-image-2'),
    'quality' => env('OPENAI_IMAGE_QUALITY', 'low'),
    'size' => env('OPENAI_IMAGE_SIZE', '1536x1024'),
    'format' => env('OPENAI_IMAGE_FORMAT', 'jpeg'),
    'compression' => (int) env('OPENAI_IMAGE_COMPRESSION', 82),
    // Estimate only; set this from current pricing for the selected model/quality.
    'estimated_cost_per_image_usd' => (float) env('OPENAI_IMAGE_ESTIMATED_COST_USD', 0.10),
    'monthly_budget_usd' => (float) env('OPENAI_IMAGE_MONTHLY_BUDGET_USD', 5.00),
    'daily_limit' => (int) env('OPENAI_IMAGE_DAILY_LIMIT', 10),
    'timeout_seconds' => (int) env('OPENAI_IMAGE_TIMEOUT', 180),
];