<?php

namespace Database\Seeders;

use App\Models\WatchSource;
use Illuminate\Database\Seeder;

class WatchSourceSeeder extends Seeder
{
    public function run(): void
    {
        $sources = [
            [
                'name' => 'Fireship',
                'platform_channel_id' => 'UCsBjURrPoezykLs9EqgamOA',
                'category' => 'technology',
                'description' => 'Software development tutorials, developer technology, and concise tech news. Channel ID verified against the channel URL; see docs/watch/source-strategy.md.',
                'priority' => 1,
            ],
            [
                'name' => 'Y Combinator',
                'platform_channel_id' => 'UCcefcZRL2oaA_uBNeo5UOWg',
                'category' => 'business',
                'description' => 'Startup formation, founder interviews, and company building. Channel ID verified; see docs/watch/source-strategy.md.',
                'priority' => 1,
            ],
            [
                'name' => 'Google for Developers',
                'platform_channel_id' => 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
                'category' => 'technology',
                'description' => 'Official technical tutorials, developer news, and updates across AI, cloud, mobile, and web. Channel ID and recent publishing verified; see docs/watch/source-strategy.md.',
                'priority' => 2,
            ],
        ];

        foreach ($sources as $source) {
            WatchSource::firstOrCreate(
                ['platform' => WatchSource::PLATFORM_YOUTUBE, 'platform_channel_id' => $source['platform_channel_id']],
                $source + ['is_active' => true],
            );
        }
    }
}
