<?php

namespace App\Filament\Pages;

use App\Models\News;
use App\Services\NewsImageGenerator;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Forms\Form;
use Illuminate\Support\Facades\Storage;
use Throwable;

class NewsImageStudio extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-photo';
    protected static ?string $navigationGroup = 'Content';
    protected static ?string $navigationLabel = 'AI Image Studio';
    protected static ?int $navigationSort = 30;
    protected static string $view = 'filament.pages.news-image-studio';

    public ?array $data = [];
    public ?string $latestImageUrl = null;

    public static function canAccess(): bool
    {
        return (bool) (auth()->user()?->can('manage_media') || auth()->user()?->can('edit_news'));
    }

    public function mount(): void
    {
        $this->form->fill(['news_id' => null, 'prompt' => '']);
    }

    public function form(Form $form): Form
    {
        return $form->schema([
            Select::make('news_id')
                ->label('News article')
                ->options(fn (): array => News::query()->orderByDesc('created_at')->limit(300)->pluck('title', 'id')->all())
                ->searchable()
                ->required(),
            Textarea::make('prompt')
                ->label('Image prompt')
                ->helperText('Describe a topic-specific editorial illustration. Do not ask the model to fabricate a documentary photograph or put text in the image.')
                ->rows(6)
                ->maxLength(4000)
                ->required(),
        ])->statePath('data');
    }

    public function generate(): void
    {
        abort_unless(auth()->user()?->can('manage_media') || auth()->user()?->can('edit_news'), 403);
        $state = $this->form->getState();
        $news = News::findOrFail((int) $state['news_id']);

        try {
            $generation = app(NewsImageGenerator::class)->generate($news, (string) $state['prompt'], (int) auth()->id());
            $this->latestImageUrl = Storage::disk('public')->url($generation->image_path);
            Notification::make()->title('Image generated and queued for approval')
                ->body('The image is not approved or published yet.')->success()->send();
        } catch (Throwable $e) {
            report($e);
            Notification::make()->title('Image generation failed')->body($e->getMessage())->danger()->send();
        }
    }
}
