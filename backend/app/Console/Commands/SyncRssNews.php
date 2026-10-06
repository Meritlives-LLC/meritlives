<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\News;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SyncRssNews extends Command
{
    /**
     * php artisan news:sync-rss
     * php artisan news:sync-rss --dry-run
     *
     * Pulls TechCrunch's main feed and its Artificial Intelligence category
     * feed and upserts new items into the `news` table, keyed by the feed
     * item's guid/link (stored in `external_id`) so re-running is safe.
     *
     * IMPORTANT: TechCrunch's RSS terms (https://techcrunch.com/rss-terms-of-use)
     * only permit displaying what the feed itself provides, with attribution
     * and a link back to the full article — no scraping/re-hosting the full
     * article body, and no removing attribution. So unlike the WordPress
     * importer, this only stores the feed's own excerpt/summary in
     * `excerpt`, leaves `content` empty, and always keeps `source_name` and
     * `source_url` pointing at TechCrunch. Images are linked directly from
     * TechCrunch's own URLs rather than downloaded, for the same reason.
     */
    protected $signature = 'news:sync-rss {--dry-run : Show what would be imported without writing anything}';

    protected $description = 'Sync TechCrunch (general + AI) RSS feeds into the news table';

    /** @var array<int, array{url: string, source_name: string, category: string}> */
    private array $feeds = [
        [
            'url' => 'https://techcrunch.com/feed/',
            'source_name' => 'TechCrunch',
            'category' => 'Technology',
        ],
        [
            'url' => 'https://techcrunch.com/category/artificial-intelligence/feed/',
            'source_name' => 'TechCrunch',
            'category' => 'Technology',
        ],
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $created = 0;
        $updated = 0;
        $failed = 0;

        foreach ($this->feeds as $feed) {
            $this->info("Fetching {$feed['url']} ...");

            try {
                $response = Http::timeout(20)->get($feed['url']);
            } catch (\Throwable $e) {
                $this->error("Could not reach {$feed['url']}: {$e->getMessage()}");
                $failed++;

                continue;
            }

            if (! $response->successful()) {
                $this->error("{$feed['url']} returned HTTP {$response->status()}");
                $failed++;

                continue;
            }

            $xml = @simplexml_load_string($response->body(), 'SimpleXMLElement', LIBXML_NOCDATA);

            if ($xml === false || ! isset($xml->channel->item)) {
                $this->error("Could not parse RSS from {$feed['url']}");
                $failed++;

                continue;
            }

            $category = Category::firstOrCreate(
                ['slug' => Str::slug($feed['category'])],
                ['name' => $feed['category'], 'type' => 'news', 'status' => 'active']
            );

            $itemCount = 0;

            foreach ($xml->channel->item as $item) {
                $itemCount++;

                $link = trim((string) $item->link);
                $guid = trim((string) $item->guid) ?: $link;
                $title = trim((string) $item->title);

                if (! $guid || ! $title) {
                    continue;
                }

                $description = trim(strip_tags((string) $item->description));
                $excerpt = Str::limit($description, 400);

                $imageUrl = $this->extractImage($item);

                $publishedAt = null;
                if ((string) $item->pubDate) {
                    try {
                        $publishedAt = Carbon::parse((string) $item->pubDate);
                    } catch (\Throwable) {
                        $publishedAt = now();
                    }
                }

                if ($dryRun) {
                    continue;
                }

                $attributes = [
                    'category_id' => $category->id,
                    'title' => $title,
                    'slug' => Str::slug($title).'-'.substr(md5($guid), 0, 8),
                    'excerpt' => $excerpt,
                    'source_name' => $feed['source_name'],
                    'source_url' => $link ?: $guid,
                    'image_url' => $imageUrl,
                    'published_at' => $publishedAt,
                    'status' => 'published',
                    'featured' => false,
                ];

                $news = News::where('external_id', $guid)->first();

                if ($news) {
                    $news->update($attributes);
                    $updated++;
                } else {
                    $attributes['external_id'] = $guid;
                    News::create($attributes);
                    $created++;
                }
            }

            $this->info("  {$itemCount} item(s) in feed.");
        }

        if ($dryRun) {
            $this->info('Dry run complete — nothing was written.');

            return self::SUCCESS;
        }

        $this->info("Done. Created: {$created}, Updated: {$updated}, Feed failures: {$failed}.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function extractImage(\SimpleXMLElement $item): ?string
    {
        // media:content (common in TechCrunch's feed)
        $media = $item->children('media', true);
        if (isset($media->content) && (string) $media->content->attributes()->url) {
            return (string) $media->content->attributes()->url;
        }

        // enclosure tag
        if (isset($item->enclosure) && (string) $item->enclosure->attributes()->url) {
            return (string) $item->enclosure->attributes()->url;
        }

        // fall back to the first <img> found in the raw description HTML
        if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', (string) $item->description, $m)) {
            return $m[1];
        }

        return null;
    }
}
