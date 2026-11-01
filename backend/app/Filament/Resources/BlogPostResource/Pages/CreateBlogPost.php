<?php

namespace App\Filament\Resources\BlogPostResource\Pages;

use App\Filament\Resources\BlogPostResource;
use Filament\Resources\Pages\CreateRecord;

class CreateBlogPost extends CreateRecord
{
    use \App\Filament\Resources\Concerns\HasEditorialAssistant;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        return $this->editorialDraftData(BlogPostResource::authoringData($data, true));
    }

    protected static string $resource = BlogPostResource::class;
}
