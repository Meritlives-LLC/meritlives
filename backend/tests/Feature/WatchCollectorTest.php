<?php

namespace Tests\Feature;

use App\Models\WatchSource;
use App\Models\WatchVideo;
use Illuminate\Http\Client\Request;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WatchCollectorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.youtube.api_key' => 'test-key']);
        config(['watch.recent_days' => 30, 'watch.max_videos_per_source' => 30]);
    }

    public function test_command_collects_and_deduplicates_repeated_runs(): void
    {
        $this->source('UCsBjURrPoezykLs9EqgamOA', 'Fireship');
        Http::fake(fn (Request $request) => $this->responseFor($request));

        $this->artisan('watch:collect')->assertExitCode(0);
        $this->artisan('watch:collect')->assertExitCode(0);

        $this->assertDatabaseCount('watch_videos', 1);
        $video = WatchVideo::firstOrFail();
        $this->assertSame('https://www.youtube.com/watch?v=dQw4w9WgXcQ', $video->video_url);
        $this->assertFalse($video->is_featured);
        $this->assertSame(11, strlen($video->youtube_video_id));
    }

    public function test_inactive_sources_are_not_requested(): void
    {
        $this->source('UCsBjURrPoezykLs9EqgamOA', 'Inactive', false);
        Http::fake();

        $this->artisan('watch:collect')->assertExitCode(0);

        Http::assertNothingSent();
    }

    public function test_explicit_short_metadata_is_filtered(): void
    {
        $this->source('UCsBjURrPoezykLs9EqgamOA', 'Fireship');
        Http::fake(function (Request $request) {
            if (parse_url($request->url(), PHP_URL_PATH) === '/youtube/v3/videos') {
                return Http::response(['items' => [[
                    'id' => 'dQw4w9WgXcQ',
                    'snippet' => [
                        'title' => 'A software tip #Shorts',
                        'description' => 'Programming trick',
                        'publishedAt' => now()->toIso8601String(),
                        'thumbnails' => ['high' => ['url' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg']],
                    ],
                    'contentDetails' => ['duration' => 'PT1M'],
                    'status' => ['privacyStatus' => 'public', 'embeddable' => true],
                ]]]);
            }
            return $this->responseFor($request);
        });

        $result = app(\App\Services\YouTube\WatchCollector::class)->collect();

        $this->assertSame(1, $result['totals']['found']);
        $this->assertSame(1, $result['totals']['skipped']);
        $this->assertDatabaseCount('watch_videos', 0);
    }

    public function test_a_failed_source_does_not_stop_later_sources(): void
    {
        $this->source('UCaaaaaaaaaaaaaaaaaaaaaa', 'Broken source');
        $this->source('UCbbbbbbbbbbbbbbbbbbbbbb', 'Healthy source');
        Http::fake(function (Request $request) {
            if (parse_url($request->url(), PHP_URL_PATH) === '/youtube/v3/channels' && $request->data()['id'] === 'UCaaaaaaaaaaaaaaaaaaaaaa') {
                return Http::response(['error' => 'failure'], 500);
            }
            return $this->responseFor($request);
        });

        $result = app(\App\Services\YouTube\WatchCollector::class)->collect();

        $this->assertSame(1, $result['totals']['failed']);
        $this->assertSame(1, $result['totals']['new']);
        $this->assertDatabaseCount('watch_videos', 1);
    }

    public function test_missing_api_key_fails_with_a_clear_command_message(): void
    {
        config(['services.youtube.api_key' => '']);

        $this->artisan('watch:collect')
            ->expectsOutputToContain('YOUTUBE_API_KEY is not configured')
            ->assertExitCode(1);
    }

    private function source(string $id, string $name, bool $active = true): WatchSource
    {
        return WatchSource::create([
            'name' => $name,
            'platform' => WatchSource::PLATFORM_YOUTUBE,
            'platform_channel_id' => $id,
            'category' => 'technology',
            'is_active' => $active,
            'priority' => 2,
        ]);
    }

    private function responseFor(Request $request): \Illuminate\Http\Client\Response
    {
        $path = parse_url($request->url(), PHP_URL_PATH);
        return match (basename((string) $path)) {
            'channels' => Http::response(['items' => [['contentDetails' => ['relatedPlaylists' => ['uploads' => 'UU-upload']]]]]),
            'playlistItems' => Http::response(['items' => [['contentDetails' => ['videoId' => 'dQw4w9WgXcQ']]]]),
            'videos' => Http::response(['items' => [[
                'id' => 'dQw4w9WgXcQ',
                'snippet' => [
                    'title' => 'New software technology update',
                    'description' => str_repeat('A useful developer technology discussion. ', 5),
                    'publishedAt' => now()->toIso8601String(),
                    'thumbnails' => ['high' => ['url' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg']],
                ],
                'contentDetails' => ['duration' => 'PT5M'],
                'status' => ['privacyStatus' => 'public', 'embeddable' => true],
            ]]]),
            default => Http::response([], 404),
        };
    }
}
