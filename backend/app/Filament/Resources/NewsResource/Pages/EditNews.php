<?php

namespace App\Filament\Resources\NewsResource\Pages;

use App\Filament\Resources\NewsResource;
use Filament\Resources\Pages\EditRecord;

class EditNews extends EditRecord
{
    use \App\Filament\Resources\Concerns\HasEditorialAssistant;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        return $this->editorialDraftData($data);
    }

    protected static string $resource = NewsResource::class;
}
