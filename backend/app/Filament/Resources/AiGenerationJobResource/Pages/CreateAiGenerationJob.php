<?php

namespace App\Filament\Resources\AiGenerationJobResource\Pages;

use App\Filament\Resources\AiGenerationJobResource;
use App\Models\AiGenerationJob;
use App\Services\AiStudio\AiStudioManager;
use App\Services\AiStudio\AiStudioException;
use Filament\Notifications\Notification;
use Filament\Support\Exceptions\Halt;
use Illuminate\Database\Eloquent\Model;
use Filament\Resources\Pages\CreateRecord;

class CreateAiGenerationJob extends CreateRecord
{
    protected static string $resource = AiGenerationJobResource::class;

    protected function handleRecordCreation(array $data): Model
    {
        try {
            return app(AiStudioManager::class)->createJob((int) auth()->id(), $data);
        } catch (AiStudioException $exception) {
            Notification::make()->title($exception->getMessage())->danger()->send();
            throw (new Halt())->rollBackDatabaseTransaction();
        }
    }
}
