<?php

namespace App\Console\Commands;

use App\Services\YouTube\WatchCollector;
use Illuminate\Console\Command;

class CollectWatchVideos extends Command
{
    protected $signature = 'watch:collect';

    protected $description = 'Collect recent public videos from approved YouTube Watch sources';

    public function handle(WatchCollector $collector): int
    {
        $this->info('MERITLIVES Watch Collector');
        if (! is_string(config('services.youtube.api_key')) || trim((string) config('services.youtube.api_key')) === '') {
            $this->error('YOUTUBE_API_KEY is not configured. Add it to the backend environment and retry.');
            return self::FAILURE;
        }

        $result = $collector->collect();
        foreach ($result['sources'] as $source) {
            $this->newLine();
            $this->line('Source: '.$source['name']);
            $this->line("Found: {$source['found']} | New: {$source['new']} | Updated: {$source['updated']} | Skipped: {$source['skipped']} | Failed: {$source['failed']}");
            if (($source['error'] ?? null) !== null) {
                $this->warn('Collection error: '.$source['error']);
            }
        }

        $totals = $result['totals'];
        $this->newLine();
        $this->info('TOTAL');
        $this->line("Successful sources: {$totals['successful_sources']} | Failed sources: {$totals['failed_sources']}");
        $this->line("Found: {$totals['found']} | New: {$totals['new']} | Updated: {$totals['updated']} | Skipped: {$totals['skipped']} | Failed: {$totals['failed']}");

        return $totals['failed_sources'] > 0 && $totals['successful_sources'] === 0 ? self::FAILURE : self::SUCCESS;
    }
}
