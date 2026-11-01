<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MediaResource\Pages;
use App\Filament\Resources\Concerns\UsesResourcePermissions;
use App\Models\Media;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class MediaResource extends Resource
{
    use UsesResourcePermissions;

    protected static function permissions(): array
    {
        return ['view' => 'manage_media', 'create' => 'manage_media', 'edit' => 'manage_media', 'delete' => 'manage_media'];
    }

    protected static ?string $model = Media::class;
    protected static ?string $navigationIcon = 'heroicon-o-photo';
    protected static ?string $navigationGroup = 'Media';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')->required(),
            \App\Support\RasterUpload::field('path', 'general')->required(),
            Forms\Components\TextInput::make('alt_text'),
            Forms\Components\Placeholder::make('ai_provenance')->label('Image provenance')->content(fn (?Media $record) =>
                ($record?->metadata['ai_generated'] ?? false)
                    ? ($record->metadata['disclosure'].' Style: '.$record->metadata['style'].'. Aspect ratio: '.$record->metadata['aspect_ratio'].'. Provider: '.$record->metadata['provider'])
                    : 'No AI-generation metadata.'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('name')->searchable(),
            Tables\Columns\TextColumn::make('mime_type'),
            Tables\Columns\TextColumn::make('size')->numeric(),
            Tables\Columns\TextColumn::make('created_at')->dateTime(),
        ])->actions([Tables\Actions\EditAction::make()])
          ->bulkActions([Tables\Actions\DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'=>Pages\ListMedia::route('/'),
            'create'=>Pages\CreateMedia::route('/create'),
            'edit'=>Pages\EditMedia::route('/{record}/edit'),
        ];
    }
}
