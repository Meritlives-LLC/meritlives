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
     * Imports only RSS-provided summaries with attribution and source links.
     * New items are editorial drafts (pending); syncing an existing item must
     * not republish it or overwrite an editor-approved article body.
     */
    protected $signature = 'news:sync-rss {--dry-run : Show what would be imported without writing anything}';

    protected $description = 'Sync TechCrunch (general + AI) RSS feeds into the news table as editorial drafts';

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

                $news = News::where('external_id', $guid)->first();

                // Keep updates limited to feed metadata. In particular, never
                // change status or article content of an existing record.
                $attributes = [
                    'category_id' => $category->id,
                    'title' => $title,
                    'slug' => Str::slug($title).'-'.substr(md5($guid), 0, 8),
                    'excerpt' => $excerpt,
                    'source_name' => $feed['source_name'],
                    'source_url' => $link ?: $guid,
                    'image_url' => $imageUrl,
                    'published_at' => $publishedAt,
                    'featured' => false,
                ];

                if ($news) {
                    $news->update($attributes);
                    $updated++;
                } else {
                    $attributes['external_id'] = $guid;
                    $attributes['status'] = 'pending';
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
        $media = $item->children('media', true);
        if (isset($media->content) && (string) $media->content->attributes()->url) {
            return (string) $media->content->attributes()->url;
        }

        if (isset($item->enclosure) && (string) $item->enclosure->attributes()->url) {
            return (string) $item->enclosure->attributes()->url;
        }

        if (preg_match('/<img[^>]+src=["\\']([^"\\']+)["\\']/i', (string) $item->description, $m)) {
            return $m[1];
        }

        return null;
    }
}
