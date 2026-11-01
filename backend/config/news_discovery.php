<?php

return [
    // Empty by default: no configurable external host can be fetched until an
    // operator deliberately adds its exact HTTPS hostname.
    'allowed_hosts' => array_values(array_filter(array_map(
        static fn (string $host): string => strtolower(trim($host)),
        explode(',', (string) env('NEWS_DISCOVERY_ALLOWED_HOSTS', '')),
    ))),
    'timeout_seconds' => 12,
    'connect_timeout_seconds' => 4,
    'max_feed_bytes' => 1_500_000,
    'max_items_per_feed' => 100,
    'max_excerpt_length' => 1200,
    'refresh_limit_per_minute' => 3,
];
