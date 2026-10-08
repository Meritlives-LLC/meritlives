<?php

namespace App\Filament\Resources;

use App\Filament\Resources\WatchVideoResource\Pages;
use App\Models\WatchSource;
use App\Models\WatchVideo;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class WatchVideoResource extends Resource
{
    protected static ?string $model = WatchVideo::class;

    protected static ?string $navigationIcon = 'heroicon-o-play-circle';

    protected static ?string $navigationGroup = 'Watch';

    protected static ?string $navigationLabel = 'Watch Videos';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Select::make('watch_source_id')
                ->relationship('source', 'name')
                ->searchable()
                ->preload()
                ->required(),
            Forms\Components\TextInput::make('youtube_video_id')
                ->label('YouTube video ID')
                ->required()
                ->unique(ignoreRecord: true)
                ->length(11)
                ->regex('/^[A-Za-z0-9_-]{11}$/'),
            Forms\Components\TextInput::make('title')->required()->maxLength(255),
            Forms\Components\TextInput::make('slug')->required()->unique(ignoreRecord: true)->maxLength(255),
            Forms\Components\Textarea::make('description')->rows(4)->columnSpanFull(),
            Forms\Components\TextInput::make('thumbnail_url')->required()->url()->maxLength(2048),
            Forms\Components\TextInput::make('video_url')
                ->label('YouTube video URL')
                ->required()
                ->url()
                ->maxLength(2048)
                ->regex('~^https://(www\\.)?(youtube\\.com/watch\\?v=|youtu\\.be/)[A-Za-z0-9_-]{11}(?:[&?].*)?$~'),
            Forms\Components\Select::make('category')->options(WatchSource::CATEGORIES)->required(),
            Forms\Components\DateTimePicker::make('published_at'),
            Forms\Components\TextInput::make('duration')->maxLength(32)
                ->helperText('Optional ISO 8601 duration, for example PT12M30S.'),
            Forms\Components\TextInput::make('relevance_score')->numeric()->minValue(0)->maxValue(100)->default(0),
            Forms\Components\TextInput::make('quality_score')->numeric()->minValue(0)->maxValue(100)->default(0),
            Forms\Components\Select::make('status')->options([
                WatchVideo::STATUS_ACTIVE => 'Active',
                WatchVideo::STATUS_INACTIVE => 'Inactive',
            ])->default(WatchVideo::STATUS_INACTIVE)->required(),
            Forms\Components\Toggle::make('is_featured'),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('title')->searchable()->limit(55),
            Tables\Columns\TextColumn::make('source.name')->label('Source')->sortable(),
            Tables\Columns\TextColumn::make('category')->badge(),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\IconColumn::make('is_featured')->boolean(),
            Tables\Columns\TextColumn::make('published_at')->dateTime()->sortable(),
        ])->filters([
            Tables\Filters\SelectFilter::make('status')->options([
                WatchVideo::STATUS_ACTIVE => 'Active',
                WatchVideo::STATUS_INACTIVE => 'Inactive',
            ]),
            Tables\Filters\SelectFilter::make('category')->options(WatchSource::CATEGORIES),
            Tables\Filters\TernaryFilter::make('is_featured'),
        ])->actions([
            Tables\Actions\EditAction::make(),
        ])->bulkActions([
            Tables\Actions\DeleteBulkAction::make(),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListWatchVideos::route('/'),
            'create' => Pages\CreateWatchVideo::route('/create'),
            'edit' => Pages\EditWatchVideo::route('/{record}/edit'),
        ];
    }
}
