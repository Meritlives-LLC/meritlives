# External News Discovery and Rewrite Workflow

## Workflow

1. An administrator configures an RSS source, associates active `news` categories, and enables it.
2. Feed refreshes create `news_discoveries` records only. They retain source attribution, the feed identifier, the original publication date, retrieval time, and the feed-provided excerpt. Repeated source identities are ignored; canonical duplicates and records already in `news` are marked duplicate.
3. An authorized editor explicitly requests a rewrite. The request uses the existing AI Studio provider binding and, when present, the active prompt template with slug `news-rewrite`. Output is schema-validated, plain-text paragraphs are safely encoded, and factual uncertainties are retained in structured metadata.
4. An editor edits and approves or rejects the rewrite. Approval does not publish or create editorial content.
5. An authorized editor explicitly creates either a pending News record or a Blog draft. Both remain unpublished and public APIs/search continue to expose only `published` records.
6. Image requests are separate AI jobs. An image must be generated and approved independently, then explicitly attached to the saved draft.

The existing `news:sync-rss` command and hourly schedule retain their pending-News workflow for the fixed TechCrunch feeds. It now uses the shared safe XML parser and skips already-published records. The new `news:discover` schedule handles only enabled configured sources and never calls an AI provider. This preserves legacy moderation while preventing the new discovery queue from overwriting existing editorial items.

## Configuration

- `NEWS_DISCOVERY_ALLOWED_HOSTS`: comma-separated exact hostnames for HTTPS RSS feed URLs. Leave empty to disable external fetching. Redirects are not followed; IP literals, credentials in URLs, non-HTTPS URLs, and unlisted hosts are rejected.
- `AI_STUDIO_ENABLED`: remains false by default.
- `AI_STUDIO_PROVIDER`: remains `none` by default. A real provider adapter is not configured by this change; the standard local interface must report rewriting unavailable until one is explicitly implemented and configured.

RSS source excerpts only are supplied to the rewrite adapter. The system does not scrape linked articles or fetch article images. Review source terms and permitted use before enabling any source.

## Migrations and local test setup

New migration: `2026_10_18_000003_create_news_discovery_tables.php`. It creates source/category associations, discovery records and append-only discovery events, adds structured metadata to AI jobs, and adds SEO fields to News. It uses foreign keys, source-scoped unique identity/canonical URL indexes, and retains matched category names as snapshots. It is intentionally forward-only to preserve provenance and audit history, and has **not** been run as part of the implementation task.

For later rehearsal, point Laravel to a newly created disposable loopback database (not the existing `meritlives` database), verify the effective database name/host before each write, then run `php artisan migrate --force` and `php artisan db:seed --class=RolesAndPermissionsSeeder --force`. Tests in `phpunit.xml` use SQLite `:memory:` and do not need MySQL.

Admin pages are under Filament's `AI Studio` navigation group: `External News Sources`, `News Discovery Queue`, and the existing `Generation Jobs` / prompt-template resources.
