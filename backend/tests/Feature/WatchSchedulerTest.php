<?php

namespace Tests\Feature;

use Illuminate\Console\Scheduling\Schedule;
use Tests\TestCase;

class WatchSchedulerTest extends TestCase
{
    public function test_watch_collector_is_scheduled_every_six_hours_without_overlapping(): void
    {
        $event = collect(app(Schedule::class)->events())
            ->first(fn ($event) => str_contains($event->command, 'watch:collect'));

        $this->assertNotNull($event);
        $this->assertSame('0 */6 * * *', $event->expression);
        $this->assertTrue($event->withoutOverlapping);
    }
}
