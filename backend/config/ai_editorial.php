<?php

return [
    'enabled' => (bool) env('AI_EDITORIAL_ENABLED', false),
    'provider' => env('AI_EDITORIAL_PROVIDER', 'mock'),
    'model' => env('OPENAI_MODEL', env('AI_STUDIO_MODEL', '')),
    'limit_per_minute' => 5,
];
