<?php
namespace App\Services\AiImages;

interface ImageProvider
{
    public function generate(string $prompt, string $size, bool $authorizeCost = false): string;
}
