<?php

namespace App\Filament\Widgets;

use App\Models\BlogPost;
use App\Models\ContactMessage;
use App\Models\News;
use App\Models\Product;
use App\Models\Service;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class ContentStats extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Published Products', Product::where('status','published')->count()),
            Stat::make('Published Services', Service::where('status','published')->count()),
            Stat::make('Published News', News::where('status','published')->count()),
            Stat::make('Published Blog Posts', BlogPost::where('status','published')->count()),
            Stat::make('Unread Messages', ContactMessage::where('status','unread')->count()),
        ];
    }
}
