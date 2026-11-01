<?php

namespace App\Filament\Resources\BlogPostResource\Pages;

use App\Filament\Resources\BlogPostResource;
use Filament\Resources\Pages\EditRecord;

class EditBlogPost extends EditRecord
{
    use \App\Filament\Resources\Concerns\HasEditorialAssistant;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        return $this->editorialDraftData(BlogPostResource::authoringData($data, false));
    }

    protected static string $resource = BlogPostResource::class;
}
