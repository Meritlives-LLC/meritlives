# MERITLIVES Namecheap Staging Plan

Status: local tests pass, but staging prerequisites remain. This is a deployment plan only; no package has been uploaded and no deployment has occurred.

## Candidate package contents

- Backend application source, `composer.json` and `composer.lock`; install production Composer dependencies on the target.
- Frontend source, `package.json` and `package-lock.json`; build with the target Node major version or an identical local runtime.
- Public assets and the verified release source files.
- Exclude populated `.env` files, local database dumps, `.git`, `node_modules`, local `vendor`, `.next*`, TypeScript build-info files, backups and logs. Include only a reviewed `.env.example` if useful; supply target-specific environment configuration through cPanel or protected server configuration.
- Keep the Laravel application outside the public document root and point the PHP site document root to `backend/public`.

## Required environment names

Laravel runtime: `APP_NAME`, `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL`, `LOG_CHANNEL`, `LOG_LEVEL`, `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `FRONTEND_URL`, `FILESYSTEM_DISK`, `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION`, and mail variables when mail is enabled.

Frontend: set `NEXT_PUBLIC_API_URL` to the public Laravel `/api/v1` endpoint and `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS frontend origin before building. `NEXT_PUBLIC_API_TIMEOUT_MS` is optional. `NEXT_DIST_DIR` is only an optional local build-isolation setting and should be unset for normal hosting.

Watch collection requires `YOUTUBE_API_KEY` and may use `WATCH_RECENT_DAYS`, `WATCH_MAX_VIDEOS_PER_SOURCE`, and `WATCH_API_TIMEOUT_SECONDS`. WordPress import variables (`WP_DB_*`, `WP_SITE_URL`, `WP_IMAGE_ALLOWED_HOSTS`, `WP_IMPORT_SOURCE_NAME`) are only for an explicitly approved import operation; do not schedule those imports. `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` are only relevant if an admin seeder is deliberately approved. Never put local or production secrets in a package.

## Staging gates

1. Confirm the actual cPanel plan supports a supported Node.js 22 or 24 LTS release (sharp requires at least 20.9), a persistent Next.js server process, the required startup entrypoint, and enough memory for this Next 15.5.28 app. Namecheap's current Next.js cPanel guide describes a custom `server.js`; the repository currently uses `next start`, so prove the chosen cPanel startup method on staging before release.
2. Confirm cPanel PHP is at least 8.3 for this Laravel 13 project and enable required extensions, including PDO MySQL, DOM, mbstring, fileinfo, OpenSSL, tokenizer, XML, cURL and ZIP. Confirm Composer and SSH/Terminal availability.
3. Create a separate staging MySQL database and credentials. Review schema/migrations against an empty disposable staging database before any migration. The existing local MySQL database has recorded all migrations as run while its Watch columns remain wider than the create migrations. Read-only checks found current maxima of 7/24/10 characters in `watch_sources.platform`/`platform_channel_id`/`category` and 11/78/10/6 in `watch_videos.youtube_video_id`/`slug`/`category`/`status`, which fit the current declared sizes. The new forward migration verifies every value before narrowing columns and aborts if one does not fit. It has only been exercised through isolated SQLite tests, not run against local MySQL; rehearse it against a backup of the staging schema before rollout.
4. Set production-mode values, a unique application key, debug off, HTTPS URLs, least-privilege database credentials, exact CORS frontend origin, secure cookies, mail transport and frontend public API/site URLs. Build the Next client with the staging API URL.
5. Configure Laravel's public storage link and writable `storage` and `bootstrap/cache` paths. Confirm upload limits, backups, TLS, log rotation and error visibility.
6. Configure cPanel cron to run Laravel `schedule:run` every minute. The scheduled RSS importer inserts new items as pending; the Watch collector inserts videos as inactive. Human review is required before publication. Do not enable AI generation or automatic publishing.
7. Verify `/up` and `/api/v1/health`, then independently check database-backed API routes, CORS preflight, login/admin authorization, published/draft visibility, contact/newsletter throttles, image loading, logs and mobile/desktop routes on staging.

## Rollback

Take a database backup and a copy of the current deployed files before switching traffic. Keep the previous frontend build and Laravel release directory available. Roll back by restoring the prior application directories and configuration, then restoring the database backup only if the release performed an approved schema/data change. A migration rollback is not automatically safe for MariaDB or destructive schema changes; review each migration's `down()` method and a staging restore before production.
