<?php

return [
    // Set exact proxy IPs/CIDRs only after verifying the deployment topology.
    'trusted_proxies' => array_values(array_filter(array_map('trim', explode(',', (string) env('TRUSTED_PROXIES', ''))))),
    // Enable only after confirming HTTPS for the intended domain scope.
    'hsts_enabled' => (bool) env('SECURITY_HSTS_ENABLED', false),
    'hsts_max_age' => (int) env('SECURITY_HSTS_MAX_AGE', 31536000),
];
