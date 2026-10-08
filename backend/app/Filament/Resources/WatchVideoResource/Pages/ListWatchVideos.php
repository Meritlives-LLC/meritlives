<?php

namespace App\Filament\Resources\WatchVideoResource\Pages;

use App\Filament\Resources\WatchVideoResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListWatchVideos extends ListRecords
{
    protected static string $resource = WatchVideoResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()];
    }
}
