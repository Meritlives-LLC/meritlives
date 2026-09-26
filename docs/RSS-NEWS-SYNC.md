# Live tech news sync (TechCrunch)

`app/Console/Commands/SyncRssNews.php` pulls two feeds and upserts new
articles into `news`, keyed by the feed item's guid (stored in
`external_id`) so it's safe to run repeatedly:

- `https://techcrunch.com/feed/` — general tech news → Category: Technology
- `https://techcrunch.com/category/artificial-intelligence/feed/` → Category: Artificial Intelligence

## Run it manually

```bash
php artisan news:sync-rss --dry-run   # see what would be pulled first
php artisan news:sync-rss             # actually import
```

## Run it automatically

It's already scheduled hourly in `routes/console.php`. Laravel's scheduler
only fires if something calls it every minute — on a real server that's one
cron entry:

```
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

On Windows/local dev there's no cron, so either run `php artisan
news:sync-rss` manually whenever you want fresh articles, or set up a
Windows Task Scheduler task that runs `php artisan schedule:run` every
minute the same way cron would.

## Important: this only stores what TechCrunch's feed provides

Per [TechCrunch's RSS terms](https://techcrunch.com/rss-terms-of-use), only
the feed's own excerpt is stored (in `excerpt`) — `content` is left empty,
unlike the WordPress import. `source_name` and `source_url` always point
back to TechCrunch, and images are linked directly from TechCrunch's own
URLs rather than downloaded/re-hosted (unlike the WordPress import, where
you own the content). Don't change this to scrape and store full article
bodies from TechCrunch — that's outside what their RSS terms permit.

## Adding or changing feeds

Edit the `$feeds` array at the top of `SyncRssNews.php` — each entry needs
a feed `url`, a `source_name` (shown as attribution), and a `category`
name (created automatically if it doesn't exist). Any standard RSS 2.0 feed
works, not just TechCrunch.
