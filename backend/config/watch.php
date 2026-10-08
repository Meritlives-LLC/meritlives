<?php

return [
    'recent_days' => (int) env('WATCH_RECENT_DAYS', 30),
    'max_videos_per_source' => (int) env('WATCH_MAX_VIDEOS_PER_SOURCE', 30),
    'api_timeout_seconds' => (int) env('WATCH_API_TIMEOUT_SECONDS', 20),
];
