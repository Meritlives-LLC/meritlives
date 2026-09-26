# Importing news from WordPress

`meritlives.com` is a curated tech/business news site (Technology, Business,
Digital Innovation categories), so its posts map to the `News` model. This
was added on top of the original 8 phases — here's exactly what changed and
how to run it.

## What was added

- **`database/migrations/2026_09_25_000001_add_content_to_news_table.php`**
  — the original `news` table only stored `excerpt` (it was designed for
  short blurbs pointing at an external `source_url`). Full WordPress article
  bodies need a `content` column, so this adds one without touching existing
  data.
- **`app/Console/Commands/ImportWordPressNews.php`** — reads published posts
  directly from the WordPress database (title, content, excerpt, category,
  featured image, publish date) and upserts them into `news`, keyed by the
  WordPress post ID (stored in `external_id`) so it's safe to re-run. Since
  WordPress is being decommissioned, this **downloads the featured image and
  every inline `<img>` in the post body into local storage** and rewrites
  the content to point at the local copies — nothing depends on the old
  WordPress server staying online after import. Pass `--no-images` if you'd
  rather keep the original WordPress image URLs (only sensible if WordPress
  is staying up).
- **`config/database.php`** — a new `wordpress` connection, configured
  entirely through `WP_DB_*` env vars, so this works whether WordPress is on
  the same MySQL server or a different one.
- **`app/Http/Resources/NewsResource.php`** — now includes `content` on the
  single-item (`/api/v1/news/{slug}`) response; left out of the list
  response to keep pagination payloads light.
- **`app/Filament/Resources/NewsResource.php`** — added a rich text editor
  field for `content`, so imported articles are actually editable in
  `/admin`, not just sitting in the database.
- **Frontend**: `types/api.ts` gained an optional `content` field, and
  `app/news/[slug]/page.tsx` now renders it (as HTML, since WordPress stores
  formatted content) using Tailwind's typography plugin
  (`@tailwindcss/typography`, added to `package.json` and registered in
  `app/globals.css`).

## Running the import

Add to your `backend/.env` (adjust to your actual WordPress DB):

```
WP_DB_HOST=127.0.0.1
WP_DB_PORT=3306
WP_DB_DATABASE=wordpress_db_name
WP_DB_USERNAME=root
WP_DB_PASSWORD=
WP_DB_PREFIX=wp_
WP_SITE_URL=https://meritlives.com
WP_IMPORT_SOURCE_NAME=MERITLIVES
```

`WP_DB_PREFIX` is whatever your WordPress tables are prefixed with — check
via `SHOW TABLES;` in that database (default is `wp_`, but many hosts
randomize it, e.g. `wp7x2a_`).

Then run the migration and a dry run first:

```bash
php artisan migrate
php artisan news:import-wordpress --dry-run --limit=5
```

If that looks right, drop `--dry-run` and `--limit` to import everything:

```bash
php artisan news:import-wordpress
```

It's idempotent — running it again only updates existing rows (matched by
WordPress post ID) and adds new ones, so it's safe to re-run after
publishing new WordPress posts later, or to fix a mapping and re-import.

## Known simplifications (check these against the real data)

- **`source_name`** is set to a single fixed value (`WP_IMPORT_SOURCE_NAME`,
  default `MERITLIVES`) for every imported post. The WordPress posts often
  reference a different original source in the body text (e.g. "reported by
  ChiniMandi") — the importer doesn't try to parse that out of free text, so
  if per-article attribution matters, that's a manual cleanup pass in
  `/admin` after import, not something this command guesses at.
- **Categories** are matched/created by `Str::slug($categoryName)` alone.
  WordPress posts with multiple categories only get the first one found —
  the `news` table has a single `category_id`, not a many-to-many
  relationship, so this is a schema constraint, not a bug in the command.
- **Images are downloaded once, on import.** If a download fails (dead
  link, timeout, WordPress already offline for that one asset), the command
  leaves the original WordPress URL in place for that image and prints it
  in a warning list at the end so you can re-run the command later or fix
  it manually — it does not silently drop the image.
- **`source_url` still points at the old WordPress permalink**
  (`https://meritlives.com/{slug}/`). If the new site takes over the same
  `meritlives.com` domain, that URL will resolve to *this* site once
  WordPress is gone — which means the "Source" link shown on each news
  page may point at a URL that no longer matches the article shown there
  (unless you add a redirect from the old WordPress permalink structure to
  `/news/{slug}` on the new site, or a 404 if it doesn't match anything at
  all). Worth deciding before cutover: either set up redirects, or change
  what `source_url` means for self-published content (e.g. point it at the
  new site's own `/news/{slug}` URL instead of the old WordPress one — ask
  if you want that behavior and I'll adjust the importer).
- **Content is imported as raw WordPress HTML**, including whatever the
  WordPress theme/page builder embedded (e.g. shortcodes that don't render
  outside WordPress, if any were used). Spot-check a few imported articles
  in `/admin` for stray shortcode text before publishing.
