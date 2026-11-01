<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AiPromptTemplateResource\Pages;
use App\Filament\Resources\Concerns\UsesResourcePermissions;
use App\Models\AiPromptTemplate;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

class AiPromptTemplateResource extends Resource
{
    use UsesResourcePermissions;

    protected static function permissions(): array
    {
        return ['view' => 'view_ai_studio', 'create' => 'manage_ai_prompts', 'edit' => 'manage_ai_prompts', 'delete' => 'manage_ai_prompts'];
    }

    protected static ?string $model = AiPromptTemplate::class;
    protected static ?string $navigationIcon = 'heroicon-o-document-text';
    protected static ?string $navigationGroup = 'AI Studio';
    protected static ?string $navigationLabel = 'Prompt Templates';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')->required()->maxLength(150),
            Forms\Components\TextInput::make('slug')->required()->alphaDash()->maxLength(180)->unique(ignoreRecord: true),
            Forms\Components\Textarea::make('prompt')->required()->minLength(10)->maxLength(50000)->rows(10)->columnSpanFull(),
            Forms\Components\Textarea::make('instructions')->maxLength(10000)->rows(5)->columnSpanFull(),
            Forms\Components\TextInput::make('version')->disabled()->dehydrated(false),
            Forms\Components\Toggle::make('is_active')->default(true),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
            Tables\Columns\TextColumn::make('slug')->searchable(),
            Tables\Columns\TextColumn::make('version')->sortable(),
            Tables\Columns\IconColumn::make('is_active')->boolean(),
            Tables\Columns\TextColumn::make('updated_at')->dateTime()->sortable(),
        ])->actions([
            Tables\Actions\EditAction::make(),
        ])->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAiPromptTemplates::route('/'),
            'create' => Pages\CreateAiPromptTemplate::route('/create'),
            'edit' => Pages\EditAiPromptTemplate::route('/{record}/edit'),
        ];
    }

    public static function canDelete(Model $record): bool { return false; }
    public static function canDeleteAny(): bool { return false; }
}
