<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;

class TrustedProxies extends \Illuminate\Http\Middleware\TrustProxies
{
    protected $headers = Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_PROTO;

    protected function setTrustedProxyIpAddresses(Request $request)
    {
        // Do not inherit automatic wildcard trust based on the request Host.
        $request->setTrustedProxies($this->proxies(), $this->headers);
    }

    protected function proxies()
    {
        $proxies = config('security.trusted_proxies', []);
        foreach ($proxies as $proxy) {
            $parts = explode('/', $proxy, 2);
            $bits = str_contains($parts[0], ':') ? 128 : 32;
            if (! filter_var($parts[0], FILTER_VALIDATE_IP)
                || (isset($parts[1]) && (! ctype_digit($parts[1]) || (int) $parts[1] < 1 || (int) $parts[1] > $bits))) {
                throw new \InvalidArgumentException('TRUSTED_PROXIES must contain exact IP addresses or CIDRs.');
            }
        }
        return $proxies;
    }
}
