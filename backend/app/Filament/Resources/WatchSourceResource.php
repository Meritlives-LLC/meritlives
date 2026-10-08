<?php

namespace App\Filament\Resources;

use App\Filament\Resources\WatchSourceResource\Pages;
use App\Models\WatchSource;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class WatchSourceResource extends Resource
{
    protected static ?string $model = WatchSource::class;

    protected static ?string $navigationIcon = 'heroicon-o-video-camera';

    protected static ?string $navigationGroup = 'Watch';

    protected static ?string $navigationLabel = 'Watch Sources';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')->required()->maxLength(255),
            Forms\Components\Select::make('platform')
                ->options([WatchSource::PLATFORM_YOUTUBE => 'YouTube'])
                ->default(WatchSource::PLATFORM_YOUTUBE)
                ->required(),
            Forms\Components\TextInput::make('platform_channel_id')->required()->unique(ignoreRecord: true)->maxLength(255)
                ->helperText('Use the channel ID, not only the channel display name.'),
            Forms\Components\Select::make('category')->options(WatchSource::CATEGORIES)->required(),
            Forms\Components\Textarea::make('description')->rows(3)->columnSpanFull(),
            Forms\Components\Toggle::make('is_active')->default(false),
            Forms\Components\Select::make('priority')->options([
                1 => '1 — High',
                2 => '2 — Normal',
                3 => '3 — Low',
            ])->default(2)->required(),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
            Tables\Columns\TextColumn::make('platform_channel_id')->label('Channel ID')->searchable(),
            Tables\Columns\TextColumn::make('category')->badge(),
            Tables\Columns\IconColumn::make('is_active')->boolean(),
            Tables\Columns\TextColumn::make('priority')->sortable(),
        ])->filters([
            Tables\Filters\TernaryFilter::make('is_active'),
            Tables\Filters\SelectFilter::make('category')->options(WatchSource::CATEGORIES),
        ])->actions([
            Tables\Actions\EditAction::make(),
        ])->bulkActions([
            Tables\Actions\DeleteBulkAction::make(),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListWatchSources::route('/'),
            'create' => Pages\CreateWatchSource::route('/create'),
            'edit' => Pages\EditWatchSource::route('/{record}/edit'),
        ];
    }
}
