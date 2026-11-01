# MERITLIVES pre-deployment audit

Audit date: 2026-10-31. Scope: current working tree, local dependencies, security-sensitive application paths, migration source and repository deployment configuration. No push, deployment, production access or migration against an existing database was performed.

## Release decision

**NOT READY for the combined controlled GitHub push and production deployment.** Source can be prepared for a reviewed push after staging the intended files and checking the staged diff. Production deployment remains blocked by unverified hosting/runtime support, MySQL migration rehearsal, publication/permissions rollout and the checks below. Local acceptance results do not prove production compatibility.

This is a source/configuration audit and local regression run, not a penetration test or certification of the unseen hosting environment. Existing unrelated changes have been preserved. No verified Critical or High application vulnerability requiring a safe code fix was identified in the reviewed paths. Dependency findings remain open at Medium severity.

## Security findings and controls

| Severity | Finding / evidence | Disposition |
| --- | --- | --- |
| Critical | None verified in this audit. | No security controls relaxed. |
| High | None verified in reviewed application paths or dependency audit results. | Hosting and release gates still apply. |
| Medium | Composer locked audit reports `symfony/mime`, CVE-2026-45070 / GHSA-vqc8-7275-q272: email header injection through non-token MIME parameter names. | Update to a compatible patched release in a separate validated dependency change; audit identifies 7.4.22 as the patched 7.4 boundary. No untrusted parameter-name path was established here. Do not describe dependencies as clean. |
| Medium | Full npm audit reports 18 moderate package findings, rooted in minimatch globparts amplification (GHSA-g3hv-75wg-m249), propagated through ESLint and related tools. | Treat as development/build exposure. Do not run forced automatic fixes: suggested major downgrades are unsuitable. Validate a tooling upgrade separately and avoid untrusted glob input in CI. |
| Medium | `frontend/app/api/editorial-search/route.ts` has input bounds but no local rate limiter; backend throttles see the Next server IP. | Configure edge throttling for this route and confirm forwarded-IP topology. Shared backend-IP throttling can cause search availability issues. Never trust arbitrary forwarded headers. |
| Medium | Legacy scheduled `SyncRssNews` downloads the response body without a byte cap and uses default redirect behavior, unlike the newer bounded News Discovery fetcher. Source URLs are fixed, so arbitrary user-controlled SSRF was not demonstrated. | Bound downloads/redirects in a future focused change or leave cron disabled until outbound behavior and feed reliability are validated. |
| Low | Generated `.next.*` directories, TypeScript caches, PHPUnit XML reports and a manual billable API probe were untracked and eligible for accidental inclusion. | Added ignore rules; files retained locally. Ignoring does not protect already tracked or force-added files. |
| Low | HSTS is opt-in on Laravel and absent from Next response configuration; no application CSP is configured. | Verify TLS and set appropriate headers at the actual edge. Introduce CSP with browser validation; do not blindly enable a restrictive policy that breaks Filament. |

Authentication/authorization: `User::canAccessPanel` requires an application role. Filament middleware includes session authentication and CSRF. `UsesResourcePermissions` checks each resource action; Blog additionally scopes ownership and reserves approval/publication fields to reviewers server-side. About editing requires admin/super_admin plus `manage_settings`. Validate actual role assignments after the targeted permissions rollout; source permissions are not proof existing accounts have appropriate grants.

API: public routes expose reads plus validated contact/newsletter submissions, not public AI generation or publication endpoints. Public reads/search/contact/newsletter have named limits (120/30/5/10 per minute per IP); health is unthrottled. CORS allows configured frontend and canonical site origins, credentials disabled. CORS is not authorization. Confirm persistent shared cache/locks and trusted proxy IPs in production.

Uploads: `RasterUpload` validates server MIME, extension, raster dimensions (40 MP ceiling), size (5 MiB), known directories and UUID filenames. SVG is excluded. Generated images additionally enforce byte/pixel limits, decode and re-encode via GD, crop and strip original metadata. Private previews enforce type, ownership, article context, expiry, safe path, size and integrity and return private/no-store. Legacy AI Studio previews require `view_ai_studio`. Configure the server to deny executable handling in public uploads; public media is intentionally readable. Never expose `storage/app/private`.

AI: generation checks role/resource access and `manage_media`, feature flag, schema prerequisite, per-user lock, minute/day limits and both administrator enablement and editor cost authorization for billable images. Provider endpoint is fixed HTTPS, returned data is bounded and errors are sanitized. Article AI application resets publication to draft/pending and clears approval. Keep all AI flags disabled initially; validate provider/model entitlement and timeouts on staging before separately authorizing paid generation. No live provider call was made.

Publication: News public scope requires published status and a nonfuture publication date. Blog additionally requires `is_public_approved`. Review API/search/related-content results in staging. RSS preserves published editorial copy and imports new stories as pending; Watch collection creates inactive videos. Do not bypass approval to restore visibility.

Secrets: scanned Git-tracked and nonignored candidate text files for OpenAI/GitHub/AWS key formats, private-key headers and credential-like assignments; no real credential found. One long assignment was a test fixture. `.env` and `.env.local` remain ignored; tracked `frontend/.env.production` contains public API/site URLs only. No secret values are reproduced here. This does not certify Git history, ignored directories, screenshots or unknown credential formats. Inspect staged files, evidence images and any history before push. Never include local storage, database dumps, populated environment files or logs in a release archive. `backend/test-openai.php` reads a real key and can incur a charge; it is now ignored and must stay out of the release.

## Media migration review

File: `database/migrations/2026_10_31_000001_add_ai_metadata_to_media.php`.

- `up()` alters only `media`, adding nullable JSON `metadata`, with no explicit default, index, foreign key, backfill or row deletion. Existing columns, IDs, paths, files and rows are preserved; existing records receive SQL NULL. `Media` casts metadata to an array and permits assignment.
- Expected MySQL statement: `ALTER TABLE media ADD metadata JSON NULL`. Existing schema must contain `media` and must not already contain an unmanaged `metadata` column. Determine this using read-only schema inspection on the authorized target, not by trying the migration.
- Native JSON requires MySQL 5.7.8+; the production baseline should satisfy the framework/database requirements, preferably a maintained MySQL 8.x deployment. MariaDB has different JSON/DDL semantics: test the exact version rather than treating it as MySQL-equivalent.
- Adding a nullable column may be instant on supported InnoDB/MySQL versions but this migration does not force an algorithm. Table rebuild, disk usage and metadata-lock waits depend on engine/version/table/transactions. Zero downtime is **not** confirmed. Rehearse on an isolated restored copy, measure duration and disk use, then select a maintenance window.
- `down()` drops only `metadata`; media rows/files remain but AI provenance/disclosure/job associations stored there are lost. Disable AI before rollback. Prefer leaving this additive column in place while restoring prior application code. If schema rollback is necessary, export provenance first and execute only the specifically reviewed migration rollback, never a blind whole-batch rollback.
- Before any DDL: take a full consistent database backup including the migrations ledger and media table, copy public/private media and protected environment configuration, record the current release, verify backup integrity and restore into a disposable database. MySQL DDL is not protected by an application transaction in the same way as ordinary row changes.

Other pending migrations must be reviewed as a set: Watch length alignment checks data before narrowing columns; AI Studio and News Discovery add tables; taxonomy migration activates/inserts categories and retires legacy labels, with a no-op down method; Blog approval adds an indexed false-default field. **Existing published Blog posts become ineligible until explicitly approved.** Capture a publication inventory and have an authorized reviewer decide approval. Do not seed content or bulk-approve everything. Determine pending migrations from the actual target ledger during a later authorized deployment session. SQLite tests do not establish MySQL DDL safety.

References: [MySQL online DDL](https://dev.mysql.com/doc/refman/8.0/en/innodb-online-ddl.html), [MySQL DDL operations](https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html).

## Production compatibility and outstanding gates

Repository evidence: `DEPLOYMENT.md`, `DEPLOYMENT-CHECKLIST.md`, `docs/NAMECHEAP-STAGING-PLAN.md`, `CI-EXAMPLE.yml`, Composer/npm locks, Laravel/Next configs and Apache public `.htaccess`. There is no proven live server inventory, active CI deployment workflow, reverse-proxy configuration or persistent Node process definition. `CI-EXAMPLE.yml` at repository root is an example, not a GitHub Actions workflow.

| Area | Required / observed | Gate |
| --- | --- | --- |
| PHP/Laravel | Root and installed Laravel require PHP ^8.3; local PHP is 8.4.25. Exact locked dependencies may impose a stricter effective floor. Composer non-dev local platform check passed, with ctype/mbstring supplied by polyfills. | Run `composer check-platform-reqs --no-dev` on target with target CLI and web PHP; require native mbstring, PDO/pdo_mysql, fileinfo, GD (JPEG/PNG/WebP), cURL, DOM/XML/SimpleXML/XMLReader, intl, OpenSSL, tokenizer, session, filter, hash, iconv and ZIP as applicable. Do not rely on platform-ignore options. |
| Memory/time | Image processing exhausted the local full suite at PHP 128M. | Test GD workload under actual per-request limits; 512M is the audit test setting, not a measured minimum. Allow memory for simultaneous requests. Align PHP/proxy/worker limits with the 120s image provider timeout. |
| Node/Next | Next 15.5.28, React 19.2.9, sharp 0.35.5; Node >=20.9 declared; local Node 22.23.1. | Use a supported Node 22/24 runtime, confirm native sharp installation on target OS, build RAM and persistent process support. Build on Linux target/CI; do not ship Windows node_modules. |
| Hosting entrypoint | npm start runs `next start`; no custom Passenger server is supplied. | Prove the actual host supports this startup mode or implement/test its required entrypoint. [Namecheap guide](https://www.namecheap.com/support/knowledgebase/article.aspx/10686/29/how-to-deploy-reactjs-vitejs-react-native-and-nextjs-applications-in-cpanel/) describes custom server.js. Static-only hosting is insufficient. |
| Database | MySQL configured; migrations use JSON, indexes and column changes. | Verify actual version, table definitions, pending ledger, strict mode/collation and restored-copy migration rehearsal. Existing database was not touched. |
| Filesystem | public disk under storage/app/public; private previews under storage/app/private; public/storage symlink. | Writable storage and bootstrap/cache owned by the service account; no blanket 777; private paths outside document root; public uploads non-executable; backups and disk quotas verified. |
| Images | Next image optimizer and GD required. Remote backend patterns only allow HTTPS meritlives.com/www/api origins under /storage/**; YouTube thumbnails also allowed. | A different staging hostname requires a deliberate config change. Verify image optimizer and symlinks on host. Build needs outbound Google Fonts access. |
| API/SSL | Laravel document root must be backend/public; Apache rewrite config exists. Next points to /api/v1. | Configure TLS/redirects on both origins, API rewrites, exact proxy trust, secure cookies and CORS. Verify headers at edge, including static media. No SSL certificate or live routing was checked. |
| Scheduling/cache | RSS hourly; News Discovery/Watch six-hourly; image cleanup every ten minutes. | Confirm cron, shared persistent cache/locks and queue worker if database queue is used. Review scheduled imports before enabling cron; empty News Discovery host allowlist fails closed. |

Environment checklist: set protected `APP_ENV=production`, `APP_DEBUG=false`, existing stable `APP_KEY`, canonical HTTPS `APP_URL`/`FRONTEND_URL`, least-privilege DB settings, production mail, log level/rotation, `FILESYSTEM_DISK=public`, persistent `CACHE_STORE`, session/queue settings, `SESSION_SECURE_COOKIE=true`, `SESSION_HTTP_ONLY=true`, `SESSION_SAME_SITE=lax`. Set exact `TRUSTED_PROXIES`; enable `SECURITY_HSTS_ENABLED` only after TLS verification. Public build variables: `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`; unset `NEXT_DIST_DIR` for normal release builds. Never put a key/password in NEXT_PUBLIC variables. Supply AI/YouTube/news source secrets only if the feature is deliberately enabled. WordPress credentials and admin seed credentials are not normal runtime requirements.

Package `content/about.json` alongside backend/frontend: About defaults depend on repository content. Preserve public illustration/product/service assets and source fixtures needed by tests. Preserve `.env.example` with blank credentials. Do not run `composer setup` in production: it generates a key, migrates and seeds. Do not follow the unconditional `key:generate` in the older deployment document for an existing installation: it invalidates encrypted data/sessions.

## Git change review

Intended application groups include About CMS/content and UI; AI Editorial/Feature Images; AI Studio and News Discovery; permission/publication/HTML/upload/remote-image hardening; Watch corrections; newsletter/contact/search; legal pages; product/service catalogue and illustrations; homepage/header/footer/editorial presentation; associated tests, docs and dependency locks. These span earlier work and must not be reduced to an image-only release. `Hero.tsx` deletion accompanies its replacement by newer story/home components. Review modified historical Watch migrations together with the forward alignment migration; editing an already-recorded migration alone does not update a database.

Audit changes are this report and `.gitignore` exclusions only. Generated build output, XML reports, TypeScript caches and manual API probe remain locally preserved. Browser tests and deliberately retained acceptance screenshots are review evidence, not runtime dependencies; inspect screenshots before committing. Do not blindly add ignored artifacts with `git add -f`. `next-env.d.ts` is generated and `tsconfig.json` has accumulated local build-directory includes; omit audit-only generated changes from staging. A file inventory is appended below; individual public images are assets, not assumed disposable artifacts.

## Regression evidence

| Check | Result |
| --- | --- |
| Full backend PHPUnit suite | PASS: 128 tests, 991 assertions, PHP 8.4.25, 2m08s; `EDITORIAL_MEMORY_ONLY=1`, testing/sqlite/:memory:, empty DB_URL, non-SQLite connectors blocked, stray HTTP prohibited. Used `-d memory_limit=512M -d extension=pdo_sqlite -d extension=sqlite3 -d extension=gd`. First 128M attempt aborted in GD processing; it is not counted as a passing run. |
| Frontend production build | PASS: Next 15.5.28, compilation, lint/type checks, page generation and traces; isolated `.next.pre-deployment-audit`, production API/site variables explicitly supplied. Initial sandbox run could not download fonts; rerun with network permission succeeded. This is a local build, not proof target hosting works. |
| Frontend forms | PASS: `npm run test:forms`, 34/34 tests. |
| Composer non-dev platform | PASS locally; extensions specific to application features still require target verification. |
| Composer locked audit | OPEN: one Medium Symfony Mime advisory; no abandoned packages reported. |
| npm full audit | OPEN: 18 moderate development-tooling package findings, zero High/Critical. |
| npm production audit | PASS: `npm audit --omit=dev --json`, zero vulnerabilities reported. |
| Git whitespace | PASS: final `git diff --check`. CRLF normalization warnings are informational. |
| Candidate secret patterns | No real credential detected; limitations documented above. |

Existing reported 75 image / 73 editorial browser checks and prior About acceptance results are historical evidence supplied with the request, not rerun here. Browser suites were not repeated because audit edits do not change UI behavior. Audit-generated TypeScript include was removed after building; earlier user-authored/generated includes were preserved. Advisory reference: [Symfony CVE-2026-45070](https://symfony.com/cve-2026-45070).

## Eventual deployment commands (NOT executed)

These commands assume a reviewed release copied to `/srv/meritlives/releases/RELEASE`, a working host process manager, protected target `.env`, shared persistent storage already attached and backups restored successfully in rehearsal. Substitute the real release/database paths before authorization. Do not run against an existing database until all gates are closed. Do not point staging at production DB or secrets.

```bash
# Review locally before a separately authorized push; deliberately no push command here.
git status --short
git diff --check
git diff --stat
# Stage reviewed source paths explicitly, then:
git diff --cached --check
git diff --cached --stat
git diff --cached

# Target preflight, no schema mutation:
cd /srv/meritlives/releases/RELEASE/backend
php -v
php -m
composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
composer check-platform-reqs --no-dev
composer audit --locked
php artisan migrate:status
php artisan migrate --pretend --force

# Protected backup location, credentials in an operator-managed login path:
umask 077
mysqldump --login-path=meritlives-backup --single-transaction --routines --triggers --events --hex-blob --result-file=/secure-backups/pre-release.sql meritlives
tar -czf /secure-backups/pre-release-media.tgz -C /srv/meritlives/shared storage
# Also back up protected .env and previous release/process config using secure host tooling.
# Restore SQL/media on a disposable database/host and verify before continuing.

# Only after backup, rehearsal, pending migration review and maintenance authorization:
php artisan down --retry=60
php artisan migrate --force
php artisan db:seed --class=RolesAndPermissionsSeeder --force
php artisan permission:cache-reset
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache

cd ../frontend
node --version
npm ci
npm audit --omit=dev
NEXT_PUBLIC_API_URL=https://api.meritlives.com/api/v1 NEXT_PUBLIC_SITE_URL=https://www.meritlives.com npm run build
# Restart PHP and the managed Next process using the host's verified commands.
# Switch to the release atomically using the verified hosting procedure.
cd ../backend
php artisan queue:restart
php artisan up
curl --fail https://api.meritlives.com/up
curl --fail https://api.meritlives.com/api/v1/health
curl --fail -I https://www.meritlives.com/
```

The targeted role seeder synchronizes role permissions; review its exact grants and existing custom grants first. Do not run DatabaseSeeder/ContentSeeder in production. Key generation is only for a brand-new installation with no encrypted data. Never clear a shared application cache blindly during migration: it may hold locks/rate counters.

After switching, verify database-backed published/draft/approval visibility, reviewer/author boundaries, About, CORS, login/CSRF, uploads, optimizer, contact/newsletter and logs. Enable cron only after approving scheduled tasks. A green health response alone does not establish DB readiness. Actual cPanel restart/cutover commands remain a blocker because the host configuration is unavailable; do not invent them or run `npm start` as an unmanaged production process.

## Backup and rollback

Retain previous application release and frontend build, DB schema/data/ledger, protected key/config and shared public/private media. Verify the restore before launch and define who can authorize it. On failure: disable generation/schedulers and writes, put the site in maintenance, restore previous code and process config, rebuild caches for that release and smoke test before reopening. Leave additive metadata in place if compatible. Do not automatically run `migrate:rollback`: the batch can include unrelated and destructive migrations, taxonomy down does not reverse data changes, and dropping approval can expose content in old code. Restore a database snapshot only with explicit data-loss reconciliation for writes since backup; restore matching media. Keep AI disabled until provenance and permissions are verified again.

## Candidate file inventory

Git status after artifact exclusions (all entries preserved; M=modified, D=deleted, ??=untracked). Generated folders and reports excluded above remain on disk. This inventory identifies release candidates, not an instruction to stage every file.

```text
 M .gitignore
 M backend/.env.example
 M backend/app/Console/Commands/ImportWordPressNews.php
 M backend/app/Console/Commands/SyncRssNews.php
 M backend/app/Filament/Resources/BlogPostResource.php
 M backend/app/Filament/Resources/BlogPostResource/Pages/CreateBlogPost.php
 M backend/app/Filament/Resources/BlogPostResource/Pages/EditBlogPost.php
 M backend/app/Filament/Resources/CategoryResource.php
 M backend/app/Filament/Resources/ContactMessageResource.php
 M backend/app/Filament/Resources/MediaResource.php
 M backend/app/Filament/Resources/NewsResource.php
 M backend/app/Filament/Resources/NewsResource/Pages/CreateNews.php
 M backend/app/Filament/Resources/NewsResource/Pages/EditNews.php
 M backend/app/Filament/Resources/NewsletterSubscriberResource.php
 M backend/app/Filament/Resources/ProductResource.php
 M backend/app/Filament/Resources/ServiceResource.php
 M backend/app/Filament/Resources/SettingResource.php
 M backend/app/Filament/Resources/TagResource.php
 M backend/app/Filament/Resources/WatchSourceResource.php
 M backend/app/Filament/Resources/WatchVideoResource.php
 M backend/app/Http/Controllers/Api/V1/BlogController.php
 M backend/app/Http/Controllers/Api/V1/CategoryController.php
 M backend/app/Http/Controllers/Api/V1/NewsController.php
 M backend/app/Http/Controllers/Api/V1/ProductController.php
 M backend/app/Http/Controllers/Api/V1/SearchController.php
 M backend/app/Http/Controllers/Api/V1/ServiceController.php
 M backend/app/Http/Controllers/Api/V1/WatchController.php
 M backend/app/Http/Middleware/SecurityHeaders.php
 M backend/app/Http/Resources/BlogPostResource.php
 M backend/app/Http/Resources/NewsResource.php
 M backend/app/Http/Resources/ProductResource.php
 M backend/app/Http/Resources/ServiceResource.php
 M backend/app/Models/BlogPost.php
 M backend/app/Models/Media.php
 M backend/app/Models/News.php
 M backend/app/Models/WatchVideo.php
 M backend/app/Providers/AppServiceProvider.php
 M backend/app/Providers/Filament/AdminPanelProvider.php
 M backend/app/Services/SearchService.php
 M backend/app/Services/YouTube/WatchCollector.php
 M backend/bootstrap/app.php
 M backend/config/cors.php
 M backend/config/session.php
 M backend/database/migrations/2026_10_08_000001_create_watch_sources_table.php
 M backend/database/migrations/2026_10_08_000002_create_watch_videos_table.php
 M backend/database/seeders/ContentSeeder.php
 M backend/database/seeders/RolesAndPermissionsSeeder.php
 M backend/routes/api.php
 M backend/routes/console.php
 M backend/routes/web.php
 M backend/tests/Feature/WatchCollectorTest.php
 M backend/tests/TestCase.php
 M frontend/app/about/page.tsx
 M frontend/app/about/team/page.tsx
 M frontend/app/blog/[slug]/page.tsx
 M frontend/app/blog/page.tsx
 M frontend/app/globals.css
 M frontend/app/layout.tsx
 M frontend/app/news/[slug]/page.tsx
 M frontend/app/news/page.tsx
 M frontend/app/page.tsx
 M frontend/app/products/[slug]/page.tsx
 M frontend/app/products/page.tsx
 M frontend/app/search/page.tsx
 M frontend/app/services/[slug]/page.tsx
 M frontend/app/services/page.tsx
 M frontend/app/watch/page.tsx
 M frontend/components/BlogList.tsx
 M frontend/components/ContactForm.tsx
 D frontend/components/Hero.tsx
 M frontend/components/HomeSections.tsx
 M frontend/components/NewsList.tsx
 M frontend/components/NewsletterForm.tsx
 M frontend/components/ProductsList.tsx
 M frontend/components/ServicesList.tsx
 M frontend/components/SiteFooter.tsx
 M frontend/components/SiteHeader.tsx
 M frontend/components/WatchVideoGrid.tsx
 M frontend/lib/api.ts
 M frontend/lib/news-presentation.ts
 M frontend/lib/queries.ts
 M frontend/next-env.d.ts
 M frontend/next.config.mjs
 M frontend/package-lock.json
 M frontend/package.json
 M frontend/tsconfig.json
 M frontend/types/api.ts
?? backend/app/Console/Commands/CleanupFeatureImagePreviews.php
?? backend/app/Console/Commands/DiscoverNews.php
?? backend/app/Console/Commands/ImportNewsImagesFromBackup.php
?? backend/app/Console/Commands/RehostBlogImages.php
?? backend/app/Filament/Pages/ManageAboutPage.php
?? backend/app/Filament/Resources/AiAuditEventResource.php
?? backend/app/Filament/Resources/AiAuditEventResource/Pages/ListAiAuditEvents.php
?? backend/app/Filament/Resources/AiGenerationJobResource.php
?? backend/app/Filament/Resources/AiGenerationJobResource/Pages/CreateAiGenerationJob.php
?? backend/app/Filament/Resources/AiGenerationJobResource/Pages/ListAiGenerationJobs.php
?? backend/app/Filament/Resources/AiGenerationJobResource/Pages/ViewAiGenerationJob.php
?? backend/app/Filament/Resources/AiPromptTemplateResource.php
?? backend/app/Filament/Resources/AiPromptTemplateResource/Pages/CreateAiPromptTemplate.php
?? backend/app/Filament/Resources/AiPromptTemplateResource/Pages/EditAiPromptTemplate.php
?? backend/app/Filament/Resources/AiPromptTemplateResource/Pages/ListAiPromptTemplates.php
?? backend/app/Filament/Resources/Concerns/HasEditorialAssistant.php
?? backend/app/Filament/Resources/Concerns/HasFeatureImageAssistant.php
?? backend/app/Filament/Resources/Concerns/UsesResourcePermissions.php
?? backend/app/Filament/Resources/NewsDiscoveryResource.php
?? backend/app/Filament/Resources/NewsDiscoveryResource/Pages/ListNewsDiscoveries.php
?? backend/app/Filament/Resources/NewsDiscoveryResource/Pages/ViewNewsDiscovery.php
?? backend/app/Filament/Resources/NewsSourceResource.php
?? backend/app/Filament/Resources/NewsSourceResource/Pages/CreateNewsSource.php
?? backend/app/Filament/Resources/NewsSourceResource/Pages/EditNewsSource.php
?? backend/app/Filament/Resources/NewsSourceResource/Pages/ListNewsSources.php
?? backend/app/Http/Controllers/Admin/AiStudioImagePreviewController.php
?? backend/app/Http/Controllers/Admin/FeatureImagePreviewController.php
?? backend/app/Http/Controllers/Api/V1/AboutPageController.php
?? backend/app/Http/Middleware/TrustedProxies.php
?? backend/app/Models/AiAuditEvent.php
?? backend/app/Models/AiGenerationJob.php
?? backend/app/Models/AiPromptTemplate.php
?? backend/app/Models/NewsDiscovery.php
?? backend/app/Models/NewsDiscoveryEvent.php
?? backend/app/Models/NewsSource.php
?? backend/app/Services/AboutPageContent.php
?? backend/app/Services/AiEditorial/EditorialAssistant.php
?? backend/app/Services/AiEditorial/EditorialProvider.php
?? backend/app/Services/AiEditorial/MockEditorialProvider.php
?? backend/app/Services/AiEditorial/ResponsesEditorialProvider.php
?? backend/app/Services/AiImages/FeatureImageService.php
?? backend/app/Services/AiImages/ImageException.php
?? backend/app/Services/AiImages/ImageProcessor.php
?? backend/app/Services/AiImages/ImagePromptBuilder.php
?? backend/app/Services/AiImages/ImageProvider.php
?? backend/app/Services/AiImages/MockImageProvider.php
?? backend/app/Services/AiImages/OpenAiImageProvider.php
?? backend/app/Services/AiStudio/AiGenerationProvider.php
?? backend/app/Services/AiStudio/AiStudioException.php
?? backend/app/Services/AiStudio/AiStudioManager.php
?? backend/app/Services/AiStudio/OpenAiGenerationProvider.php
?? backend/app/Services/AiStudio/UnavailableAiGenerationProvider.php
?? backend/app/Services/NewsDiscovery/AiStudioNewsRewriteProvider.php
?? backend/app/Services/NewsDiscovery/InvalidNewsRewriteResponse.php
?? backend/app/Services/NewsDiscovery/NewsDiscoveryException.php
?? backend/app/Services/NewsDiscovery/NewsDiscoveryManager.php
?? backend/app/Services/NewsDiscovery/NewsDiscoveryUrlPolicy.php
?? backend/app/Services/NewsDiscovery/NewsRewriteProvider.php
?? backend/app/Services/NewsDiscovery/RssFeedParser.php
?? backend/app/Support/EditorialImageMetadata.php
?? backend/app/Support/HtmlContent.php
?? backend/app/Support/PublicPagination.php
?? backend/app/Support/RasterUpload.php
?? backend/config/about.php
?? backend/config/ai_editorial.php
?? backend/config/ai_image.php
?? backend/config/ai_studio.php
?? backend/config/news_discovery.php
?? backend/config/security.php
?? backend/config/wordpress_import.php
?? backend/database/migrations/2026_10_18_000001_align_watch_column_lengths.php
?? backend/database/migrations/2026_10_18_000002_create_ai_studio_tables.php
?? backend/database/migrations/2026_10_18_000003_create_news_discovery_tables.php
?? backend/database/migrations/2026_10_27_000001_reorganize_news_and_blog_categories.php
?? backend/database/migrations/2026_10_28_000001_add_public_approval_to_blog_posts.php
?? backend/database/migrations/2026_10_31_000001_add_ai_metadata_to_media.php
?? backend/docs/ABOUT-PAGE.md
?? backend/docs/AI-EDITORIAL-ACCEPTANCE.md
?? backend/docs/AI-EDITORIAL.md
?? backend/docs/AI-FEATURE-IMAGE-GENERATOR.md
?? backend/docs/AI-STUDIO.md
?? backend/docs/NEWS-DISCOVERY.md
?? backend/docs/PRE-DEPLOYMENT-AUDIT.md
?? backend/phpunit.security.xml
?? backend/resources/views/filament/pages/manage-about-page.blade.php
?? backend/tests/Feature/AboutPageTest.php
?? backend/tests/Feature/AiEditorialAssistantTest.php
?? backend/tests/Feature/AiStudioWorkflowTest.php
?? backend/tests/Feature/EditorialAcceptanceTest.php
?? backend/tests/Feature/EditorialApiIntegrationTest.php
?? backend/tests/Feature/EditorialIsolationTest.php
?? backend/tests/Feature/FeatureImageGeneratorTest.php
?? backend/tests/Feature/FilamentResourceAuthorizationTest.php
?? backend/tests/Feature/NewsDiscoveryWorkflowTest.php
?? backend/tests/Feature/OpenAiGenerationProviderTest.php
?? backend/tests/Feature/RemoteImageCommandSecurityTest.php
?? backend/tests/Feature/SecurityRemediationTest.php
?? backend/tests/Feature/SyncRssNewsModerationTest.php
?? backend/tests/Feature/WatchMigrationLengthGuardTest.php
?? backend/tests/Support/FakeAiGenerationProvider.php
?? backend/tests/Support/FakeNewsRewriteProvider.php
?? backend/tests/browser/README.md
?? backend/tests/browser/about-app.php
?? backend/tests/browser/about-evidence/about-1440.png
?? backend/tests/browser/about-evidence/about-320.png
?? backend/tests/browser/about-evidence/about-390.png
?? backend/tests/browser/about-evidence/about-768.png
?? backend/tests/browser/about-evidence/admin-preview.png
?? backend/tests/browser/about-evidence/admin-publish-confirmation.png
?? backend/tests/browser/about-evidence/cms-results.json
?? backend/tests/browser/about-evidence/diagnostic-results.json
?? backend/tests/browser/about-evidence/failure.png
?? backend/tests/browser/about-evidence/isolation.json
?? backend/tests/browser/about-evidence/public-results.json
?? backend/tests/browser/about-evidence/results.json
?? backend/tests/browser/editorial-app.php
?? backend/tests/browser/evidence/1440-blog-category.png
?? backend/tests/browser/evidence/1440-blog-outline.png
?? backend/tests/browser/evidence/1440-blog-saved.png
?? backend/tests/browser/evidence/1440-failure.png
?? backend/tests/browser/evidence/1440-news-assist.png
?? backend/tests/browser/evidence/1440-news-confirmation.png
?? backend/tests/browser/evidence/1440-news-duplicate-source.png
?? backend/tests/browser/evidence/1440-news-loading.png
?? backend/tests/browser/evidence/1440-news-saved.png
?? backend/tests/browser/evidence/1440-news-source-validation.png
?? backend/tests/browser/evidence/390-blog-category.png
?? backend/tests/browser/evidence/390-blog-outline.png
?? backend/tests/browser/evidence/390-blog-saved.png
?? backend/tests/browser/evidence/390-failure.png
?? backend/tests/browser/evidence/390-news-assist.png
?? backend/tests/browser/evidence/390-news-confirmation.png
?? backend/tests/browser/evidence/390-news-loading.png
?? backend/tests/browser/evidence/390-news-saved.png
?? backend/tests/browser/evidence/390-news-source-validation.png
?? backend/tests/browser/evidence/768-blog-category.png
?? backend/tests/browser/evidence/768-blog-outline.png
?? backend/tests/browser/evidence/768-blog-saved.png
?? backend/tests/browser/evidence/768-failure.png
?? backend/tests/browser/evidence/768-news-assist.png
?? backend/tests/browser/evidence/768-news-confirmation.png
?? backend/tests/browser/evidence/768-news-loading.png
?? backend/tests/browser/evidence/768-news-saved.png
?? backend/tests/browser/evidence/768-news-source-validation.png
?? backend/tests/browser/evidence/database-state.json
?? backend/tests/browser/evidence/failure.png
?? backend/tests/browser/evidence/focus-results.json
?? backend/tests/browser/evidence/initial-assist-1440.png
?? backend/tests/browser/evidence/results.json
?? backend/tests/browser/feature-image-app.php
?? backend/tests/browser/feature-image-evidence/1440-blog-draft.png
?? backend/tests/browser/feature-image-evidence/1440-blog-portrait.png
?? backend/tests/browser/feature-image-evidence/1440-error-failure.png
?? backend/tests/browser/feature-image-evidence/1440-error-invalid.png
?? backend/tests/browser/feature-image-evidence/1440-error-quota.png
?? backend/tests/browser/feature-image-evidence/1440-errors-failure.png
?? backend/tests/browser/feature-image-evidence/1440-failure.png
?? backend/tests/browser/feature-image-evidence/1440-generation.png
?? backend/tests/browser/feature-image-evidence/1440-loading.png
?? backend/tests/browser/feature-image-evidence/1440-news-draft.png
?? backend/tests/browser/feature-image-evidence/1440-preview-and-media.png
?? backend/tests/browser/feature-image-evidence/1440-replacement-confirmation.png
?? backend/tests/browser/feature-image-evidence/390-blog-draft.png
?? backend/tests/browser/feature-image-evidence/390-blog-portrait.png
?? backend/tests/browser/feature-image-evidence/390-error-failure.png
?? backend/tests/browser/feature-image-evidence/390-error-invalid.png
?? backend/tests/browser/feature-image-evidence/390-error-quota.png
?? backend/tests/browser/feature-image-evidence/390-errors-failure.png
?? backend/tests/browser/feature-image-evidence/390-failure.png
?? backend/tests/browser/feature-image-evidence/390-generation.png
?? backend/tests/browser/feature-image-evidence/390-loading.png
?? backend/tests/browser/feature-image-evidence/390-news-draft.png
?? backend/tests/browser/feature-image-evidence/390-preview-and-media.png
?? backend/tests/browser/feature-image-evidence/390-replacement-confirmation.png
?? backend/tests/browser/feature-image-evidence/768-blog-draft.png
?? backend/tests/browser/feature-image-evidence/768-blog-portrait.png
?? backend/tests/browser/feature-image-evidence/768-error-failure.png
?? backend/tests/browser/feature-image-evidence/768-error-invalid.png
?? backend/tests/browser/feature-image-evidence/768-error-quota.png
?? backend/tests/browser/feature-image-evidence/768-errors-failure.png
?? backend/tests/browser/feature-image-evidence/768-failure.png
?? backend/tests/browser/feature-image-evidence/768-generation.png
?? backend/tests/browser/feature-image-evidence/768-loading.png
?? backend/tests/browser/feature-image-evidence/768-news-draft.png
?? backend/tests/browser/feature-image-evidence/768-preview-and-media.png
?? backend/tests/browser/feature-image-evidence/768-replacement-confirmation.png
?? backend/tests/browser/feature-image-evidence/browser-results.json
?? backend/tests/browser/feature-image-evidence/isolation-and-drafts.json
?? backend/tests/browser/feature-image-evidence/writing-regression/1440-blog-category.png
?? backend/tests/browser/feature-image-evidence/writing-regression/1440-blog-outline.png
?? backend/tests/browser/feature-image-evidence/writing-regression/1440-blog-saved.png
?? backend/tests/browser/feature-image-evidence/writing-regression/1440-failure.png
?? backend/tests/browser/feature-image-evidence/writing-regression/1440-news-assist.png
?? backend/tests/browser/feature-image-evidence/writing-regression/1440-news-confirmation.png
?? backend/tests/browser/feature-image-evidence/writing-regression/1440-news-duplicate-source.png
?? backend/tests/browser/feature-image-evidence/writing-regression/1440-news-loading.png
?? backend/tests/browser/feature-image-evidence/writing-regression/1440-news-saved.png
?? backend/tests/browser/feature-image-evidence/writing-regression/1440-news-source-validation.png
?? backend/tests/browser/feature-image-evidence/writing-regression/390-blog-category.png
?? backend/tests/browser/feature-image-evidence/writing-regression/390-blog-outline.png
?? backend/tests/browser/feature-image-evidence/writing-regression/390-blog-saved.png
?? backend/tests/browser/feature-image-evidence/writing-regression/390-news-assist.png
?? backend/tests/browser/feature-image-evidence/writing-regression/390-news-confirmation.png
?? backend/tests/browser/feature-image-evidence/writing-regression/390-news-loading.png
?? backend/tests/browser/feature-image-evidence/writing-regression/390-news-saved.png
?? backend/tests/browser/feature-image-evidence/writing-regression/390-news-source-validation.png
?? backend/tests/browser/feature-image-evidence/writing-regression/768-blog-category.png
?? backend/tests/browser/feature-image-evidence/writing-regression/768-blog-outline.png
?? backend/tests/browser/feature-image-evidence/writing-regression/768-blog-saved.png
?? backend/tests/browser/feature-image-evidence/writing-regression/768-news-assist.png
?? backend/tests/browser/feature-image-evidence/writing-regression/768-news-confirmation.png
?? backend/tests/browser/feature-image-evidence/writing-regression/768-news-loading.png
?? backend/tests/browser/feature-image-evidence/writing-regression/768-news-saved.png
?? backend/tests/browser/feature-image-evidence/writing-regression/768-news-source-validation.png
?? backend/tests/browser/feature-image-evidence/writing-regression/results.json
?? backend/tests/browser/run-root.txt
?? content/about.json
?? docs/EDITORIAL-NEWSLETTER.md
?? docs/LEGAL-PAGES-REVIEW.md
?? docs/NAMECHEAP-STAGING-PLAN.md
?? docs/SECURITY-REMEDIATION.md
?? docs/SECURITY-SERVICE-PAGE.md
?? docs/SERVICES-CATALOGUE.md
?? frontend/app/api/editorial-search/route.ts
?? frontend/app/blog/layout.tsx
?? frontend/app/cookies/page.tsx
?? frontend/app/news/layout.tsx
?? frontend/app/privacy/page.tsx
?? frontend/app/services/security/page.tsx
?? frontend/app/terms/page.tsx
?? frontend/components/AboutPage.module.css
?? frontend/components/AboutPage.tsx
?? frontend/components/AdditionalServices.tsx
?? frontend/components/BusinessAutomationServicePage.tsx
?? frontend/components/EdTechServicePage.tsx
?? frontend/components/EditorialNewsletterExperience.tsx
?? frontend/components/EditorialNewsletterPopup.tsx
?? frontend/components/EditorialNewsletterSection.tsx
?? frontend/components/EditorialSearch.tsx
?? frontend/components/EducationServicePage.tsx
?? frontend/components/FeaturedStoriesHero.tsx
?? frontend/components/FeaturedWatchCarousel.tsx
?? frontend/components/FintechServicePage.tsx
?? frontend/components/FormFieldError.tsx
?? frontend/components/LegalPage.module.css
?? frontend/components/LegalPage.tsx
?? frontend/components/RealEstateServicePage.tsx
?? frontend/components/SecurityServicePage.tsx
?? frontend/components/WatchVideoPlayer.tsx
?? frontend/components/WebDevelopmentEnquiryModal.module.css
?? frontend/components/WebDevelopmentPage.tsx
?? frontend/lib/about.ts
?? frontend/lib/featured-stories.ts
?? frontend/lib/legal-metadata.ts
?? frontend/lib/newsletter-preferences.ts
?? frontend/lib/product-catalogue.ts
?? frontend/lib/security-service.ts
?? frontend/lib/service-catalogue.ts
?? frontend/lib/use-form-submission.ts
?? frontend/lib/watch-playback.ts
?? frontend/public/business-automation-hero.png
?? frontend/public/business-automation-operations.png
?? frontend/public/business-automation-video-poster.png
?? frontend/public/edtech-hero.png
?? frontend/public/edtech-learning-environment.png
?? frontend/public/edtech-lms-poster.png
?? frontend/public/education-operations.png
?? frontend/public/education-portal-hero.png
?? frontend/public/education-portal-video-poster.png
?? frontend/public/fintech-service-hero.png
?? frontend/public/products/audioflow-presenter.jpg
?? frontend/public/products/bookmarketing-author.jpg
?? frontend/public/products/politcs-professional-meeting.jpg
?? frontend/public/products/skillhub-learning.jpg
?? frontend/public/products/wauabot-customer-conversation.jpg
?? frontend/public/real-estate-hero.png
?? frontend/public/real-estate-operations.png
?? frontend/public/real-estate-video-poster.png
?? frontend/public/security/ASSET-CREDITS.md
?? frontend/public/security/professional-review.jpg
?? frontend/public/security/stakeholder-review.jpg
?? frontend/public/security/team-assessment.jpg
?? frontend/public/services/ASSET-CREDITS.md
?? frontend/public/services/financial-review.jpg
?? frontend/public/services/property-consultation.jpg
?? frontend/public/web-development-hero.png
?? frontend/tests/FORMS.md
?? frontend/tests/about-browser.cjs
?? frontend/tests/about-data.test.cjs
?? frontend/tests/editorial-browser.cjs
?? frontend/tests/feature-image-browser.cjs
?? frontend/tests/feature-image-writing-regression.cjs
?? frontend/tests/forms-browser.cjs
?? frontend/tests/forms-mock-api.cjs
?? frontend/tests/forms-register.cjs
?? frontend/tests/forms.test.cjs
?? frontend/tests/image-security.mjs
?? frontend/tests/legal-pages-browser.cjs
?? frontend/tests/legal-pages.test.cjs
?? frontend/tests/newsletter-browser.cjs
?? frontend/tests/newsletter-mock-api.cjs
?? frontend/tests/newsletter.test.cjs
?? frontend/tests/security-service-browser.cjs
?? frontend/tests/security-service.test.cjs
?? frontend/tests/services-catalogue-browser.cjs
?? frontend/tests/services-catalogue-fixtures.cjs
?? frontend/tests/services-catalogue.test.cjs
```
