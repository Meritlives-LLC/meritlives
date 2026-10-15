<?php

$siteHost = parse_url((string) env('WP_SITE_URL', 'https://meritlives.com'), PHP_URL_HOST);
$configuredHosts = array_filter(array_map(
    static fn (string $host): string => strtolower(trim($host)),
    explode(',', (string) env('WP_IMAGE_ALLOWED_HOSTS', ''))
));

return [
    // Exact HTTPS hosts allowed for WordPress media downloads. Include CDN hosts explicitly.
    'image_allowed_hosts' => array_values(array_unique($configuredHosts ?: array_filter([$siteHost]))),
];
