<?php
namespace App\Services\AiImages;

class ImageException extends \RuntimeException
{
    public function __construct(string $message, public readonly string $reason = 'provider') { parent::__construct($message); }
}
