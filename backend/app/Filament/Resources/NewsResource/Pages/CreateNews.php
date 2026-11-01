<?php

namespace App\Filament\Resources\NewsResource\Pages;

use App\Filament\Resources\NewsResource;
use Filament\Resources\Pages\CreateRecord;

class CreateNews extends CreateRecord
{
    use \App\Filament\Resources\Concerns\HasEditorialAssistant;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        return $this->editorialDraftData($data);
    }

    protected static string $resource = NewsResource::class;
}
