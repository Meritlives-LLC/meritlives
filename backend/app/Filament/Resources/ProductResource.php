<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductResource\Pages;
use App\Models\Product;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;
    protected static ?string $navigationIcon = 'heroicon-o-cube';
    protected static ?string $navigationGroup = 'Content';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')->required()->maxLength(255)->live(onBlur: true),
            Forms\Components\TextInput::make('slug')->required()->unique(ignoreRecord: true)->maxLength(255),
            Forms\Components\Textarea::make('short_description')->rows(3)->columnSpanFull(),
            Forms\Components\RichEditor::make('description')->columnSpanFull(),
            Forms\Components\FileUpload::make('logo')->image()->directory('products'),
            Forms\Components\FileUpload::make('cover_image')->image()->directory('products'),
            Forms\Components\TextInput::make('website_url')->url(),
            Forms\Components\TextInput::make('cta_text')->default('Learn More'),
            Forms\Components\Select::make('status')
                ->options(['draft'=>'Draft','published'=>'Published'])
                ->required()->default('draft'),
            Forms\Components\Toggle::make('featured'),
            Forms\Components\TextInput::make('sort_order')->numeric()->default(0),
            Forms\Components\TextInput::make('seo_title')->maxLength(255),
            Forms\Components\Textarea::make('seo_description')->rows(3),
            Forms\Components\Repeater::make('features')
                ->relationship()
                ->schema([
                    Forms\Components\TextInput::make('name')->required(),
                    Forms\Components\Textarea::make('description')->rows(2),
                    Forms\Components\TextInput::make('sort_order')->numeric()->default(0),
                ])
                ->columns(2)
                ->columnSpanFull(),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\IconColumn::make('featured')->boolean(),
            Tables\Columns\TextColumn::make('sort_order')->sortable(),
            Tables\Columns\TextColumn::make('updated_at')->dateTime()->sortable(),
        ])->filters([
            Tables\Filters\SelectFilter::make('status')->options([
                'draft'=>'Draft','published'=>'Published',
            ]),
            Tables\Filters\TernaryFilter::make('featured'),
        ])->actions([
            Tables\Actions\EditAction::make(),
        ])->bulkActions([
            Tables\Actions\DeleteBulkAction::make(),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListProducts::route('/'),
            'create' => Pages\CreateProduct::route('/create'),
            'edit' => Pages\EditProduct::route('/{record}/edit'),
        ];
    }
}
