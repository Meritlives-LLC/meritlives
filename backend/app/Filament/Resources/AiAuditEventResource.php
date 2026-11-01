<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AiAuditEventResource\Pages;
use App\Filament\Resources\Concerns\UsesResourcePermissions;
use App\Models\AiAuditEvent;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

class AiAuditEventResource extends Resource
{
    use UsesResourcePermissions;

    protected static function permissions(): array { return ['view' => 'view_ai_studio']; }

    protected static ?string $model = AiAuditEvent::class;
    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';
    protected static ?string $navigationGroup = 'AI Studio';
    protected static ?string $navigationLabel = 'Audit History';

    public static function form(Form $form): Form { return $form->schema([]); }

    public static function table(Table $table): Table
    {
        return $table->defaultSort('created_at', 'desc')->columns([
            Tables\Columns\TextColumn::make('id')->sortable(),
            Tables\Columns\TextColumn::make('job_id')->label('Job')->sortable(),
            Tables\Columns\TextColumn::make('event')->searchable()->badge(),
            Tables\Columns\TextColumn::make('from_status')->placeholder('—'),
            Tables\Columns\TextColumn::make('to_status')->placeholder('—'),
            Tables\Columns\TextColumn::make('actor.name')->label('Actor')->placeholder('Deleted user'),
            Tables\Columns\TextColumn::make('metadata')->label('Details')->formatStateUsing(fn ($state) => is_array($state) ? json_encode($state, JSON_UNESCAPED_SLASHES) : null)->wrap(),
            Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
        ])->actions([])->bulkActions([]);
    }

    public static function canCreate(): bool { return false; }
    public static function canEdit(Model $record): bool { return false; }
    public static function canDelete(Model $record): bool { return false; }
    public static function canDeleteAny(): bool { return false; }

    public static function getPages(): array
    {
        return ['index' => Pages\ListAiAuditEvents::route('/')];
    }
}
