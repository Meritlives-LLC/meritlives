<?php

namespace App\Filament\Resources;

use App\Filament\Resources\NewsResource\Pages;
use App\Models\News;
use App\Models\Category;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class NewsResource extends Resource
{
    protected static ?string $model = News::class;
    protected static ?string $navigationIcon = 'heroicon-o-newspaper';
    protected static ?string $navigationGroup = 'Content';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('title')->required(),
            Forms\Components\TextInput::make('slug')->required()->unique(ignoreRecord: true),
            Forms\Components\Select::make('category_id')
                ->relationship('category','name')->searchable()->preload(),
            Forms\Components\Textarea::make('excerpt')->rows(4)->columnSpanFull(),
            Forms\Components\RichEditor::make('content')->columnSpanFull(),
            Forms\Components\TextInput::make('source_name')->required(),
            Forms\Components\TextInput::make('source_url')->url()->required(),
            Forms\Components\TextInput::make('image_url')->url(),
            Forms\Components\DateTimePicker::make('published_at'),
            Forms\Components\TextInput::make('external_id'),
            Forms\Components\Select::make('status')->options([
                'pending'=>'Pending','published'=>'Published','archived'=>'Archived',
            ])->required(),
            Forms\Components\Toggle::make('featured'),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('title')->searchable()->limit(50),
            Tables\Columns\TextColumn::make('source_name')->searchable(),
            Tables\Columns\TextColumn::make('category.name')->sortable(),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\TextColumn::make('published_at')->dateTime()->sortable(),
        ])->filters([
            Tables\Filters\SelectFilter::make('status')->options([
                'pending'=>'Pending','published'=>'Published','archived'=>'Archived',
            ]),
            Tables\Filters\SelectFilter::make('category_id')->relationship('category','name'),
        ])->actions([
            Tables\Actions\EditAction::make(),
        ])->bulkActions([
            Tables\Actions\DeleteBulkAction::make(),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index'=>Pages\ListNews::route('/'),
            'create'=>Pages\CreateNews::route('/create'),
            'edit'=>Pages\EditNews::route('/{record}/edit'),
        ];
    }
}
