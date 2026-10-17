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
        $this->fakeYouTubeResponses();

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
        $shortVideo = [
            'items' => [[
                'id' => 'dQw4w9WgXcQ',
                'snippet' => [
                    'title' => 'A software tip #Shorts',
                    'description' => 'Programming trick',
                    'publishedAt' => now()->toIso8601String(),
                    'thumbnails' => ['high' => ['url' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg']],
                ],
                'contentDetails' => ['duration' => 'PT1M'],
                'status' => ['privacyStatus' => 'public', 'embeddable' => true],
            ]],
        ];
        $this->fakeYouTubeResponses($shortVideo);

        $result = app(\App\Services\YouTube\WatchCollector::class)->collect();

        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/youtube/v3/videos'));
        $this->assertSame(1, $result['totals']['found']);
        $this->assertSame(1, $result['totals']['skipped']);
        $this->assertDatabaseCount('watch_videos', 0);
    }

    public function test_a_failed_source_does_not_stop_later_sources(): void
    {
        $this->source('UCaaaaaaaaaaaaaaaaaaaaaa', 'Broken source');
        $this->source('UCbbbbbbbbbbbbbbbbbbbbbb', 'Healthy source');
        $this->fakeYouTubeResponses(null, 'UCaaaaaaaaaaaaaaaaaaaaaa');

        $result = app(\App\Services\YouTube\WatchCollector::class)->collect();

        $this->assertSame(1, $result['totals']['failed']);
        $this->assertSame(1, $result['totals']['failed_sources']);
        $this->assertSame(1, $result['totals']['successful_sources']);
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

    /**
     * Register explicit URL-pattern fakes so GET query parameters do not affect
     * endpoint matching. The optional failed channel is selected from the URL
     * query string, not Request::data(), which only exposes the request body.
     *
     * @param array<string, mixed>|null $videoPayload
     */
    private function fakeYouTubeResponses(?array $videoPayload = null, ?string $failedChannelId = null): void
    {
        Http::fake([
            'https://www.googleapis.com/youtube/v3/channels*' => function (Request $request) use ($failedChannelId) {
                $query = [];
                parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

                if ($failedChannelId !== null && ($query['id'] ?? null) === $failedChannelId) {
                    return Http::response(['error' => 'failure'], 500);
                }

                return Http::response(['items' => [[
                    'contentDetails' => ['relatedPlaylists' => ['uploads' => 'UU-upload']],
                ]]]);
            },
            'https://www.googleapis.com/youtube/v3/playlistItems*' => Http::response([
                'items' => [['contentDetails' => ['videoId' => 'dQw4w9WgXcQ']]],
            ]),
            'https://www.googleapis.com/youtube/v3/videos*' => Http::response($videoPayload ?? [
                'items' => [[
                    'id' => 'dQw4w9WgXcQ',
                    'snippet' => [
                        'title' => 'New software technology update',
                        'description' => str_repeat('A useful developer technology discussion. ', 5),
                        'publishedAt' => now()->toIso8601String(),
                        'thumbnails' => ['high' => ['url' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg']],
                    ],
                    'contentDetails' => ['duration' => 'PT5M'],
                    'status' => ['privacyStatus' => 'public', 'embeddable' => true],
                ]],
            ]),
        ]);
    }
}
