<?php

return [
    'api_key' => env('OPENAI_API_KEY'),
    'model' => env('OPENAI_TEXT_MODEL', 'gpt-4.1-mini'),
    'max_output_tokens' => (int) env('OPENAI_ARTICLE_MAX_OUTPUT_TOKENS', 1800),
    // Estimate only. Set conservatively using current model pricing.
    'estimated_cost_per_article_usd' => (float) env('OPENAI_ARTICLE_ESTIMATED_COST_USD', 0.05),
    'monthly_budget_usd' => (float) env('OPENAI_ARTICLE_MONTHLY_BUDGET_USD', 3.00),
    'daily_limit' => (int) env('OPENAI_ARTICLE_DAILY_LIMIT', 10),
    'minimum_source_words' => (int) env('OPENAI_ARTICLE_MINIMUM_SOURCE_WORDS', 180),
    'timeout_seconds' => (int) env('OPENAI_ARTICLE_TIMEOUT', 120),
];