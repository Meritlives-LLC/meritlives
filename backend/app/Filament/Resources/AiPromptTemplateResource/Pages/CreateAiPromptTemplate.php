<?php

namespace App\Filament\Resources\AiPromptTemplateResource\Pages;

use App\Filament\Resources\AiPromptTemplateResource;
use Filament\Resources\Pages\CreateRecord;

class CreateAiPromptTemplate extends CreateRecord
{
    protected static string $resource = AiPromptTemplateResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['created_by'] = auth()->id();
        $data['version'] = 1;

        return $data;
    }
}
