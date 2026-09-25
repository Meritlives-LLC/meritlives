<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Keep scheduled work explicit and observable.
// Add production jobs here as they are introduced.
//
// Example:
// Schedule::command('news:sync')->hourly()->withoutOverlapping();
