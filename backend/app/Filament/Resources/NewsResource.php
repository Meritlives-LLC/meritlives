<?php

namespace App\Filament\Resources;

use App\Filament\Resources\NewsResource\Pages;
use App\Models\News;
use App\Models\Category;
use App\Services\EditorialWorkflow;
use App\Services\NewsArticleGenerator;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;
use Throwable;

class NewsResource extends Resource
{
    protected static ?string $model = News::class;
    protected static ?string $navigationIcon = 'heroicon-o-newspaper';
    protected static ?string $navigationGroup = 'Content';

    public static function canViewAny(): bool
    {
        return (bool) auth()->user()?->can('view_news');
    }

    public static function canCreate(): bool
    {
        return (bool) auth()->user()?->can('create_news');
    }

    public static function canEdit(Model $record): bool
    {
        return (bool) auth()->user()?->can('edit_news');
    }

    public static function canDelete(Model $record): bool
    {
        return (bool) auth()->user()?->can('delete_news');
    }

    public static function canDeleteAny(): bool
    {
        return (bool) auth()->user()?->can('delete_news');
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('title')->required(),
            Forms\Components\TextInput::make('slug')->required()->unique(ignoreRecord: true),
            Forms\Components\Select::make('category_id')
                ->label('Editorial Category')
                ->options(function (?News $record): array {
                    $approved = Category::query()
                        ->whereIn('name', ['Technology', 'Business', 'Digital Innovation'])
                        ->orderBy('name')->pluck('name', 'id')->all();
                    if ($record?->category_id && ! isset($approved[$record->category_id])) {
                        $legacy = Category::find($record->category_id);
                        if ($legacy) $approved[$record->category_id] = '[Existing] '.$legacy->name;
                    }
                    return $approved;
                })->searchable(),
            Forms\Components\Textarea::make('excerpt')->rows(4)->columnSpanFull(),
            Forms\Components\RichEditor::make('content')->columnSpanFull(),
            Forms\Components\TextInput::make('author_name')->maxLength(255),
            Forms\Components\TextInput::make('source_name')->required(),
            Forms\Components\TextInput::make('source_url')->url()->required(),
            Forms\Components\FileUpload::make('featured_image')->label('Featured Image')->image()->maxSize(5120)
                ->disk('public')->visibility('public')->directory('news-images'),
            Forms\Components\TextInput::make('image_url')->url(),
            Forms\Components\DateTimePicker::make('published_at'),
            Forms\Components\TextInput::make('external_id')->disabled()->dehydrated(),
            Forms\Components\Placeholder::make('status_display')->label('Publication status')
                ->content(fn (?News $record): string => $record?->status ?? 'pending'),
            Forms\Components\Placeholder::make('editorial_status_display')->label('Article approval')
                ->content(fn (?News $record): string => $record?->editorial_status ?? 'draft'),
            Forms\Components\Placeholder::make('image_status_display')->label('Image approval')
                ->content(fn (?News $record): string => $record?->image_review_status ?? 'pending'),
            Forms\Components\Toggle::make('featured'),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('title')->searchable()->limit(50),
            Tables\Columns\TextColumn::make('source_name')->searchable(),
            Tables\Columns\TextColumn::make('author_name')->label('Author')->searchable(),
            Tables\Columns\TextColumn::make('creator.name')->label('Created by')->placeholder('Imported / system')->toggleable(),
            Tables\Columns\TextColumn::make('category.name')->sortable(),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\TextColumn::make('editorial_status')->label('Article review')->badge(),
            Tables\Columns\TextColumn::make('image_review_status')->label('Image review')->badge(),
            Tables\Columns\TextColumn::make('published_at')->dateTime()->sortable(),
        ])->filters([
            Tables\Filters\SelectFilter::make('status')->options([
                'pending'=>'Pending','published'=>'Published','archived'=>'Archived',
            ]),
            Tables\Filters\SelectFilter::make('editorial_status')->options([
                'draft'=>'Draft','pending_review'=>'Pending review','approved'=>'Approved','needs_work'=>'Needs work',
            ]),
            Tables\Filters\SelectFilter::make('category_id')->relationship('category','name'),
        ])->actions([
            Tables\Actions\EditAction::make()->visible(fn (): bool => (bool) auth()->user()?->can('edit_news')),
            Tables\Actions\Action::make('editorialHistory')
                ->label('Editorial history')
                ->icon('heroicon-o-clock')
                ->modalHeading('Editorial history')
                ->modalSubmitAction(false)
                ->modalContent(fn (News $record) => view('filament.news-editorial-history', [
                    'events' => $record->editorialEvents()->with('user')->get(),
                ])),
            Tables\Actions\Action::make('generateArticleDraft')
                ->label('Generate article draft')->icon('heroicon-o-sparkles')
                ->form([
                    Forms\Components\Textarea::make('source_notes')
                        ->label('Verified source notes')
                        ->helperText('Paste factual details from the source or reporting notes. The generator will not invent missing facts.')
                        ->rows(8)->required()->maxLength(12000),
                ])
                ->visible(fn (): bool => (bool) auth()->user()?->can('edit_news'))
                ->requiresConfirmation()
                ->action(function (News $record, array $data): void {
                    try {
                        abort_unless(auth()->user()?->can('edit_news'), 403);
                        app(NewsArticleGenerator::class)->generate($record, (string) $data['source_notes'], (int) auth()->id());
                        Notification::make()->title('Article draft generated')
                            ->body('The draft remains unpublished and requires editorial approval.')->success()->send();
                    } catch (Throwable $e) {
                        Notification::make()->title('Article generation blocked')->body($e->getMessage())->danger()->send();
                    }
                }),
            Tables\Actions\Action::make('approveArticle')
                ->label('Approve article')->icon('heroicon-o-check-circle')->requiresConfirmation()
                ->visible(fn (News $record): bool => (bool) auth()->user()?->can('edit_news') && $record->editorial_status !== 'approved')
                ->action(function (News $record): void {
                    try {
                        abort_unless(auth()->user()?->can('edit_news'), 403);
                        app(EditorialWorkflow::class)->approveArticle($record, (int) auth()->id());
                        Notification::make()->title('Article approved')->success()->send();
                    } catch (Throwable $e) {
                        Notification::make()->title('Article not approved')->body($e->getMessage())->danger()->send();
                    }
                }),
            Tables\Actions\Action::make('approveImage')
                ->label('Approve image')->icon('heroicon-o-photo')->requiresConfirmation()
                ->visible(fn (News $record): bool => (bool) (auth()->user()?->can('manage_media') || auth()->user()?->can('edit_news')) && $record->image_review_status !== 'approved')
                ->action(function (News $record): void {
                    try {
                        abort_unless(auth()->user()?->can('manage_media') || auth()->user()?->can('edit_news'), 403);
                        app(EditorialWorkflow::class)->approveImage($record, (int) auth()->id());
                        Notification::make()->title('Image approved')->success()->send();
                    } catch (Throwable $e) {
                        Notification::make()->title('Image not approved')->body($e->getMessage())->danger()->send();
                    }
                }),
            Tables\Actions\Action::make('publish')
                ->label('Publish')->icon('heroicon-o-megaphone')->color('success')->requiresConfirmation()
                ->visible(fn (News $record): bool => (bool) auth()->user()?->can('edit_news') && $record->status !== 'published')
                ->action(function (News $record): void {
                    try {
                        abort_unless(auth()->user()?->can('edit_news'), 403);
                        app(EditorialWorkflow::class)->publish($record, (int) auth()->id());
                        Notification::make()->title('Article published')->success()->send();
                    } catch (Throwable $e) {
                        Notification::make()->title('Publishing blocked')->body($e->getMessage())->danger()->send();
                    }
                }),
            Tables\Actions\Action::make('returnForChanges')
                ->label('Return for changes')->icon('heroicon-o-arrow-uturn-left')
                ->visible(fn (): bool => (bool) auth()->user()?->can('edit_news'))
                ->form([Forms\Components\Textarea::make('notes')->required()->maxLength(2000)])
                ->action(function (News $record, array $data): void {
                    abort_unless(auth()->user()?->can('edit_news'), 403);
                    app(EditorialWorkflow::class)->returnForChanges($record, (int) auth()->id(), $data['notes']);
                    Notification::make()->title('Returned for changes')->warning()->send();
                }),
        ])->bulkActions([
            Tables\Actions\DeleteBulkAction::make()->visible(fn (): bool => (bool) auth()->user()?->can('delete_news')),
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
