<?php
namespace App\Filament\Resources\Concerns;

use App\Models\{AiAuditEvent, Category};
use App\Services\AiImages\{FeatureImageService, ImageException};
use Filament\Actions\Action;
use Filament\Forms\Components\{Select, TextInput, Textarea, Toggle, Placeholder};
use Filament\Notifications\Notification;
use Illuminate\Support\{HtmlString, Str};
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Locked;

trait HasFeatureImageAssistant
{
    #[Locked]
    public ?int $featureImageJobId = null;
    #[Locked]
    public array $featureImageInput = [];

    protected function featureImageActions(): array
    {
        return [
            Action::make('aiFeatureImage')->label('AI Feature Image')->icon('heroicon-o-photo')
                ->extraAttributes($this->featureImageTrigger('aiFeatureImage', 'generate'))
                ->visible(fn () => config('ai_image.enabled') && auth()->user()?->can('manage_media'))
                ->modalDescription(fn () => config('ai_image.provider') === 'mock'
                    ? 'MOCK mode: labelled test imagery, no external requests or charges. Images are illustrations, not evidence of real events.'
                    : 'Configured model: '.config('ai_image.model').'; quality: '.config('ai_image.quality').'. One image per explicit request. Generation and regeneration may incur charges. Images are illustrative, not documentary evidence.')
                ->fillForm(fn () => array_replace([
                    'method' => 'article', 'title' => mb_substr($this->data['title'] ?? '', 0, 255), 'excerpt' => mb_substr($this->data['excerpt'] ?? '', 0, 1000),
                    'body' => mb_substr(strip_tags($this->data['content'] ?? ''), 0, 16000), 'category' => Category::find($this->data['category_id'] ?? null)?->name ?? '',
                    'style' => 'editorial', 'aspect_ratio' => '16:9', 'custom_prompt' => '',
                ], array_intersect_key($this->featureImageInput, array_flip(['method','style','aspect_ratio','custom_prompt'])), ['authorize_cost' => false]))
                ->form([
                    Select::make('method')->label('Generation method')->options(['article' => 'Generate from Article', 'custom' => 'Custom Prompt'])->required()->live()->autofocus()
                        ->extraInputAttributes(['x-data' => '{}', 'x-init' => new HtmlString('let attempts = 0; const timer = setInterval(() => { if (++attempts > 5 && $el.getClientRects().length) { $el.focus(); clearInterval(timer) } else if (attempts > 60) clearInterval(timer) }, 50)')]),
                    TextInput::make('title')->label('Article headline')->maxLength(255)->required(fn ($get) => $get('method') === 'article'),
                    Textarea::make('excerpt')->label('Article summary')->maxLength(1000)->rows(2),
                    Textarea::make('body')->label('Relevant article content')->maxLength(16000)->rows(4),
                    TextInput::make('category')->maxLength(255),
                    Textarea::make('custom_prompt')->label('Image prompt')->helperText('Required for Custom Prompt. Article context above is used only as subject matter, never factual verification.')->maxLength(2000)->rows(4)
                        ->required(fn ($get) => $get('method') === 'custom'),
                    Select::make('style')->options(fn () => config('ai_image.styles'))->required(),
                    Select::make('aspect_ratio')->label('Aspect ratio')->options(['16:9' => '16:9 — Feature image', '1:1' => '1:1 — Square social', '4:5' => '4:5 — Portrait social'])->required(),
                    Toggle::make('authorize_cost')->label('I authorize one billable image request, including regeneration, using the configured model and quality.')
                        ->visible(fn () => config('ai_image.provider') === 'openai')->rule(fn () => config('ai_image.provider') === 'openai' ? 'accepted' : 'nullable'),
                ])->modalSubmitActionLabel('Generate Image')->action(function (array $data): void {
                    try {
                        $service = app(FeatureImageService::class);
                        $job = $service->generate($this->editorialType(), $data, $this->editorialRecordId());
                        if ($this->featureImageJobId) $service->discard($this->featureImageJobId, $this->editorialType(), $this->editorialRecordId());
                        $this->featureImageJobId = $job->id;
                        $this->featureImageInput = $data; unset($this->featureImageInput['authorize_cost']);
                        Notification::make()->success()->title('Image ready. Open Review feature image to inspect, save or assign.')->send();
                    } catch (ValidationException $e) { $this->imageFieldErrors($e); }
                    catch (ImageException $e) { Notification::make()->danger()->title($e->getMessage())->send(); $this->getMountedAction()->halt(); }
                }),
            Action::make('reviewFeatureImage')->label('Review feature image')->visible(fn () => config('ai_image.enabled') && $this->featureImageJobId !== null)
                ->extraAttributes($this->featureImageTrigger('reviewFeatureImage', 'review'))
                ->modalDescription('Review the image and alt text. Saving to Media Library does not change the article. Assignment changes only this editor and forces an unpublished save.')
                ->fillForm(fn () => ['alt_text' => mb_substr('Illustrative visual for '.($this->data['title'] ?? 'this article'), 0, 255), 'confirm_image' => false, 'replace_image' => false])
                ->form([
                    Placeholder::make('image_preview')->label('Image preview')->content(function () {
                        $job = app(FeatureImageService::class)->job($this->featureImageJobId, $this->editorialType(), $this->editorialRecordId());
                        return new HtmlString('<figure><img src="'.e(route('feature-images.preview', $job)).'" alt="Generated feature image preview" style="width:100%;max-height:440px;object-fit:contain;border-radius:8px"><figcaption class="mt-3 text-sm">'.e($job->result_metadata['disclosure']).'</figcaption></figure>');
                    }),
                    TextInput::make('alt_text')->label('SEO alt text')->required()->maxLength(255),
                    Toggle::make('confirm_image')->label('I reviewed this illustrative image and its alt text.'),
                    Toggle::make('replace_image')->label('I confirm replacement of the existing feature image.')
                        ->visible(fn () => ! empty($this->data['featured_image'])),
                ])->modalSubmitAction(false)->extraModalFooterActions([
                    Action::make('useFeatureImage')->label('Use as Feature Image')->action('assignFeatureImage'),
                    Action::make('saveFeatureImageMedia')->label('Save to Media Library')->color('gray')->action('saveFeatureImageMedia'),
                    Action::make('regenerateImage')->label('Regenerate')->color('gray')->action('editFeatureImagePrompt'),
                    Action::make('editImagePrompt')->label('Edit Prompt')->color('gray')->action('editFeatureImagePrompt'),
                    Action::make('discardImagePreview')->label('Discard preview')->color('gray')->action('discardFeatureImagePreview'),
                ]),
        ];
    }

    protected function featureImageTrigger(string $action, string $trigger): array
    {
        return ['data-feature-image-trigger' => $trigger, 'x-data' => '{}',
            'x-on:close-modal.window' => new HtmlString("if (\$event.detail.id === \$wire.\$id + '-action') if (\$wire.mountedActions.includes('{$action}')) { let attempts = 0; const timer = setInterval(function () { if (!\$wire.mountedActions.length) { clearInterval(timer); (document.querySelector('[data-feature-image-trigger={$trigger}]') || document.querySelector('[data-feature-image-trigger=generate]'))?.focus() } else if (++attempts === 100) { clearInterval(timer) } }, 50) }")];
    }

    protected function imageFieldErrors(ValidationException $exception): never
    {
        $messages = []; $path = $this->getMountedActionForm()->getStatePath();
        foreach ($exception->errors() as $field => $errors) $messages[$path.'.'.$field] = $errors;
        throw ValidationException::withMessages($messages);
    }

    protected function imageReview(bool $assign): array
    {
        abort_unless($this->getMountedAction()?->getName() === 'reviewFeatureImage' && $this->featureImageJobId, 422);
        app(FeatureImageService::class)->job($this->featureImageJobId, $this->editorialType(), $this->editorialRecordId());
        try {
            $input = Validator::make($this->mountedActionsData[0] ?? [], [
                'alt_text' => 'required|string|max:255', 'confirm_image' => 'accepted',
                'replace_image' => $assign && ! empty($this->data['featured_image']) ? 'accepted' : 'nullable',
            ])->validate();
            $path = $this->getMountedActionForm()->getStatePath();
            foreach (['alt_text', 'confirm_image', 'replace_image'] as $field) $this->resetValidation($path.'.'.$field);
            return $input;
        } catch (ValidationException $e) { $this->imageFieldErrors($e); }
    }

    public function saveFeatureImageMedia(): void
    {
        $input = $this->imageReview(false);
        try {
            app(FeatureImageService::class)->storeMedia($this->featureImageJobId, $this->editorialType(), $this->editorialRecordId(), $input['alt_text']);
            Notification::make()->success()->title('Saved to Media Library. The article is unchanged.')->send();
        } catch (ValidationException $e) { $this->imageFieldErrors($e); }
        catch (ImageException $e) { Notification::make()->danger()->title($e->getMessage())->send(); }
    }

    public function assignFeatureImage(): void
    {
        $input = $this->imageReview(true);
        try {
            $media = app(FeatureImageService::class)->storeMedia($this->featureImageJobId, $this->editorialType(), $this->editorialRecordId(), $input['alt_text']);
            $this->data['featured_image'] = [(string) Str::uuid() => $media->path];
            $this->editorialApplied = true;
            $this->data = $this->editorialDraftData($this->data);
            AiAuditEvent::record($this->featureImageJobId, auth()->id(), 'feature_image.assigned_to_form', null, null, ['media_id' => $media->id, 'content_type' => $this->editorialType(), 'record_id' => $this->editorialRecordId()]);
            $this->unmountAction();
            Notification::make()->success()->title('Feature image assigned. Review and save the unpublished article.')->send();
        } catch (ValidationException $e) { $this->imageFieldErrors($e); }
        catch (ImageException $e) { Notification::make()->danger()->title($e->getMessage())->send(); }
    }

    public function editFeatureImagePrompt(): void
    {
        app(FeatureImageService::class)->job($this->featureImageJobId, $this->editorialType(), $this->editorialRecordId());
        $this->replaceMountedAction('aiFeatureImage');
    }

    public function discardFeatureImagePreview(): void
    {
        app(FeatureImageService::class)->discard($this->featureImageJobId, $this->editorialType(), $this->editorialRecordId());
        $this->featureImageJobId = null;
        $this->unmountAction();
    }
}
