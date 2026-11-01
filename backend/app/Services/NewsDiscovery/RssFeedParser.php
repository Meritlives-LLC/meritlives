<?php

namespace App\Services\NewsDiscovery;

use SimpleXMLElement;
use Throwable;

class RssFeedParser
{
    public function parse(string $xml): SimpleXMLElement
    {
        if ($xml === '' || preg_match('/<!\s*(DOCTYPE|ENTITY)\b/i', $xml)) {
            throw new NewsDiscoveryException('The feed is empty or contains unsupported XML declarations.');
        }

        $previous = libxml_use_internal_errors(true);
        try {
            $parsed = simplexml_load_string($xml, SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOCDATA | LIBXML_NOBLANKS);
            if (! $parsed instanceof SimpleXMLElement || ! isset($parsed->channel->item)) {
                throw new NewsDiscoveryException('The response is not a supported RSS feed.');
            }

            return $parsed;
        } catch (Throwable $exception) {
            if ($exception instanceof NewsDiscoveryException) {
                throw $exception;
            }
            throw new NewsDiscoveryException('The RSS feed could not be safely parsed.');
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }
}
