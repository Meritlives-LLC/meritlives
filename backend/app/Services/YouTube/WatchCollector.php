<?php

namespace App\Services\YouTube;

use App\Models\WatchSource;
use App\Models\WatchVideo;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class WatchCollector
{
    private const RELEVANT_TERMS = [
        'technology', 'tech', 'software', 'developer', 'programming', 'artificial intelligence', ' ai ',
        'machine learning', 'cybersecurity', 'cloud', 'data', 'digital', 'startup', 'founder', 'entrepreneur',
        'venture capital', 'fintech', 'business', 'innovation', 'leadership', 'investment', 'africa', 'nigeria',
        'african', 'podcast', 'interview', 'conversation', 'company', 'economy', 'blockchain', 'robotics',
    ];

    private const OBVIOUSLY_UNRELATED = ['official music video', 'full album', 'gameplay', 'game walkthrough', 'prank compilation'];

    public function __construct(private readonly YouTubeDataApi $api) {}

    /** @return array{sources: array<int, array<string, int|string>>, totals: array<string, int>} */
    public function collect(): array
    {
        $sources = [];
        $totals = ['found' => 0, 'new' => 0, 'updated' => 0, 'skipped' => 0, 'failed' => 0, 'successful_sources' => 0, 'failed_sources' => 0];
        $limit = min(50, max(1, (int) config('watch.max_videos_per_source', 30)));
        $cutoff = CarbonImmutable::now()->subDays(max(1, (int) config('watch.recent_days', 30)));

        WatchSource::query()->where('is_active', true)->where('platform', WatchSource::PLATFORM_YOUTUBE)
            ->orderBy('priority')->orderBy('id')->each(function (WatchSource $source) use (&$sources, &$totals, $limit, $cutoff): void {
                $stats = ['name' => $source->name, 'found' => 0, 'new' => 0, 'updated' => 0, 'skipped' => 0, 'failed' => 0];
                try {
                    foreach ($this->api->recentUploads($source, $limit) as $candidate) {
                        $stats['found']++;
                        $result = $this->persist($source, $candidate, $cutoff);
                        $stats[$result]++;
                    }
                } catch (Throwable $exception) {
                    $stats['failed']++;
                    Log::warning('Watch source collection failed.', [
                        'source_id' => $source->id,
                        'source_name' => $source->name,
                        'error_type' => $exception::class,
                    ]);
                }

                if ($stats['failed'] === 0) {
                    $totals['successful_sources']++;
                } else {
                    $totals['failed_sources']++;
                }

                foreach (['found', 'new', 'updated', 'skipped', 'failed'] as $key) {
                    $totals[$key] += $stats[$key];
                }
                $sources[] = $stats;
            });

        return compact('sources', 'totals');
    }

    /** @param array<string, mixed> $candidate
     * @return 'new'|'updated'|'skipped'
     */
    private function persist(WatchSource $source, array $candidate, CarbonImmutable $cutoff): string
    {
        $id = $candidate['youtube_video_id'] ?? null;
        $title = trim((string) ($candidate['title'] ?? ''));
        $published = $candidate['published_at'] ?? null;
        if (! is_string($id) || ! preg_match('/^[A-Za-z0-9_-]{11}$/', $id)
            || $title === '' || ($candidate['privacy_status'] ?? null) !== 'public'
            || ($candidate['embeddable'] ?? false) !== true
            || ! is_string($candidate['thumbnail_url'] ?? null)
            || ! $this->isYouTubeThumbnail($candidate['thumbnail_url'])
            || ! is_string($published)) {
            return 'skipped';
        }

        try {
            $publishedAt = CarbonImmutable::parse($published);
        } catch (Throwable) {
            return 'skipped';
        }
        if ($publishedAt->lt($cutoff) || $publishedAt->gt(CarbonImmutable::now()->addMinutes(5))) {
            return 'skipped';
        }

        $description = trim((string) ($candidate['description'] ?? ''));
        $text = mb_strtolower(" {$title} {$description} ");
        $durationSeconds = $this->durationSeconds((string) ($candidate['duration'] ?? ''));
        if ($durationSeconds === null || $this->isObviousShort($text, $durationSeconds) || $this->isIrrelevant($text)) {
            return 'skipped';
        }

        $existing = WatchVideo::query()->where('youtube_video_id', $id)->first();
        $relevance = $this->relevanceScore($source, $text, $publishedAt, $cutoff);
        $quality = $this->qualityScore($title, $description, $durationSeconds);
        $slug = $existing?->slug ?? $this->uniqueSlug($title, $id);
        $data = [
            'watch_source_id' => $source->id,
            'youtube_video_id' => $id,
            'title' => $title,
            'slug' => $slug,
            'description' => $description ?: null,
            'thumbnail_url' => $candidate['thumbnail_url'],
            'video_url' => 'https://www.youtube.com/watch?v='.$id,
            'category' => $source->category,
            'published_at' => $publishedAt,
            'duration' => (string) $candidate['duration'],
            'relevance_score' => $relevance,
            'quality_score' => $quality,
            'status' => $existing?->status ?? WatchVideo::STATUS_ACTIVE,
            'is_featured' => $existing?->is_featured ?? false,
        ];

        $video = $existing ?? new WatchVideo();
        $video->fill($data);
        if (! $video->isDirty()) {
            return 'skipped';
        }
        $video->save();

        return $existing ? 'updated' : 'new';
    }

    private function durationSeconds(string $duration): ?int
    {
        if (! preg_match('/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/', $duration, $matches)) {
            return null;
        }
        return ((int) ($matches[1] ?? 0) * 3600) + ((int) ($matches[2] ?? 0) * 60) + (int) ($matches[3] ?? 0);
    }

    private function isObviousShort(string $text, int $duration): bool
    {
        return $duration <= 180 && (str_contains($text, '#shorts') || str_contains($text, ' youtube shorts '));
    }

    private function isIrrelevant(string $text): bool
    {
        $relevant = collect(self::RELEVANT_TERMS)->contains(fn (string $term) => str_contains($text, $term));
        $unrelated = collect(self::OBVIOUSLY_UNRELATED)->contains(fn (string $term) => str_contains($text, $term));
        return $unrelated && ! $relevant;
    }

    private function isYouTubeThumbnail(string $url): bool
    {
        $parts = parse_url($url);
        return ($parts['scheme'] ?? null) === 'https'
            && in_array(strtolower($parts['host'] ?? ''), ['i.ytimg.com', 'img.youtube.com'], true);
    }

    private function relevanceScore(WatchSource $source, string $text, CarbonImmutable $publishedAt, CarbonImmutable $cutoff): float
    {
        $matches = collect(self::RELEVANT_TERMS)->filter(fn (string $term) => str_contains($text, $term))->count();
        $topicScore = min(100, $matches * 25);
        $categoryTerm = match ($source->category) {
            'technology' => ['technology', 'tech', 'software', 'developer', 'programming', 'cloud', 'cybersecurity', 'artificial intelligence'],
            'business' => ['business', 'startup', 'founder', 'entrepreneur', 'venture capital', 'fintech', 'investment'],
            'podcast' => ['podcast', 'interview', 'conversation'],
            'africa' => ['africa', 'african', 'nigeria', 'kenya', 'south africa'],
            default => [],
        };
        $categoryMatches = collect($categoryTerm)->contains(fn ($term) => str_contains($text, $term));
        if ($categoryMatches) {
            $topicScore = min(100, $topicScore + 25);
        }
        $ageDays = max(0, (now()->timestamp - $publishedAt->timestamp) / 86400);
        $windowDays = max(1, (now()->timestamp - $cutoff->timestamp) / 86400);
        $recencyScore = max(0, 100 * (1 - ($ageDays / $windowDays)));
        $priorityScore = match ((int) $source->priority) { 1 => 100, 2 => 70, default => 45 };
        return round(($recencyScore * 0.40) + ($topicScore * 0.35) + ($priorityScore * 0.25), 2);
    }

    private function qualityScore(string $title, string $description, int $duration): float
    {
        $score = 45 + (mb_strlen($title) >= 18 ? 15 : 0) + (mb_strlen($description) >= 120 ? 25 : (mb_strlen($description) >= 40 ? 15 : 0));
        $score += $duration >= 180 ? 15 : 0;
        return (float) min(100, $score);
    }

    private function uniqueSlug(string $title, string $id): string
    {
        $base = Str::slug($title) ?: 'watch-video';
        $base = mb_substr($base, 0, 170);
        $slug = $base;
        if (WatchVideo::query()->where('slug', $slug)->exists()) {
            $slug = mb_substr($base, 0, 155).'-'.Str::lower(mb_substr($id, 0, 11));
        }
        return $slug;
    }
}
