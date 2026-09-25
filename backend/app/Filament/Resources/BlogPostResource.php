<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BlogPostResource\Pages;
use App\Models\BlogPost;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class BlogPostResource extends Resource
{
    protected static ?string $model = BlogPost::class;
    protected static ?string $navigationIcon = 'heroicon-o-document-text';
    protected static ?string $navigationGroup = 'Content';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('title')->required(),
            Forms\Components\TextInput::make('slug')->required()->unique(ignoreRecord: true),
            Forms\Components\Select::make('category_id')->relationship('category','name')->searchable()->preload(),
            Forms\Components\Textarea::make('excerpt')->rows(4)->columnSpanFull(),
            Forms\Components\RichEditor::make('content')->required()->columnSpanFull(),
            Forms\Components\FileUpload::make('featured_image')->image()->directory('blogs'),
            Forms\Components\Select::make('status')->options([
                'draft'=>'Draft','published'=>'Published',
            ])->required(),
            Forms\Components\DateTimePicker::make('published_at'),
            Forms\Components\Select::make('tags')->multiple()->relationship('tags','name')->preload()->searchable(),
            Forms\Components\Toggle::make('featured'),
            Forms\Components\TextInput::make('seo_title'),
            Forms\Components\Textarea::make('seo_description')->rows(3),
            Forms\Components\TextInput::make('canonical_url')->url(),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('title')->searchable()->limit(60),
            Tables\Columns\TextColumn::make('author.name')->label('Author'),
            Tables\Columns\TextColumn::make('category.name')->label('Category'),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\TextColumn::make('published_at')->dateTime()->sortable(),
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
            'index'=>Pages\ListBlogPosts::route('/'),
            'create'=>Pages\CreateBlogPost::route('/create'),
            'edit'=>Pages\EditBlogPost::route('/{record}/edit'),
        ];
    }
}
