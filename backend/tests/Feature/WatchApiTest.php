<?php

namespace Tests\Feature;

use App\Models\WatchSource;
use App\Models\WatchVideo;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WatchApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_watch_sources_and_videos_can_be_created_with_a_relationship(): void
    {
        $source = $this->source();
        $video = $this->video($source);

        $this->assertSame($source->id, $video->source->id);
        $this->assertDatabaseHas('watch_sources', [
            'platform' => 'youtube',
            'platform_channel_id' => 'UC1234567890',
        ]);
        $this->assertDatabaseHas('watch_videos', [
            'youtube_video_id' => 'dQw4w9WgXcQ',
            'watch_source_id' => $source->id,
        ]);
    }

    public function test_youtube_video_id_is_unique_at_the_database_level(): void
    {
        $source = $this->source();
        $this->video($source);

        $this->expectException(QueryException::class);
        $this->video($source, ['slug' => 'duplicate-video']);
    }

    public function test_public_watch_api_returns_only_active_valid_youtube_videos(): void
    {
        $source = $this->source();
        $this->video($source);
        $this->video($source, [
            'youtube_video_id' => 'shortid',
            'slug' => 'inactive-video',
            'status' => WatchVideo::STATUS_INACTIVE,
        ]);
        $this->video($source, [
            'youtube_video_id' => 'bbbbbbbbbbb',
            'slug' => 'invalid-id-video',
            'status' => WatchVideo::STATUS_ACTIVE,
            'video_url' => 'https://www.youtube.com/watch?v=shortid',
        ]);
        $this->video($source, [
            'youtube_video_id' => 'ccccccccccc',
            'slug' => 'invalid-url-video',
            'status' => WatchVideo::STATUS_ACTIVE,
            'video_url' => 'https://example.com/watch?v=ccccccccccc',
        ]);
        $this->video($source, [
            'youtube_video_id' => 'ddddddddddd',
            'slug' => 'missing-thumbnail-video',
            'status' => WatchVideo::STATUS_ACTIVE,
            'thumbnail_url' => null,
        ]);

        $response = $this->getJson('/api/v1/watch');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.youtube_video_id', 'dQw4w9WgXcQ')
            ->assertJsonPath('data.0.source_name', 'Example Technology Channel')
            ->assertJsonPath('data.0.category', 'technology')
            ->assertJsonMissingPath('data.0.watch_source_id')
            ->assertJsonMissingPath('data.0.relevance_score');
    }

    public function test_inactive_video_is_not_available_by_slug(): void
    {
        $source = $this->source();
        $this->video($source, [
            'status' => WatchVideo::STATUS_INACTIVE,
        ]);

        $this->getJson('/api/v1/watch/example-video')->assertNotFound();
    }

    private function source(): WatchSource
    {
        return WatchSource::create([
            'name' => 'Example Technology Channel',
            'platform' => WatchSource::PLATFORM_YOUTUBE,
            'platform_channel_id' => 'UC1234567890',
            'category' => 'technology',
            'is_active' => true,
            'priority' => 1,
        ]);
    }

    /** @param array<string, mixed> $overrides */
    private function video(WatchSource $source, array $overrides = []): WatchVideo
    {
        return WatchVideo::create(array_merge([
            'watch_source_id' => $source->id,
            'youtube_video_id' => 'dQw4w9WgXcQ',
            'title' => 'A technology story',
            'slug' => 'example-video',
            'description' => 'A short editorial video description.',
            'thumbnail_url' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
            'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'category' => 'technology',
            'published_at' => '2026-10-01 12:00:00',
            'relevance_score' => 80,
            'quality_score' => 75,
            'status' => WatchVideo::STATUS_ACTIVE,
            'is_featured' => true,
        ], $overrides));
    }
}
