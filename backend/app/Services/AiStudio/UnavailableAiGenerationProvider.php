<?php

namespace App\Services\AiStudio;

use RuntimeException;

class UnavailableAiGenerationProvider implements AiGenerationProvider
{
    public function generateArticle(string $prompt, ?string $instructions): array
    {
        throw new RuntimeException('No AI generation provider is configured.');
    }

    public function generateImage(string $prompt, ?string $instructions): array
    {
        throw new RuntimeException('No AI generation provider is configured.');
    }
}
