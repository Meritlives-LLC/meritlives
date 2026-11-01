<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Concerns\UsesResourcePermissions;
use App\Filament\Resources\NewsSourceResource\Pages;
use App\Models\NewsSource;
use App\Services\NewsDiscovery\NewsDiscoveryException;
use App\Services\NewsDiscovery\NewsDiscoveryManager;
use App\Services\NewsDiscovery\NewsDiscoveryUrlPolicy;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

class NewsSourceResource extends Resource
{
    use UsesResourcePermissions;

    protected static function permissions(): array { return ['view' => 'manage_news_sources', 'create' => 'manage_news_sources', 'edit' => 'manage_news_sources', 'delete' => 'manage_news_sources']; }
    protected static ?string $model = NewsSource::class;
    protected static ?string $navigationIcon = 'heroicon-o-rss';
    protected static ?string $navigationGroup = 'AI Studio';
    protected static ?string $navigationLabel = 'External News Sources';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')->required()->maxLength(150),
            Forms\Components\Select::make('type')->options(['rss' => 'RSS feed'])->default('rss')->required()->disabled()->dehydrated(),
            Forms\Components\TextInput::make('feed_url')->label('HTTPS feed URL')->url()->required()->maxLength(2000)
                ->helperText('The hostname must appear exactly in NEWS_DISCOVERY_ALLOWED_HOSTS. Redirects are not followed.')
                ->rules([function () { return function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! is_string($value) || ! app(NewsDiscoveryUrlPolicy::class)->feedUrlIsAllowed($value)) {
                        $fail('Use an HTTPS feed URL on a hostname in the configured allowlist.');
                    }
                }; }]),
            Forms\Components\Select::make('categories')->label('Editorial categories')->multiple()
                ->relationship('categories', 'name', modifyQueryUsing: fn ($query) => $query->where('type', 'news')->where('status', 'active'))
                ->preload()->required(),
            Forms\Components\Toggle::make('enabled')->default(false)->helperText('Disabled until explicitly enabled; fetching still requires an approved host.'),
            Forms\Components\Placeholder::make('fetch_state')->label('Fetch state')->content(fn (?NewsSource $record) => $record
                ? 'Last attempt: '.($record->last_fetched_at?->toDateTimeString() ?? 'never').' · Last success: '.($record->last_successful_fetch_at?->toDateTimeString() ?? 'never').' · '.($record->last_error ?: 'No current error')
                : 'Sources are fetched only by an explicit refresh or the configured discovery schedule.'),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
            Tables\Columns\TextColumn::make('type')->badge(),
            Tables\Columns\TextColumn::make('categories.name')->label('Categories')->listWithLineBreaks(),
            Tables\Columns\IconColumn::make('enabled')->boolean(),
            Tables\Columns\TextColumn::make('last_successful_fetch_at')->dateTime()->sortable(),
            Tables\Columns\TextColumn::make('last_error')->limit(60)->placeholder('—'),
        ])->actions([
            Tables\Actions\Action::make('refresh')->label('Refresh now')->icon('heroicon-o-arrow-path')->requiresConfirmation()
                ->visible(fn (NewsSource $record) => auth()->user()?->can('refresh_news_sources'))
                ->action(function (NewsSource $record): void {
                    try {
                        $count = app(NewsDiscoveryManager::class)->refresh($record, (int) auth()->id());
                        Notification::make()->title("Refresh complete: {$count} new item(s). Existing items were deduplicated.")->success()->send();
                    } catch (NewsDiscoveryException $exception) {
                        Notification::make()->title($exception->getMessage())->danger()->send();
                    }
                }),
            Tables\Actions\EditAction::make(),
        ])->defaultSort('name');
    }

    public static function canEdit(Model $record): bool { return static::canCreate(); }
    public static function canDelete(Model $record): bool { return auth()->user()?->can('manage_news_sources') ?? false; }
    public static function getPages(): array { return ['index' => Pages\ListNewsSources::route('/'), 'create' => Pages\CreateNewsSource::route('/create'), 'edit' => Pages\EditNewsSource::route('/{record}/edit')]; }
}
