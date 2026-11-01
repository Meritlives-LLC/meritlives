<?php

namespace App\Support;

use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

final class HtmlContent
{
    private static ?HtmlSanitizer $sanitizer = null;

    public static function sanitize(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        self::$sanitizer ??= new HtmlSanitizer(
            (new HtmlSanitizerConfig())
                ->allowSafeElements()
                ->allowRelativeLinks()
                ->allowRelativeMedias()
                ->withMaxInputLength(1_000_000)
        );

        return self::$sanitizer->sanitize($html);
    }
}
