<?php

namespace App\Filament\Resources\WatchSourceResource\Pages;

use App\Filament\Resources\WatchSourceResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListWatchSources extends ListRecords
{
    protected static string $resource = WatchSourceResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()];
    }
}
