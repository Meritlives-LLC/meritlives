<?php

namespace App\Services\YouTube;

use App\Models\WatchSource;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class YouTubeDataApi
{
    private const BASE_URL = 'https://www.googleapis.com/youtube/v3';

    /** @return array<int, array<string, mixed>> */
    public function recentUploads(WatchSource $source, int $limit): array
    {
        $key = config('services.youtube.api_key');
        if (! is_string($key) || trim($key) === '') {
            throw new RuntimeException('YOUTUBE_API_KEY is not configured.');
        }

        $channel = $this->get('channels', [
            'part' => 'contentDetails',
            'id' => $source->platform_channel_id,
        ], $key)['items'][0] ?? null;
        $playlistId = data_get($channel, 'contentDetails.relatedPlaylists.uploads');
        if (! is_string($playlistId) || $playlistId === '') {
            throw new RuntimeException('YouTube channel did not provide an uploads playlist.');
        }

        $items = $this->get('playlistItems', [
            'part' => 'snippet,contentDetails',
            'playlistId' => $playlistId,
            'maxResults' => min(50, max(1, $limit)),
        ], $key)['items'] ?? [];

        $ids = collect($items)
            ->map(fn (array $item) => data_get($item, 'contentDetails.videoId') ?: data_get($item, 'snippet.resourceId.videoId'))
            ->filter(fn ($id) => is_string($id) && preg_match('/^[A-Za-z0-9_-]{11}$/', $id))
            ->unique()->values()->all();
        if ($ids === []) {
            return [];
        }

        $details = $this->get('videos', [
            'part' => 'snippet,contentDetails,status',
            'id' => implode(',', $ids),
        ], $key)['items'] ?? [];

        return collect($details)->map(function (array $video): array {
            $snippet = $video['snippet'] ?? [];
            return [
                'youtube_video_id' => $video['id'] ?? null,
                'title' => $snippet['title'] ?? null,
                'description' => $snippet['description'] ?? null,
                'published_at' => $snippet['publishedAt'] ?? null,
                'duration' => data_get($video, 'contentDetails.duration'),
                'privacy_status' => data_get($video, 'status.privacyStatus'),
                'embeddable' => data_get($video, 'status.embeddable', true),
                'thumbnail_url' => $this->thumbnail($snippet['thumbnails'] ?? []),
            ];
        })->all();
    }

    /** @param array<string, scalar> $query
     *  @return array<string, mixed>
     */
    private function get(string $resource, array $query, string $key): array
    {
        $response = Http::acceptJson()
            ->timeout((int) config('watch.api_timeout_seconds', 20))
            ->get(self::BASE_URL.'/'.$resource, $query + ['key' => $key]);

        if (! $response->successful()) {
            throw new RuntimeException("YouTube API {$resource} request failed with HTTP {$response->status()}.");
        }

        $data = $response->json();
        if (! is_array($data)) {
            throw new RuntimeException("YouTube API {$resource} returned an invalid response.");
        }

        return $data;
    }

    /** @param array<string, array<string, mixed>> $thumbnails */
    private function thumbnail(array $thumbnails): ?string
    {
        foreach (['maxres', 'standard', 'high', 'medium', 'default'] as $size) {
            $url = $thumbnails[$size]['url'] ?? null;
            if (is_string($url) && str_starts_with($url, 'https://')) {
                return $url;
            }
        }

        return null;
    }
}
