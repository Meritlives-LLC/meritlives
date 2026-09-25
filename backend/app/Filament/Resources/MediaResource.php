<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MediaResource\Pages;
use App\Models\Media;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class MediaResource extends Resource
{
    protected static ?string $model = Media::class;
    protected static ?string $navigationIcon = 'heroicon-o-photo';
    protected static ?string $navigationGroup = 'Media';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')->required(),
            Forms\Components\FileUpload::make('path')->disk('public')->directory('general')->required(),
            Forms\Components\TextInput::make('alt_text'),
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
