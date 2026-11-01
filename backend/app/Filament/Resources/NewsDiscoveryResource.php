<?php

namespace App\Filament\Resources;

use App\Filament\Resources\Concerns\UsesResourcePermissions;
use App\Filament\Resources\NewsDiscoveryResource\Pages;
use App\Models\NewsDiscovery;
use App\Models\NewsSource;
use App\Services\NewsDiscovery\NewsDiscoveryException;
use App\Services\NewsDiscovery\NewsDiscoveryManager;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

class NewsDiscoveryResource extends Resource
{
    use UsesResourcePermissions;

    protected static function permissions(): array { return ['view' => 'view_news_discoveries']; }
    protected static ?string $model = NewsDiscovery::class;
    protected static ?string $navigationIcon = 'heroicon-o-magnifying-glass';
    protected static ?string $navigationGroup = 'AI Studio';
    protected static ?string $navigationLabel = 'News Discovery Queue';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('original_title')->label('Original headline')->disabled(),
            Forms\Components\TextInput::make('source_name')->disabled(),
            Forms\Components\TextInput::make('source_url')->label('Original source URL')->disabled()->columnSpanFull(),
            Forms\Components\Textarea::make('source_excerpt')->label('Permitted source excerpt')->disabled()->rows(5)->columnSpanFull(),
            Forms\Components\TextInput::make('source_published_at')->label('Source publication time')->disabled(),
            Forms\Components\TextInput::make('retrieved_at')->disabled(),
            Forms\Components\TextInput::make('matched_category_name')->label('Matched category')->disabled(),
            Forms\Components\TextInput::make('external_id')->disabled(),
            Forms\Components\TextInput::make('duplicate_of_id')->label('Duplicate discovery ID')->disabled(),
            Forms\Components\TextInput::make('duplicate_news_id')->label('Existing News ID')->disabled(),
            Forms\Components\TextInput::make('status')->disabled(),
            Forms\Components\TextInput::make('rewriteJob.result_title')->label('Proposed headline')->disabled()->columnSpanFull(),
            Forms\Components\Textarea::make('rewriteJob.result_excerpt')->label('Proposed lead')->disabled()->rows(3)->columnSpanFull(),
            Forms\Components\Textarea::make('rewriteJob.result_body')->label('Proposed body (sanitized HTML source; shown as text)')->disabled()->rows(10)->columnSpanFull(),
            Forms\Components\Textarea::make('rewrite_metadata')->label('SEO and verification flags')->disabled()->formatStateUsing(fn (?NewsDiscovery $record) => json_encode($record?->rewriteJob?->result_metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: 'No rewrite available.')->rows(8)->columnSpanFull(),
            Forms\Components\Textarea::make('review_notes')->disabled()->columnSpanFull(),
            Forms\Components\Textarea::make('audit_history')->label('Discovery audit history')->disabled()->formatStateUsing(fn (?NewsDiscovery $record) => $record?->events->map(fn ($event) => $event->created_at?->toDateTimeString().' · '.$event->event.' ('.($event->from_status ?? '—').' → '.($event->to_status ?? '—').')')->implode("\n") ?? 'No audit events.')->rows(8)->columnSpanFull(),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('original_title')->label('Original headline')->searchable()->limit(60),
            Tables\Columns\TextColumn::make('source_name')->searchable(),
            Tables\Columns\TextColumn::make('source_url')->label('Source link')->limit(40)->url(fn (NewsDiscovery $record) => $record->source_url)->openUrlInNewTab(),
            Tables\Columns\TextColumn::make('category.name')->label('Category')->placeholder('Unmatched'),
            Tables\Columns\TextColumn::make('source_published_at')->dateTime()->sortable(),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\TextColumn::make('source.name')->label('Configured source')->placeholder('Source removed'),
        ])->filters([
            Tables\Filters\SelectFilter::make('status')->options([
                NewsDiscovery::STATUS_DISCOVERED => 'Discovered', NewsDiscovery::STATUS_REWRITE_IN_PROGRESS => 'Rewrite in progress',
                NewsDiscovery::STATUS_REWRITE_READY => 'Rewrite ready for review', NewsDiscovery::STATUS_REJECTED => 'Rejected',
                NewsDiscovery::STATUS_APPROVED_FOR_DRAFT => 'Approved for draft', NewsDiscovery::STATUS_DRAFT_SAVED => 'Draft saved',
                NewsDiscovery::STATUS_PUBLISHED => 'Published', NewsDiscovery::STATUS_FAILED => 'Failed', NewsDiscovery::STATUS_DUPLICATE => 'Duplicate',
            ]),
            Tables\Filters\SelectFilter::make('category_id')->relationship('category', 'name'),
            Tables\Filters\SelectFilter::make('news_source_id')->label('Source')->options(fn () => NewsSource::query()->orderBy('name')->pluck('name', 'id')),
            Tables\Filters\Filter::make('source_publication_date')->form([
                Forms\Components\DatePicker::make('published_from'),
                Forms\Components\DatePicker::make('published_until'),
            ])->query(function ($query, array $data) {
                return $query->when($data['published_from'] ?? null, fn ($q, $date) => $q->whereDate('source_published_at', '>=', $date))
                    ->when($data['published_until'] ?? null, fn ($q, $date) => $q->whereDate('source_published_at', '<=', $date));
            }),
        ])->actions([
            Tables\Actions\ViewAction::make(),
            Tables\Actions\Action::make('rewrite')->label('Prepare AI rewrite')->icon('heroicon-o-sparkles')->requiresConfirmation()
                ->visible(fn (NewsDiscovery $record) => auth()->user()?->can('rewrite_news_discoveries') && in_array($record->status, [NewsDiscovery::STATUS_DISCOVERED, NewsDiscovery::STATUS_FAILED], true) && ! $record->duplicate_of_id && ! $record->duplicate_news_id)
                ->action(function (NewsDiscovery $record): void {
                    try {
                        $job = app(NewsDiscoveryManager::class)->requestRewrite($record, (int) auth()->id());
                        Notification::make()->title('Structured rewrite is ready for editorial review.')->body('AI job #'.$job->id)->success()->send();
                    } catch (\Throwable $exception) {
                        Notification::make()->title($exception instanceof NewsDiscoveryException ? $exception->getMessage() : 'The rewrite could not be requested.')->danger()->send();
                    }
                }),
            Tables\Actions\Action::make('approve_rewrite')->label('Review and approve')->icon('heroicon-o-check')->color('success')
                ->visible(fn (NewsDiscovery $record) => auth()->user()?->can('review_news_discoveries') && $record->status === NewsDiscovery::STATUS_REWRITE_READY)
                ->form([
                    Forms\Components\TextInput::make('headline')->required()->maxLength(200)->default(fn (NewsDiscovery $record) => $record->rewriteJob?->result_title),
                    Forms\Components\TextInput::make('slug')->required()->maxLength(180)->default(fn (NewsDiscovery $record) => $record->rewriteJob?->result_slug),
                    Forms\Components\Textarea::make('lead')->required()->maxLength(1000)->default(fn (NewsDiscovery $record) => $record->rewriteJob?->result_excerpt)->columnSpanFull(),
                    Forms\Components\Textarea::make('paragraphs')->label('Body paragraphs (one per line)')->required()->rows(8)->default(fn (NewsDiscovery $record) => implode("\n", self::paragraphs($record)))->columnSpanFull(),
                    Forms\Components\TextInput::make('seo_title')->required()->maxLength(70)->default(fn (NewsDiscovery $record) => data_get($record->rewriteJob?->result_metadata, 'seo_title')),
                    Forms\Components\TextInput::make('meta_description')->required()->maxLength(170)->default(fn (NewsDiscovery $record) => data_get($record->rewriteJob?->result_metadata, 'meta_description')),
                    Forms\Components\Textarea::make('verification_flags')->label('Verification flags (one per line)')->rows(4)->default(fn (NewsDiscovery $record) => implode("\n", data_get($record->rewriteJob?->result_metadata, 'verification_flags', [])))->columnSpanFull(),
                    Forms\Components\Textarea::make('review_notes')->maxLength(5000)->columnSpanFull(),
                ])->action(function (NewsDiscovery $record, array $data): void {
                    try {
                        $edits = [
                            ...$data,
                            'paragraphs' => preg_split('/\R/u', (string) ($data['paragraphs'] ?? ''), -1, PREG_SPLIT_NO_EMPTY) ?: [],
                            'verification_flags' => preg_split('/\R/u', (string) ($data['verification_flags'] ?? ''), -1, PREG_SPLIT_NO_EMPTY) ?: [],
                        ];
                        app(NewsDiscoveryManager::class)->reviewRewrite($record, (int) auth()->id(), true, $data['review_notes'] ?? null, $edits);
                        Notification::make()->title('Rewrite approved for draft creation; it remains unpublished.')->success()->send();
                    } catch (\Throwable $exception) {
                        Notification::make()->title($exception instanceof NewsDiscoveryException ? $exception->getMessage() : 'Review could not be saved.')->danger()->send();
                    }
                }),
            Tables\Actions\Action::make('reject_rewrite')->label('Reject rewrite')->icon('heroicon-o-x-mark')->color('danger')
                ->visible(fn (NewsDiscovery $record) => auth()->user()?->can('review_news_discoveries') && $record->status === NewsDiscovery::STATUS_REWRITE_READY)
                ->form([Forms\Components\Textarea::make('review_notes')->required()->maxLength(5000)])
                ->action(function (NewsDiscovery $record, array $data): void {
                    app(NewsDiscoveryManager::class)->reviewRewrite($record, (int) auth()->id(), false, $data['review_notes']);
                    Notification::make()->title('Rewrite rejected and retained in the audit history.')->success()->send();
                }),
            Tables\Actions\Action::make('save_news_draft')->label('Create pending News draft')->icon('heroicon-o-document-plus')
                ->visible(fn (NewsDiscovery $record) => auth()->user()?->can('create_news') && $record->status === NewsDiscovery::STATUS_APPROVED_FOR_DRAFT)
                ->requiresConfirmation()->action(fn (NewsDiscovery $record) => self::saveDraft($record, 'news')),
            Tables\Actions\Action::make('save_blog_draft')->label('Create Blog draft')->icon('heroicon-o-document-plus')
                ->visible(fn (NewsDiscovery $record) => auth()->user()?->can('create_blog') && $record->status === NewsDiscovery::STATUS_APPROVED_FOR_DRAFT)
                ->requiresConfirmation()->action(fn (NewsDiscovery $record) => self::saveDraft($record, 'blog')),
            Tables\Actions\Action::make('request_image')->label('Request image job')->icon('heroicon-o-photo')
                ->visible(fn (NewsDiscovery $record) => auth()->user()?->can('create_ai_generations') && in_array($record->status, [NewsDiscovery::STATUS_REWRITE_READY, NewsDiscovery::STATUS_APPROVED_FOR_DRAFT, NewsDiscovery::STATUS_DRAFT_SAVED], true) && ! $record->image_job_id)
                ->form([
                    Forms\Components\Textarea::make('prompt')->required()->minLength(10)->maxLength(50000)->rows(4),
                    Forms\Components\Textarea::make('instructions')->maxLength(10000)->rows(3),
                ])->action(function (NewsDiscovery $record, array $data): void {
                    try {
                        $job = app(NewsDiscoveryManager::class)->createImageJob($record, (int) auth()->id(), $data);
                        Notification::make()->title('Image job #'.$job->id.' created. Generate and review it in AI Studio.')->success()->send();
                    } catch (\Throwable $exception) {
                        Notification::make()->title($exception instanceof NewsDiscoveryException ? $exception->getMessage() : 'Image job could not be created.')->danger()->send();
                    }
                }),
            Tables\Actions\Action::make('attach_approved_image')->label('Attach approved image')->icon('heroicon-o-link')
                ->visible(fn (NewsDiscovery $record) => auth()->user()?->can('manage_media') && $record->status === NewsDiscovery::STATUS_DRAFT_SAVED && $record->imageJob?->status === 'approved')
                ->requiresConfirmation()->action(function (NewsDiscovery $record): void {
                    try {
                        app(NewsDiscoveryManager::class)->attachApprovedImage($record, (int) auth()->id());
                        Notification::make()->title('Approved image attached to the unpublished draft.')->success()->send();
                    } catch (\Throwable $exception) {
                        Notification::make()->title($exception instanceof NewsDiscoveryException ? $exception->getMessage() : 'Image could not be attached.')->danger()->send();
                    }
                }),
        ])->defaultSort('retrieved_at', 'desc');
    }

    private static function paragraphs(NewsDiscovery $record): array
    {
        preg_match_all('~<p>(.*?)</p>~s', (string) $record->rewriteJob?->result_body, $matches);
        return array_slice(array_map(static fn (string $text): string => html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8'), $matches[1] ?? []), 1);
    }

    private static function saveDraft(NewsDiscovery $record, string $type): void
    {
        try {
            $draft = app(NewsDiscoveryManager::class)->createDraft($record, (int) auth()->id(), $type);
            Notification::make()->title(($type === 'news' ? 'News item' : 'Blog post').' saved unpublished.')->body('Record #'.$draft->id)->success()->send();
        } catch (\Throwable $exception) {
            Notification::make()->title($exception instanceof NewsDiscoveryException ? $exception->getMessage() : 'Draft could not be created.')->danger()->send();
        }
    }

    public static function canEdit(Model $record): bool { return false; }
    public static function canDelete(Model $record): bool { return false; }
    public static function canDeleteAny(): bool { return false; }
    public static function getPages(): array { return ['index' => Pages\ListNewsDiscoveries::route('/'), 'view' => Pages\ViewNewsDiscovery::route('/{record}')]; }
}
