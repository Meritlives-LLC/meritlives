<?php

namespace App\Filament\Pages;

use App\Services\AboutPageContent;
use App\Support\RasterUpload;
use Filament\Pages\Page;
use Filament\Forms\{Form, Components as F};
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Locked;

class ManageAboutPage extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-building-office-2';
    protected static ?string $navigationGroup = 'Content';
    protected static ?string $navigationLabel = 'About Page';
    protected static ?string $title = 'About Page';
    protected static ?string $slug = 'about-page';
    protected static string $view = 'filament.pages.manage-about-page';
    public ?array $data = [];
    #[Locked]
    public ?array $previewData = null;

    public static function canAccess(): bool
    {
        return (bool) (auth()->user()?->hasAnyRole(['admin','super_admin']) && auth()->user()->can('manage_settings'));
    }

    public function mount(): void
    {
        app(AboutPageContent::class)->authorize();
        $this->form->fill(app(AboutPageContent::class)->draft());
    }

    public function form(Form $form): Form
    {
        $text = fn ($key, $label) => F\Textarea::make($key)->label($label)->required()->maxLength(3000)->rows(4);
        return $form->schema([
            F\Section::make('Hero')->description('Stock photography is illustrative. Upload only images you have permission to use.')->schema([
                F\TextInput::make('hero_title')->label('Headline')->required()->maxLength(200),
                $text('hero_description', 'Description'), RasterUpload::field('hero_image', 'general')->label('Hero image'),
                F\TextInput::make('hero_image_alt')->label('Hero image description')->required()->maxLength(255),
            ]),
            F\Section::make('Company and story')->schema([
                F\TextInput::make('who_title')->label('Who We Are headline')->required()->maxLength(200),
                $text('who_body', 'Who We Are'), F\TextInput::make('story_title')->label('Story headline')->required()->maxLength(200),
                $text('story_body', 'Our Story'), $text('mission', 'Mission'), $text('vision', 'Vision'),
                RasterUpload::field('section_image', 'general')->label('Story image'),
                F\TextInput::make('section_image_alt')->label('Story image description')->required()->maxLength(255),
            ]),
            F\Section::make('Values and approach')->schema(array_map(fn ($key) => F\Repeater::make($key)
                ->label($key === 'values' ? 'Core Values' : 'Our Approach')->schema([
                    F\TextInput::make('title')->required()->maxLength(80),
                    F\Textarea::make('description')->required()->maxLength(600)->rows(2),
                ])->minItems(1)->maxItems(10)->reorderableWithButtons()->collapsible()->itemLabel(fn ($state) => $state['title'] ?? 'New item'), ['values','approach'])),
            F\Section::make('Featured services and products')->description('Choose existing catalogue entries or published CMS records. Remove selections to hide them from this page.')->schema([
                F\Select::make('service_slugs')->label('Services')->multiple()->options(fn () => app(AboutPageContent::class)->serviceOptions())->searchable(),
                F\Select::make('product_slugs')->label('Products')->multiple()->options(fn () => app(AboutPageContent::class)->productOptions())->searchable(),
            ]),
            F\Section::make('Final call to action')->schema([
                F\TextInput::make('cta_title')->label('Headline')->required()->maxLength(200), $text('cta_description', 'Description'),
                F\TextInput::make('cta_primary_label')->label('Contact button label')->required()->maxLength(60),
                F\TextInput::make('cta_secondary_label')->label('Services button label')->required()->maxLength(60),
            ]),
            F\Section::make('Search and social sharing')->schema([
                F\TextInput::make('seo_title')->label('SEO title')->required()->maxLength(70),
                F\Textarea::make('seo_description')->label('SEO description')->required()->maxLength(170),
                RasterUpload::field('social_image', 'general')->label('Social sharing image'),
            ]),
        ])->statePath('data');
    }

    protected function getHeaderActions(): array
    {
        return [Action::make('saveDraft')->label('Save draft')->action('saveDraft'),
            Action::make('preview')->label('Preview changes')->color('gray')->action('preview'),
            Action::make('publish')->label('Publish changes')->requiresConfirmation()
                ->modalDescription('Replace the public About page with these changes? Your saved draft remains available.')->action(fn () => $this->publish())];
    }

    private function validatedState(): array
    {
        app(AboutPageContent::class)->authorize();
        try {
            return app(AboutPageContent::class)->validate($this->form->getState());
        } catch (ValidationException $e) {
            $messages = [];
            foreach ($e->errors() as $key => $errors) $messages[str_starts_with($key, 'data.') ? $key : 'data.'.$key] = $errors;
            throw ValidationException::withMessages($messages);
        }
    }

    public function saveDraft(): void
    {
        app(AboutPageContent::class)->save($this->validatedState());
        $this->previewData = null;
        Notification::make()->success()->title('Draft saved. The public page is unchanged.')->send();
    }

    public function preview(): void
    {
        $this->previewData = $this->validatedState();
    }

    public function publish(): void
    {
        app(AboutPageContent::class)->save($this->validatedState(), true);
        $this->previewData = null;
        Notification::make()->success()->title('About page published.')->send();
    }
}
