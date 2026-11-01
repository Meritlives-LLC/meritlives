<?php

namespace App\Filament\Resources\Concerns;

use App\Services\AiEditorial\EditorialAssistant;
use Filament\Actions\Action;
use Filament\Forms\Components\CheckboxList;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Illuminate\Support\Str;
use Livewire\Attributes\Locked;
use Illuminate\Validation\ValidationException;
use RuntimeException;

trait HasEditorialAssistant
{
    use HasFeatureImageAssistant;
    #[Locked]
    public ?string $editorialPreviewToken = null;

    #[Locked]
    public bool $editorialApplied = false;

    protected function editorialDraftData(array $data): array
    {
        if ($this->editorialApplied) {
            $data['status'] = $this->editorialType() === 'news' ? 'pending' : 'draft';
            $data['published_at'] = null;
            $data['featured'] = false;
            if ($this->editorialType() === 'blog') {
                $data['is_public_approved'] = false;
            }
        }
        return $data;
    }

    protected function editorialType(): string
    {
        return static::getResource() === \App\Filament\Resources\NewsResource::class ? 'news' : 'blog';
    }

    protected function editorialRecordId(): ?int
    {
        return isset($this->record) ? $this->record->getKey() : null;
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('aiAssist')->label('AI Assist')->icon('heroicon-o-sparkles')
                ->extraAttributes([
                    'data-editorial-trigger' => 'assist',
                    'x-data' => '{}',
                    'x-on:close-modal.window' => new \Illuminate\Support\HtmlString("if (\$event.detail.id === \$wire.\$id + '-action') if ( \$wire.mountedActions.includes('aiAssist')) { let attempts = 0; const timer = setInterval(function () { if (!\$wire.mountedActions.length) { clearInterval(timer); document.querySelector('[data-editorial-trigger=assist]')?.focus() } else if (++attempts === 100) { clearInterval(timer) } }, 50) }"),
                ])
                ->visible(fn () => (bool) config('ai_editorial.enabled'))
                ->modalDescription('Suggestions only. Source URLs are not fetched. Supply facts you have verified. Mock mode produces labelled demonstration text.')
                ->fillForm(fn () => ['topic' => $this->data['title'] ?? '', 'source_name' => $this->data['source_name'] ?? '',
                    'source_url' => $this->data['source_url'] ?? '', 'existing_content' => strip_tags($this->data['content'] ?? ''), 'length' => 'medium', 'operation' => 'draft'])
                ->form([
                    Select::make('operation')->options(fn () => array_intersect_key([
                        'draft' => 'Draft article', 'outline' => 'Generate outline', 'introduction' => 'Improve introduction',
                        'headline' => 'Improve headline', 'improve' => 'Improve article', 'seo' => 'Generate SEO metadata', 'category' => 'Recommend category',
                    ], array_flip($this->editorialType() === 'news' ? ['draft', 'headline', 'improve', 'seo', 'category'] : ['draft', 'outline', 'introduction', 'headline', 'improve', 'seo', 'category'])))->required(),
                    TextInput::make('topic')->label('Topic or working headline')->required()->maxLength(250),
                    TextInput::make('source_name')->maxLength(255), TextInput::make('source_url')->url()->maxLength(2048),
                    Textarea::make('source_text')->label('Source text or editor-verified facts')->maxLength(16000)->rows(6),
                    Textarea::make('existing_content')->label('Existing article text')->maxLength(16000)->rows(5),
                    TextInput::make('audience')->label('Target audience')->maxLength(300),
                    Textarea::make('angle')->label('Editorial angle')->maxLength(1000),
                    Select::make('length')->options(['short' => 'Short (about 300 words)', 'medium' => 'Medium (about 600 words)', 'long' => 'Long (about 1,000 words)'])->required(),
                    \Filament\Forms\Components\Section::make('AI Feature Image')->collapsible()->collapsed()
                        ->visible(fn () => config('ai_image.enabled'))
                        ->schema([Placeholder::make('feature_image_workspace')->label('Image workspace')->content(new \Illuminate\Support\HtmlString(
                            '<p>Generate an illustrative image in a separate workspace. Images do not verify article facts.</p><button type="button" wire:click="replaceMountedAction(\'aiFeatureImage\')" class="mt-3 font-semibold underline">Open AI Feature Image</button>'
                        ))]),
                ])->modalSubmitActionLabel('Generate suggestions')->action(function (array $data): void {
                    try {
                        $output = app(EditorialAssistant::class)->generate($this->editorialType(), $data, $this->editorialRecordId());
                    } catch (ValidationException $e) {
                        $path = $this->getMountedActionForm()->getStatePath();
                        $messages = [];
                        foreach ($e->errors() as $field => $errors) {
                            $messages[$path.'.'.$field] = $errors;
                        }
                        throw ValidationException::withMessages($messages);
                    } catch (RuntimeException $e) {
                        Notification::make()->danger()->title($e->getMessage())->send();
                        return;
                    }
                    if ($this->editorialPreviewToken) {
                        session()->forget('editorial.'.$this->editorialPreviewToken);
                    }
                    $this->editorialPreviewToken = (string) Str::uuid();
                    session()->put('editorial.'.$this->editorialPreviewToken, ['output' => $output, 'operation' => $data['operation'], 'expires' => time() + 1800]);
                    Notification::make()->success()->title('Suggestions ready. Open Review AI suggestions to edit and apply.')->send();
                }),
            Action::make('reviewAi')->label('Review AI suggestions')->visible(fn () => $this->editorialPreviewToken !== null)
                ->extraAttributes([
                    'data-editorial-trigger' => 'review',
                    'x-data' => '{}',
                    'x-on:close-modal.window' => new \Illuminate\Support\HtmlString("if (\$event.detail.id === \$wire.\$id + '-action') if ( \$wire.mountedActions.includes('reviewAi')) { let attempts = 0; const timer = setInterval(function () { if (!\$wire.mountedActions.length) { clearInterval(timer); document.querySelector('[data-editorial-trigger=review]')?.focus() } else if (++attempts === 100) { clearInterval(timer) } }, 50) }"),
                ])
                ->modalDescription('Edit suggestions and select fields to apply. Applying resets this article to an unpublished draft. Introduction replaces the first paragraph and preserves the rest. Outline and article suggestions replace the body when selected.')
                ->fillForm(fn () => ($this->editorialPreview()['output'] ?? []) + ['fields' => [], 'confirm' => false])
                ->form([
                    Placeholder::make('verification')->label('Editorial verification checklist')->content(fn () => new \Illuminate\Support\HtmlString(
                        '<ul class="list-disc space-y-2 pl-5"><li>'.implode('</li><li>', array_map(fn ($item) => e($item), $this->editorialPreview()['output']['verification_checklist'] ?? [])).'</li></ul>'
                    )),
                    TextInput::make('title')->required()->maxLength(255), TextInput::make('slug')->required()->maxLength(255),
                    Textarea::make('body')->required()->maxLength(30000)->rows(12), Textarea::make('excerpt')->required()->maxLength(1000),
                    TextInput::make('seo_title')->required()->maxLength(70), Textarea::make('seo_description')->required()->maxLength(170),
                    Select::make('category_id')->options(fn () => app(EditorialAssistant::class)->categories($this->editorialType())),
                    TextInput::make('source_name')->disabled()->dehydrated(false), TextInput::make('source_url')->disabled()->dehydrated(false),
                    CheckboxList::make('fields')->label('Fields to apply')->options(fn () => array_combine(
                        $fields = app(EditorialAssistant::class)->fields($this->editorialPreview()['operation'], $this->editorialType()), $fields))->required(),
                    Toggle::make('confirm')->label('I reviewed the checklist and confirm replacement of the selected fields and reset to draft.')->rule('accepted'),
                ])->modalSubmitActionLabel('Apply selected suggestions')->action(function (array $data): void {
                    $service = app(EditorialAssistant::class);
                    $service->authorize($this->editorialType(), $this->editorialRecordId());
                    abort_unless(config('ai_editorial.enabled'), 503);
                    $preview = $this->editorialPreview();
                    abort_unless(($data['confirm'] ?? false) && ! empty($data['fields']), 422);
                    try {
                        $output = $service->validateOutput($data + ['verification_checklist' => $preview['output']['verification_checklist']], $this->editorialType());
                    } catch (RuntimeException $e) {
                        Notification::make()->danger()->title($e->getMessage())->send();
                        return;
                    }
                    $output['source_name'] = $preview['output']['source_name'];
                    $output['source_url'] = $preview['output']['source_url'];
                    $allowed = $service->fields($preview['operation'], $this->editorialType());
                    foreach ($data['fields'] as $field) {
                        abort_unless(in_array($field, $allowed, true), 422);
                    }
                    foreach ($data['fields'] as $field) {
                        if ($field === 'body') {
                            $html = '<p>'.nl2br(e($output['body'])).'</p>';
                            if ($preview['operation'] === 'introduction') {
                                $existing = $this->data['content'] ?? '';
                                $replaced = preg_replace_callback('/<p\b[^>]*>.*?<\/p>/is', fn () => $html, $existing, 1, $count);
                                $this->data['content'] = $count ? $replaced : $html.$existing;
                            } else {
                                $this->data['content'] = $html;
                            }
                        } else {
                            $this->data[$field] = $output[$field];
                        }
                    }
                    $this->data['status'] = $this->editorialType() === 'news' ? 'pending' : 'draft';
                    $this->data['published_at'] = null;
                    $this->data['featured'] = false;
                    $this->editorialApplied = true;
                    if ($this->editorialType() === 'blog') {
                        $this->data['is_public_approved'] = false;
                    }
                    session()->forget('editorial.'.$this->editorialPreviewToken);
                    $this->editorialPreviewToken = null;
                    Notification::make()->success()->title('Selected suggestions applied. Review and save the draft.')->send();
                }),
            ...$this->featureImageActions(),
        ];
    }

    protected function editorialPreview(): array
    {
        $preview = $this->editorialPreviewToken ? session('editorial.'.$this->editorialPreviewToken) : null;
        abort_unless(is_array($preview) && $preview['expires'] >= time(), 419, 'Suggestions expired. Generate again.');
        return $preview;
    }
}
