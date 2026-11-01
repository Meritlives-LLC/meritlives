<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AiGenerationJobResource\Pages;
use App\Filament\Resources\Concerns\UsesResourcePermissions;
use App\Models\AiGenerationJob;
use App\Models\AiPromptTemplate;
use App\Models\BlogPost;
use App\Services\AiStudio\AiStudioException;
use App\Services\AiStudio\AiStudioManager;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\HtmlString;

class AiGenerationJobResource extends Resource
{
    use UsesResourcePermissions;

    protected static function permissions(): array
    {
        return ['view' => 'view_ai_studio', 'create' => 'create_ai_generations'];
    }

    protected static ?string $model = AiGenerationJob::class;
    protected static ?string $navigationIcon = 'heroicon-o-sparkles';
    protected static ?string $navigationGroup = 'AI Studio';
    protected static ?string $navigationLabel = 'Generation Jobs';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Select::make('type')->options([
                AiGenerationJob::TYPE_ARTICLE => 'Article',
                AiGenerationJob::TYPE_IMAGE => 'Image',
            ])->required()->default(AiGenerationJob::TYPE_ARTICLE)->live(),
            Forms\Components\Select::make('prompt_template_id')
                ->label('Prompt template')
                ->options(fn () => AiPromptTemplate::query()->where('is_active', true)->orderBy('name')->pluck('name', 'id'))
                ->searchable()->nullable()->rules(['nullable', 'exists:ai_prompt_templates,id'])->live()
                ->afterStateUpdated(function (Forms\Set $set, mixed $state): void {
                    $template = $state ? AiPromptTemplate::find($state) : null;
                    if ($template) {
                        $set('prompt', $template->prompt);
                        $set('instructions', $template->instructions);
                        $set('prompt_template_version', $template->version);
                    }
                }),
            Forms\Components\Hidden::make('prompt_template_version'),
            Forms\Components\Textarea::make('prompt')->required()->minLength(10)->maxLength(50000)->rows(8)->columnSpanFull(),
            Forms\Components\Textarea::make('instructions')->maxLength(10000)->rows(4)->columnSpanFull(),
            Forms\Components\Placeholder::make('provider_state')->label('Provider')->content(fn () => config('ai_studio.enabled') && config('ai_studio.provider', 'none') !== 'none'
                ? 'Enabled in configuration; provider availability depends on server setup.'
                : 'Unavailable. AI_STUDIO_ENABLED defaults to false, and no AI provider is currently implemented.'),
            Forms\Components\Placeholder::make('current_status')->label('Status')->content(fn (?AiGenerationJob $record) => $record?->status ?? 'Draft'),
            Forms\Components\TextInput::make('result_title')->disabled()->dehydrated(false),
            Forms\Components\TextInput::make('result_slug')->disabled()->dehydrated(false),
            Forms\Components\Textarea::make('result_excerpt')->disabled()->dehydrated(false)->rows(3)->columnSpanFull(),
            Forms\Components\Textarea::make('result_body')->disabled()->dehydrated(false)->rows(12)->columnSpanFull(),
            Forms\Components\Textarea::make('result_metadata')->label('Structured SEO and verification metadata')->disabled()->dehydrated(false)
                ->formatStateUsing(fn (?AiGenerationJob $record) => json_encode($record?->result_metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: 'No structured metadata is available.')
                ->rows(8)->columnSpanFull(),
            Forms\Components\Textarea::make('failure_message')->disabled()->dehydrated(false)->columnSpanFull(),
            Forms\Components\Textarea::make('review_notes')->disabled()->dehydrated(false)->columnSpanFull(),
            Forms\Components\Placeholder::make('image_preview')->label('Image preview')
                ->content(fn (?AiGenerationJob $record) => $record?->preview_path
                    ? new HtmlString('<a target="_blank" rel="noopener noreferrer" href="'.e(route('ai-studio.preview', $record)).'">Open protected image preview</a>')
                    : 'No image preview is available.'),
            Forms\Components\Placeholder::make('audit_history')->label('Audit history')
                ->content(fn (?AiGenerationJob $record) => new HtmlString('<pre class="whitespace-pre-wrap text-xs">'.e($record?->auditEvents->map(fn ($event) => $event->created_at?->toDateTimeString().' — '.$event->event.' ('.($event->from_status ?? '—').' → '.($event->to_status ?? '—').')')->implode("\n") ?? 'No audit events.').'</pre>'))
                ->columnSpanFull(),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('id')->sortable(),
            Tables\Columns\TextColumn::make('type')->badge(),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\TextColumn::make('result_title')->limit(48)->placeholder('No preview yet'),
            Tables\Columns\TextColumn::make('requester.name')->label('Requested by'),
            Tables\Columns\TextColumn::make('provider')->placeholder('—'),
            Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
        ])->actions([
            Tables\Actions\ViewAction::make(),
            Tables\Actions\Action::make('generate')
                ->label('Generate preview')->icon('heroicon-o-sparkles')->color('primary')
                ->visible(fn (AiGenerationJob $record) => auth()->user()?->can('create_ai_generations') && in_array($record->status, [AiGenerationJob::STATUS_DRAFT, AiGenerationJob::STATUS_FAILED], true))
                ->requiresConfirmation()
                ->action(function (AiGenerationJob $record): void {
                    try {
                        $job = app(AiStudioManager::class)->generate($record, (int) auth()->id());
                        if ($job->status === AiGenerationJob::STATUS_FAILED) {
                            Notification::make()->title($job->failure_message ?: 'Generation failed.')->danger()->send();
                            return;
                        }
                        Notification::make()->title('Preview created and is awaiting review.')->success()->send();
                    } catch (AiStudioException $exception) {
                        Notification::make()->title($exception->getMessage())->danger()->send();
                    }
                }),
            Tables\Actions\Action::make('preview_image')
                ->label('Preview image')->icon('heroicon-o-eye')->url(fn (AiGenerationJob $record) => route('ai-studio.preview', $record))->openUrlInNewTab()
                ->visible(fn (AiGenerationJob $record) => $record->type === AiGenerationJob::TYPE_IMAGE && filled($record->preview_path) && auth()->user()?->can('view_ai_studio')),
            Tables\Actions\Action::make('approve')
                ->label('Approve')->color('success')->icon('heroicon-o-check')
                ->visible(fn (AiGenerationJob $record) => $record->status === AiGenerationJob::STATUS_AWAITING_REVIEW && auth()->user()?->can('review_ai_generations'))
                ->form([Forms\Components\Textarea::make('review_notes')->maxLength(5000)])
                ->action(fn (AiGenerationJob $record, array $data) => self::reviewJob($record, true, $data['review_notes'] ?? null)),
            Tables\Actions\Action::make('reject')
                ->label('Reject')->color('danger')->icon('heroicon-o-x-mark')
                ->visible(fn (AiGenerationJob $record) => $record->status === AiGenerationJob::STATUS_AWAITING_REVIEW && auth()->user()?->can('review_ai_generations'))
                ->form([Forms\Components\Textarea::make('review_notes')->required()->maxLength(5000)])
                ->action(fn (AiGenerationJob $record, array $data) => self::reviewJob($record, false, $data['review_notes'])),
            Tables\Actions\Action::make('create_blog_draft')
                ->label('Create Blog draft')->icon('heroicon-o-document-plus')
                ->visible(fn (AiGenerationJob $record) => $record->type === AiGenerationJob::TYPE_ARTICLE && $record->status === AiGenerationJob::STATUS_APPROVED && ! $record->associated_id && auth()->user()?->can('create_blog'))
                ->requiresConfirmation()
                ->action(function (AiGenerationJob $record): void {
                    try {
                        $post = app(AiStudioManager::class)->createBlogDraft($record, (int) auth()->id());
                        Notification::make()->title('Draft created. It remains unpublished.')->success()->send();
                    } catch (AiStudioException $exception) {
                        Notification::make()->title($exception->getMessage())->danger()->send();
                    }
                }),
            Tables\Actions\Action::make('attach_image')
                ->label('Attach to Blog post')->icon('heroicon-o-link')
                ->visible(fn (AiGenerationJob $record) => $record->type === AiGenerationJob::TYPE_IMAGE && $record->status === AiGenerationJob::STATUS_APPROVED && filled($record->approved_image_path) && auth()->user()?->can('manage_media') && auth()->user()?->can('edit_blog'))
                ->form([Forms\Components\Select::make('blog_post_id')->label('Blog post')->options(fn () => BlogPost::query()->orderByDesc('updated_at')->limit(200)->pluck('title', 'id'))->searchable()->required()])
                ->action(function (AiGenerationJob $record, array $data): void {
                    try {
                        app(AiStudioManager::class)->attachImageToBlogPost($record, BlogPost::findOrFail($data['blog_post_id']), (int) auth()->id());
                        Notification::make()->title('Approved image attached to the selected Blog post.')->success()->send();
                    } catch (AiStudioException $exception) {
                        Notification::make()->title($exception->getMessage())->danger()->send();
                    }
                }),
        ]);
    }

    private static function reviewJob(AiGenerationJob $record, bool $approve, ?string $notes): void
    {
        try {
            app(AiStudioManager::class)->review($record, (int) auth()->id(), $approve, $notes);
            Notification::make()->title($approve ? 'Generation approved.' : 'Generation rejected.')->success()->send();
        } catch (AiStudioException $exception) {
            Notification::make()->title($exception->getMessage())->danger()->send();
        }
    }

    public static function canEdit(Model $record): bool { return false; }
    public static function canDelete(Model $record): bool { return false; }
    public static function canDeleteAny(): bool { return false; }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAiGenerationJobs::route('/'),
            'create' => Pages\CreateAiGenerationJob::route('/create'),
            'view' => Pages\ViewAiGenerationJob::route('/{record}'),
        ];
    }
}
