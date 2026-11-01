<?php

$siteUrl = (string) env('WP_SITE_URL', 'https://meritlives.com');
$siteHost = parse_url($siteUrl, PHP_URL_HOST);
$configuredHosts = array_filter(array_map(
    static fn (string $host): string => strtolower(trim($host)),
    explode(',', (string) env('WP_IMAGE_ALLOWED_HOSTS', ''))
));

return [
    'site_url' => $siteUrl,
    'source_name' => (string) env('WP_IMPORT_SOURCE_NAME', 'MERITLIVES'),
    // CDN hosts must be listed explicitly; the WordPress origin is always allowed.
    'image_allowed_hosts' => array_values(array_unique(array_filter([
        is_string($siteHost) ? strtolower($siteHost) : null,
        ...$configuredHosts,
    ]))),
];
