<?php

namespace App\Filament\Resources\AiGenerationJobResource\Pages;

use App\Filament\Resources\AiGenerationJobResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListAiGenerationJobs extends ListRecords
{
    protected static string $resource = AiGenerationJobResource::class;

    protected function getHeaderActions(): array { return [Actions\CreateAction::make()]; }
}
