<?php

namespace App\Services\AiEditorial;

interface EditorialProvider
{
    public function suggest(array $input, array $categories): array;
}
