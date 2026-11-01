<?php

namespace App\Console\Commands;

use App\Models\NewsSource;
use App\Services\NewsDiscovery\NewsDiscoveryManager;
use Illuminate\Console\Command;

class DiscoverNews extends Command
{
    protected $signature = 'news:discover {--dry-run : List enabled sources without fetching or writing}';
    protected $description = 'Discover feed items from enabled, allowlisted RSS sources into the editorial review queue.';

    public function handle(NewsDiscoveryManager $manager): int
    {
        $sources = NewsSource::query()->where('enabled', true)->orderBy('id')->get();
        if ($this->option('dry-run')) {
            $this->info('Dry run: '.$sources->count().' enabled source(s); no requests or writes performed.');
            return self::SUCCESS;
        }

        $failures = 0;
        foreach ($sources as $source) {
            try {
                $count = $manager->refresh($source);
                $this->line('Refreshed source #'.$source->id.': '.$count.' new discovery item(s).');
            } catch (\Throwable) {
                $this->warn('Source #'.$source->id.' could not be refreshed. See its safe status in the admin panel.');
                $failures++;
            }
        }
        $this->info('Discovery complete. '.$sources->count().' source(s), '.$failures.' failure(s).');
        return $failures > 0 ? self::FAILURE : self::SUCCESS;
    }
}
