<?php

namespace App\Services\AiStudio;

interface AiGenerationProvider
{
    /** @return array{title:string,slug:string,excerpt:string,body:string,provider?:string,model?:string} */
    public function generateArticle(string $prompt, ?string $instructions): array;

    /** @return array{bytes:string,mime:string,provider?:string,model?:string} */
    public function generateImage(string $prompt, ?string $instructions): array;
}
