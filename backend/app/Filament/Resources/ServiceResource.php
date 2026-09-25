<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ServiceResource\Pages;
use App\Models\Service;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ServiceResource extends Resource
{
    protected static ?string $model = Service::class;
    protected static ?string $navigationIcon = 'heroicon-o-wrench-screwdriver';
    protected static ?string $navigationGroup = 'Content';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')->required(),
            Forms\Components\TextInput::make('slug')->required()->unique(ignoreRecord: true),
            Forms\Components\Textarea::make('short_description')->rows(3)->columnSpanFull(),
            Forms\Components\RichEditor::make('description')->columnSpanFull(),
            Forms\Components\TextInput::make('icon'),
            Forms\Components\Select::make('status')->options(['draft'=>'Draft','published'=>'Published'])->required(),
            Forms\Components\Toggle::make('featured'),
            Forms\Components\TextInput::make('sort_order')->numeric()->default(0),
            Forms\Components\TextInput::make('seo_title'),
            Forms\Components\Textarea::make('seo_description')->rows(3),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\IconColumn::make('featured')->boolean(),
            Tables\Columns\TextColumn::make('sort_order')->sortable(),
        ])->actions([
            Tables\Actions\EditAction::make(),
        ])->bulkActions([
            Tables\Actions\DeleteBulkAction::make(),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index'=>Pages\ListServices::route('/'),
            'create'=>Pages\CreateService::route('/create'),
            'edit'=>Pages\EditService::route('/{record}/edit'),
        ];
    }
}
