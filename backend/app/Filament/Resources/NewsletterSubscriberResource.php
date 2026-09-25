<?php

namespace App\Filament\Resources;

use App\Filament\Resources\NewsletterSubscriberResource\Pages;
use App\Models\NewsletterSubscriber;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class NewsletterSubscriberResource extends Resource
{
    protected static ?string $model = NewsletterSubscriber::class;
    protected static ?string $navigationIcon = 'heroicon-o-envelope';
    protected static ?string $navigationGroup = 'Engagement';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('email')->email()->required(),
            Forms\Components\TextInput::make('name'),
            Forms\Components\Select::make('status')->options([
                'subscribed'=>'Subscribed','unsubscribed'=>'Unsubscribed',
            ])->required(),
            Forms\Components\DateTimePicker::make('subscribed_at'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('email')->searchable(),
            Tables\Columns\TextColumn::make('name')->searchable(),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\TextColumn::make('subscribed_at')->dateTime(),
        ])->filters([
            Tables\Filters\SelectFilter::make('status')->options([
                'subscribed'=>'Subscribed','unsubscribed'=>'Unsubscribed',
            ]),
        ])->actions([Tables\Actions\EditAction::make()])
          ->bulkActions([Tables\Actions\DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'=>Pages\ListNewsletterSubscribers::route('/'),
            'create'=>Pages\CreateNewsletterSubscriber::route('/create'),
            'edit'=>Pages\EditNewsletterSubscriber::route('/{record}/edit'),
        ];
    }
}
