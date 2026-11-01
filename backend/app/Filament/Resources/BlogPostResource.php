<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BlogPostResource\Pages;
use App\Filament\Resources\Concerns\UsesResourcePermissions;
use App\Models\BlogPost;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class BlogPostResource extends Resource
{
    use UsesResourcePermissions;

    public static function canReview(): bool
    {
        $user = auth()->user();
        return $user && ($user->hasAnyRole(['admin', 'super_admin']) || $user->can('review_blog'));
    }

    private static function ownsOrReviews(\Illuminate\Database\Eloquent\Model $record): bool
    {
        return static::canReview() || (auth()->id() !== null && (string) $record->user_id === (string) auth()->id());
    }

    public static function canView(\Illuminate\Database\Eloquent\Model $record): bool
    {
        return static::isAuthorized('view') && static::ownsOrReviews($record);
    }

    public static function canEdit(\Illuminate\Database\Eloquent\Model $record): bool
    {
        return static::isAuthorized('edit') && static::ownsOrReviews($record);
    }

    public static function canDelete(\Illuminate\Database\Eloquent\Model $record): bool
    {
        return static::isAuthorized('delete') && static::ownsOrReviews($record);
    }

    public static function canForceDelete(\Illuminate\Database\Eloquent\Model $record): bool
    {
        return static::canDelete($record);
    }

    public static function canReplicate(\Illuminate\Database\Eloquent\Model $record): bool
    {
        return static::canCreate() && static::ownsOrReviews($record);
    }

    public static function canDeleteAny(): bool
    {
        return static::canReview() && static::isAuthorized('delete');
    }

    public static function canForceDeleteAny(): bool
    {
        return static::canDeleteAny();
    }

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        $query = parent::getEloquentQuery();
        return static::canReview() ? $query : $query->where('user_id', auth()->id());
    }

    public static function authoringData(array $data, bool $creating = false): array
    {
        // Server-side protection, independent of form visibility or dehydration.
        unset($data['user_id']);
        if ($creating) {
            $data['user_id'] = auth()->id();
        }
        if (! static::canReview()) {
            foreach (['status', 'published_at', 'is_public_approved', 'featured'] as $field) {
                unset($data[$field]);
            }
            if ($creating) {
                $data += ['status' => 'draft', 'is_public_approved' => false, 'published_at' => null, 'featured' => false];
            }
        }
        return $data;
    }


    protected static function permissions(): array
    {
        return ['view' => 'view_blog', 'create' => 'create_blog', 'edit' => 'edit_blog', 'delete' => 'delete_blog'];
    }

    protected static ?string $model = BlogPost::class;
    protected static ?string $navigationIcon = 'heroicon-o-document-text';
    protected static ?string $navigationGroup = 'Content';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('title')->required(),
            Forms\Components\TextInput::make('slug')->required()->unique(ignoreRecord: true),
            Forms\Components\Select::make('category_id')->relationship('category','name', modifyQueryUsing: fn ($query) => $query->where('type', 'blog')->where('status', 'active'))->searchable()->preload(),
            Forms\Components\Textarea::make('excerpt')->rows(4)->columnSpanFull(),
            Forms\Components\RichEditor::make('content')->fileAttachmentsDisk('public')->fileAttachmentsDirectory('attachments')->saveUploadedFileAttachmentsUsing(fn ($file) => \App\Support\RasterUpload::store($file, 'attachments'))->required()->columnSpanFull(),
            \App\Support\RasterUpload::field('featured_image', 'blogs'),
            Forms\Components\Select::make('status')->options([
                'draft'=>'Draft','published'=>'Published',
            ])->required()->disabled(fn () => ! static::canReview())->dehydrated(fn () => static::canReview()),
            Forms\Components\Toggle::make('is_public_approved')
                ->disabled(fn () => ! static::canReview())->dehydrated(fn () => static::canReview())
                ->label('Approved for public release')
                ->helperText('Only approved, published posts with a publication date in the past are visible publicly.'),
            Forms\Components\DateTimePicker::make('published_at')->disabled(fn () => ! static::canReview())->dehydrated(fn () => static::canReview()),
            Forms\Components\Select::make('tags')->multiple()->relationship('tags','name')->preload()->searchable(),
            Forms\Components\Toggle::make('featured')->disabled(fn () => ! static::canReview())->dehydrated(fn () => static::canReview()),
            Forms\Components\TextInput::make('seo_title'),
            Forms\Components\Textarea::make('seo_description')->rows(3),
            Forms\Components\TextInput::make('canonical_url')->url(),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('title')->searchable()->limit(60),
            Tables\Columns\TextColumn::make('author.name')->label('Author'),
            Tables\Columns\TextColumn::make('category.name')->label('Category'),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\TextColumn::make('published_at')->dateTime()->sortable(),
        ])->filters([
            Tables\Filters\SelectFilter::make('status')->options([
                'draft'=>'Draft','published'=>'Published',
            ]),
            Tables\Filters\TernaryFilter::make('featured'),
            Tables\Filters\SelectFilter::make('category_id')->relationship('category', 'name', modifyQueryUsing: fn ($query) => $query->where('type', 'blog')->where('status', 'active')),
        ])->actions([
            Tables\Actions\EditAction::make(),
        ])->bulkActions([
            Tables\Actions\DeleteBulkAction::make(),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index'=>Pages\ListBlogPosts::route('/'),
            'create'=>Pages\CreateBlogPost::route('/create'),
            'edit'=>Pages\EditBlogPost::route('/{record}/edit'),
        ];
    }
}
