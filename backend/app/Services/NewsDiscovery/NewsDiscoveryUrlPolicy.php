<?php

namespace App\Services\NewsDiscovery;

class NewsDiscoveryUrlPolicy
{
    public function feedUrlIsAllowed(string $url): bool
    {
        $parts = parse_url($url);
        if (! is_array($parts)
            || strtolower((string) ($parts['scheme'] ?? '')) !== 'https'
            || empty($parts['host'])
            || isset($parts['user']) || isset($parts['pass'])
            || (isset($parts['port']) && (int) $parts['port'] !== 443)
            || filter_var($parts['host'], FILTER_VALIDATE_IP)
            || str_contains((string) $parts['host'], '%')) {
            return false;
        }

        $host = strtolower(rtrim((string) $parts['host'], '.'));
        $allowed = config('news_discovery.allowed_hosts', []);

        return in_array($host, array_map(static fn ($item) => strtolower(rtrim((string) $item, '.')), $allowed), true);
    }

    public function canonicalize(string $url): ?string
    {
        $parts = parse_url(trim($url));
        if (! is_array($parts) || ! in_array(strtolower((string) ($parts['scheme'] ?? '')), ['http', 'https'], true)
            || empty($parts['host']) || isset($parts['user']) || isset($parts['pass'])) {
            return null;
        }

        $scheme = strtolower($parts['scheme']);
        $host = strtolower(rtrim($parts['host'], '.'));
        $port = isset($parts['port']) && ! in_array([$scheme, (int) $parts['port']], [['https', 443], ['http', 80]], true)
            ? ':'.(int) $parts['port'] : '';
        $path = (string) ($parts['path'] ?? '/');
        $path = '/'.ltrim($path, '/');
        if ($path !== '/') {
            $path = rtrim($path, '/');
        }

        $query = [];
        if (! empty($parts['query'])) {
            parse_str($parts['query'], $query);
            foreach (array_keys($query) as $key) {
                if (preg_match('/^(utm_[a-z0-9_]+|fbclid|gclid)$/i', (string) $key)) {
                    unset($query[$key]);
                }
            }
            ksort($query);
        }
        $queryString = http_build_query($query);

        return $scheme.'://'.$host.$port.$path.($queryString !== '' ? '?'.$queryString : '');
    }
}
