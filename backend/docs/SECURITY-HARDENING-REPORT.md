# MERITLIVES post-commit security hardening

Commit-review note (2026-11-01): this report records the earlier security audit and commit `fcd327e21a70224bcd254bda4e84f91bf2a78260`. Its references to an intentionally untracked report and the then-current working tree are historical. The report has now been reviewed for inclusion alongside the DDoS patches in the separately authorized local commit `fix(security): harden application and DDoS protections`. The original release and earlier security commit are not amended. Current verification and the complete proposed commit inventory are recorded in `DDOS-PROTECTION-REPORT.md` under "Local commit review".

Date: 2026-10-31. Audited branch: `release/meritlives-2026-10-31`. Starting release: `286c0be9e64379e1f6f1c9b5770100eb4eb6f817`. The original release commit is preserved. No production website was scanned or accessed. No push, merge, rebase, deployment, existing-database migration/seeding or real OpenAI request was performed.

## Decision

Local hardening is suitable for review after the final validation below. **Production deployment remains NOT READY** until actual hosting, PHP/runtime, backup/restore, MySQL rehearsal, role/publication rollout and security configuration are verified. There was one verified High application finding; it is patched. No Critical finding was verified. This is source review, local dependency analysis and regression testing, not a production penetration test or a guarantee that no other vulnerabilities exist.

## Verified findings and patches

| ID | Severity / likelihood | Affected code and root cause | Patch and regression evidence |
| --- | --- | --- | --- |
| S1 | High / high when an author owns a previously approved post | `app/Filament/Resources/BlogPostResource.php`: on edit, authoringData removed incoming publication fields but retained the existing database approval/published state. An author could replace approved copy and leave it publicly visible without review. | Every non-reviewer save forces draft, approval false, no publication date and featured false. Owner checks remain; reviewers can still explicitly approve. Livewire save regression checks actual persisted content/state, detail/list/search exclusion and reviewer republication. Existing protected-field test updated. |
| S2 | Medium / low; requires a hostile or broken external feed | `app/Console/Commands/SyncRssNews.php`: default redirect following and body buffering let the scheduled fixed-host importer accept an unbounded response. Transport exception text was printed. | Stream responses with a 1,500,000-byte cap, bounded chunk reads, connection/overall timeouts, redirects disabled, guaranteed response close and generic errors. Oversized bodies with false Content-Length, redirects and private exception markers covered. Fixed feed locations, pending-import and immutable-published-copy behavior retained. Arbitrary user-controlled SSRF was not demonstrated. |
| S3 | Medium / low; requires retained permission and an authenticated session | `routes/web.php`: legacy AI Studio image preview used generic auth, while panel pages additionally checked canAccessPanel. A role-revoked user retaining view_ai_studio could still open previews. | Both image preview routes now use Filament panel setup/authentication, with controller permissions and throttling retained. Regression denies permission-only/no-role user and permits a valid editor. |
| S4 | Low / low; remote exploit not established | `app/Http/Controllers/Admin/AiStudioImagePreviewController.php`: legacy preview checked byte count only after reading the whole file. A corrupted/oversized stored file could consume excess memory. | Check filesystem size before reading; retain actual byte length/MIME checks. Mock filesystem regression forbids get() and confirms oversized files return 404. This is a verified validation-order defect, not evidence an attacker can write arbitrary private files. |
| S5 | Low / low; depends on transport throwing an exact RuntimeException | `app/Services/AiEditorial/ResponsesEditorialProvider.php`: exact-class RuntimeException was treated as an application-authored safe error, although transports/streams can throw that same class with internal detail. | New EditorialProviderException marks only application-authored messages. All other failures become a generic message. Mock transport secret-marker and quota-response tests verify redaction and useful safe quota messaging. |
| S6 | Medium / medium for retries/concurrent authorized actions | `app/Services/AiStudio/AiStudioManager.php`: generation trusted the caller's stale model state, allowing a second provider invocation using a stale draft instance after the job had completed. No per-job generation lock existed. | Acquire a per-job cache lock and refresh the job before checking status; release in finally. Tests verify stale completed jobs cannot invoke provider again and an inflight lock blocks calls. Requires production cache/lock sharing across workers; this does not introduce a new cache configuration. |
| S7 | Low / high when backend search is throttled | `frontend/app/api/editorial-search/route.ts`: the catch-all converted backend 429 responses into 502, hiding the distinction between throttling and an upstream outage. | Preserve 429 with a generic client-safe message; retain generic 502 for other failures. Three route tests cover 429, secret redaction and input bounds/no upstream call. This is not an edge rate limiter. |
| D1 | Medium / low observed application exposure | `composer.lock`: installed/locked symfony/mime 8.1.7 matched CVE-2026-45070. | Targeted update to 8.1.10 only, with Composer scripts disabled. No other package version, root manifest requirement or production configuration changed. Final Composer audit is clean. |

No authentication, ownership, publication or approval rule was relaxed. The High fix deliberately changes author saves of existing approved posts: the post becomes unpublished until a reviewer approves it again. No new database migration is required.

## Dependency investigation

Commands run: `composer audit --format=json`, `npm audit --omit=dev --json`, `npm audit --json`; final Composer audit repeated after the patch. Network access was limited to dependency/advisory sources and build font downloads, not production or AI providers.

| Dependency finding | Affected installed version / fixed version | Exposure and disposition |
| --- | --- | --- |
| Symfony Mime CVE-2026-45070 / GHSA-vqc8-7275-q272 | 8.1.7 -> 8.1.10. The advisory also identifies 5.4.55, 6.4.49 and 7.4.22 as patched maintained-line releases. | Runtime dependency; parameter-name header injection primitive. Application-controlled untrusted MIME parameter names were not found. Same-minor patch installed, lock reviewed and audit now has zero advisories/abandoned packages. |
| minimatch GHSA-g3hv-75wg-m249 / CVE-2026-118764 | 3.1.5 and 10.2.6 are flagged by the advisory's <11.0.1 range; published fixed version is 11.0.1. | Development-only ESLint/parser/glob chains. The described amplification path uses optimizationLevel >=2; exploitability in this project's lint inputs was not demonstrated. No production npm vulnerabilities. No major override/upgrade or forced downgrade performed. Remains open pending an approved tooling migration or compatible upstream fix. |

Full npm audit reports **18 moderate affected package nodes**, not 18 independent root vulnerabilities: `@eslint-community/eslint-utils`, `@eslint/eslintrc`, `@humanwhocodes/config-array`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `@typescript-eslint/type-utils`, `@typescript-eslint/typescript-estree`, `@typescript-eslint/utils`, `eslint`, `eslint-config-next`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`, `file-entry-cache`, `flat-cache`, `glob`, `minimatch`, `rimraf`. There are zero reported High/Critical npm findings. Automated suggested major downgrades of ESLint/config-next were not accepted. Keep untrusted glob input out of build jobs.

Sources: [Symfony advisory](https://symfony.com/cve-2026-45070), [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).

**Runtime correction to earlier deployment guidance:** the exact Composer lock uses Symfony 8.1 components requiring PHP **>=8.4.1** (including Mime both before and after this patch). The root Laravel/PHP ^8.3 declaration alone is insufficient for deploying this lock. Local PHP 8.4.25 passes non-dev platform checks. Do not deploy it to PHP 8.3 or use ignore-platform-reqs. Native GD/JPEG/PNG/WebP, PDO MySQL, fileinfo, XML/DOM/SimpleXML, OpenSSL, intl, cURL and mbstring requirements still need target verification; some local Composer requirements are satisfied by polyfills.

## Backend review coverage

- Authentication: checked User panel-role contract, Filament session/CSRF middleware and installed login behavior. Login limits attempts and regenerates the session. Registration, password reset, profile and user-management routes are not enabled in the application's panel configuration; no exposed account provisioning/reset endpoint was found. Recovery remains an operator procedure; MFA/reset enablement would require a separately reviewed configuration change.
- Authorization: resource traits enforce per-action permissions; Blog adds ownership/reviewer checks; About mount/save/preview/publish reauthorize admin/super_admin plus manage_settings. About public API reads only published data. Generic Settings is restricted to manage_settings, granted only to standard admin roles; custom grants must be reviewed because direct setting access can edit stored About keys without the dedicated publishing UI.
- Publication: News requires published/nonfuture date; Blog additionally requires approval. API listing/detail/search/featured paths use these scopes. AI text/image application forces unpublished state. New RSS stories remain pending and Watch imports inactive. Removing approval or editing as a non-reviewer now removes public eligibility.
- Validation/mass assignment: public contact/newsletter use FormRequest validated values, length constraints and bound Eloquent operations; pagination/search parameters are bounded. Blog creator ID and publication fields are enforced server-side. No request-controlled SQL fragment, sort expression or raw concatenation was identified in public controllers/search. Watch raw SQL and migration column identifiers are static, not request input. LIKE wildcards remain search semantics, not SQL injection.
- Sessions/errors: HttpOnly/lax cookies, production-secure default, JSON session serialization and configured exact proxy trust reviewed. Debug must be off on target; no local environment was changed. Public API resources do not return passwords, credentials, prompt/job data or internal exception bodies. Contact/newsletter return submission IDs/status only. Newsletter does not implement email-ownership confirmation; assess double opt-in/abuse policy separately with production mail configuration.
- Uploads: RasterUpload validates server MIME/extension, UUID paths, dimensions and size, rejects SVG and restricts destination directories. PHP execution in public uploads must be denied by the actual web server. Existing public media is intentionally public; removing an article does not make its already-public image private.
- Downloads/storage: Feature Images enforce owner, record context, expiry, type, safe path, hash, size and MIME; previews are no-store. Legacy preview is panel/permission guarded and now size-prechecked. Private storage must not be exposed by a web-server alias. Temporary files/cleanup paths are constrained. Storage and image failures do not publish articles.

## Frontend and AI review coverage

- Inspected server/client code, NEXT_PUBLIC usages, proxy route, rich HTML sinks, JSON-LD, URL handling, external media and public assets. No server provider secret is exposed to client code. NEXT_PUBLIC variables are public configuration only. Rich News/Blog/Product/Service HTML is sanitized by backend HtmlContent; JSON-LD escapes `<`; React handles ordinary text. No independently exploitable stored XSS was verified in these paths. This assumes a trusted HTTPS API; backend sanitization must not be bypassed.
- Watch embeds derive a validated 11-character ID and fixed youtube-nocookie origin. Public asset inventory contains application artwork/team media and credits, not environment files, database dumps, key files or backup archives. No arbitrary request-controlled server-side fetch destination was found in the frontend search proxy or Next image allowlist.
- AI Editorial input is bounded; URLs are supplied as data, not fetched; structured output is validated/plain text and escaped before insertion. Prompt injection can still influence generated meaning, so human fact/rights review is essential. No content filter is a fact verifier.
- Feature Images use fixed HTTPS provider endpoint, explicit feature/provider flags, administrator billable enablement plus per-generation editor confirmation, per-user lock, minute/day limits, bounded responses and GD normalization. Job ownership/attachment permissions and draft-reset rules remain. Tests use mocks only; no live model availability, charges or provider entitlement was tested.
- AI Studio remains permission/feature gated. Draft creation requires approved article jobs; associated images require approved state and unpublished content. Provider errors are sanitized; duplicate generation now uses fresh state and a lock. Cross-worker correctness requires a shared persistent cache. General AI Studio collaboration permissions differ from owner-private Feature Image previews; custom role grants need review.

## Registered routes and file exposure

Enumerated **80 routes** using testing/in-memory SQLite configuration without running migrations or seeders. Reviewed admin, API, Livewire, storage and Filament download surfaces. No application debug/test/OpenAI probe route was registered.

- Admin resource routes use panel authentication; login is intentionally public. Both custom preview endpoints now require panel access plus controller permissions and 60/minute throttle.
- Public API reads and contact/newsletter are intentional; read/search/contact/newsletter limits are 120/30/5/10 per minute per IP. Health endpoints reveal status/application name, not database credentials. A green health endpoint does not verify schema readiness.
- Livewire update uses web/CSRF and component authorization; temporary upload/preview controllers require signed URLs. Installed Laravel local storage GET/PUT controllers require signed relative URLs, with upload intent checked on PUT. A route lacking a plain auth middleware is not automatically public access.
- Filament export/import download controllers enforce the export/import owner's identity or a registered policy. No application policy override exposing these downloads was found.
- Checked tracked assets and actual public directories for environment/key/dump/backup patterns; none found. Laravel public/index.php and published Filament JS/CSS are expected. Correct production document roots and aliases remain unverified.

## Six release migrations

No migration file was changed. Database-writing tests use disposable in-memory SQLite only; existing MySQL was not opened or migrated.

| Order | Migration | Data preservation / rollback / privilege considerations |
| --- | --- | --- |
| 1 | 2026_10_18_000001_align_watch_column_lengths | Reads max character lengths before narrowing strings. Existing oversize values abort; MySQL may lock/rebuild. Down widens columns. Needs SELECT/ALTER and target-copy rehearsal; multi-table DDL is not an all-or-nothing rollback. |
| 2 | 2026_10_18_000002_create_ai_studio_tables | Creates template/job/audit tables and foreign keys; existing content remains. Down deliberately throws to preserve history. Needs CREATE/INDEX/REFERENCES and backups. |
| 3 | 2026_10_18_000003_create_news_discovery_tables | Creates source/discovery/event tables and adds job metadata and News SEO columns; depends on AI/users/categories/news. Nullable additions preserve existing data. Down deliberately throws. Needs CREATE/ALTER/INDEX/REFERENCES. |
| 4 | 2026_10_27_000001_reorganize_news_and_blog_categories | Inserts/activates Blog taxonomy and retires legacy categories without deleting associations. Down is no-op; snapshot needed to reverse taxonomy decisions. Needs SELECT/INSERT/UPDATE. |
| 5 | 2026_10_28_000001_add_public_approval_to_blog_posts | False default is deliberately fail-closed. Existing published posts become private until individually approved by a reviewer. Down drops index/approval column; old code can have different exposure semantics. Needs ALTER/INDEX. |
| 6 | 2026_10_31_000001_add_ai_metadata_to_media | Nullable JSON column preserves media rows/files and gives existing rows SQL NULL. Down deletes provenance metadata. Prefer keeping this additive column on code rollback; needs ALTER and backup of provenance. |

MySQL version/JSON support, DDL privileges, engine/index/foreign-key compatibility, locks, runtime and disk usage must be tested on a restored target-schema copy. No zero-downtime claim is made. A dedicated deployment identity can hold DDL privileges; routine web DB access should be least privilege. Back up schema/data/ledger, keys/configuration and public/private media; prove restore. Do not use blind batch rollback or reseed production content.

## Outstanding production configuration and potential findings

The following require separate approval and target evidence; they were not silently changed:

1. PHP >=8.4.1 for the actual lock; Node/Next/sharp persistent runtime, native image support, memory/timeouts and hosting entrypoint. Image tests use 512M; earlier 128M testing exhausted memory, so capacity must be measured.
2. TLS/redirects, exact trusted proxy IPs, secure session cookies, debug off, log redaction/rotation, least-privilege DB credentials, mail configuration, public document roots and non-executable upload storage.
3. CSP is not configured for application pages; existing frame/nosniff/referrer/permissions headers are present, Laravel HSTS is opt-in and frontend HSTS depends on the edge. No XSS was established merely from missing CSP. A tested CSP and HSTS rollout affects production behavior and needs separate approval.
4. Edge throttling for the Next search proxy remains necessary: backend IP throttles can group requests behind the Next server. No spoofable X-Forwarded-For limiter or ad hoc unbounded in-process map was added. Public form abuse/bot controls and optional double opt-in are deployment policy decisions.
5. New RSS behavior rejects redirects; verify direct feed endpoints in staging before enabling cron. News Discovery's allowlist must contain only vetted external hosts; DNS/network egress defenses remain host responsibilities. DNS-rebinding exploitation was not established here.
6. Review custom role grants, admin recovery/MFA requirements, shared cache/locks, scheduler ownership and AI privacy/retention/access policy. Keep AI disabled until deliberately enabled; no live provider access was needed for this audit.
7. Eighteen Medium development dependency nodes remain; no compatible non-major remediation was documented by the advisory. Approval is needed for a tooling major migration. No major upgrade, new migration or production configuration patch was applied.

## Validation and local commit

Final backend suite: **138 tests / 1,056 assertions passed** (PHP 8.4.25, 2m19s, 512M memory limit). This includes AI Editorial, Feature Images, About, ownership/approval, API, upload and migration/isolation coverage. All writing tests were guarded by EDITORIAL_MEMORY_ONLY=1, APP_ENV=testing, sqlite/:memory:, empty DB_URL, removed non-SQLite connections, a connector rejecting persistent SQLite, and blocked stray HTTP.

The finalized report is retained as a local audit artifact rather than included in its own commit, so it can record the exact security commit SHA without amending or creating a second commit.

- Targeted security regressions before the final concurrency addition: 8 tests / 55 assertions passed. An initial test assertion incorrectly treated Http::assertSent's response argument as request options; it was corrected to capture options in the HTTP fake. No application control was weakened to make a test pass.
- Final focused RSS/security run: **13 tests / 78 assertions passed**, including the generation lock/stale-state cases.
- A full intermediate run found two RSS moderation fixture failures: the fake returned the same response stream for multiple requests after the importer closed it. The fixtures now return a fresh response for each request; their publication/moderation assertions are retained. Final results below supersede the intermediate run.
- Frontend selected suites: **59 tests passed**, including forms (34), About data, legal, newsletter, security service, service catalogue and three new search route tests.
- Production Next build and separate `tsc --noEmit --incremental false`: **passed** in a disposable source copy with only public .env.production, an explicit closed-loopback API URL, and reused local dependencies. Original excluded config files were not overwritten.
- Composer audit after patch: **zero advisories**, zero abandoned packages; non-dev local platform check passed. npm production audit: **zero advisories**; full npm audit: **18 moderate**, zero High/Critical.
- Browser suites were not repeated: UI save behavior is exercised through actual Filament Livewire and API tests; search change has request/response unit coverage. Earlier browser counts are historical evidence, not new audit results.
- No existing database, real AI provider or production service was used. Source/route review and mocked tests cannot establish production TLS, restore behavior, provider entitlement or actual cache topology.
- Committed-source and changed-source scans found no recognized real credential/private-key signatures. Public environment examples contain placeholders; fake test credentials are explicitly disposable. These pattern checks are not an entropy-based full-history secret audit. All 113 excluded files and protected local environment/probe files were checked against their starting SHA-256 hashes and remain unchanged.

### Final local result

- Security commit: **`fcd327e21a70224bcd254bda4e84f91bf2a78260`**.
- Subject: `fix(security): harden MERITLIVES release`.
- Direct parent: `286c0be9e64379e1f6f1c9b5770100eb4eb6f817`; no amendment or history rewrite.
- Branch: `release/meritlives-2026-10-31`.
- Committed exactly **13** intended patch/test/lock paths; no deletion, migration, environment or production configuration change.
- Staged inventory and secret/path scan passed before commit. Committed whitespace check passed. Index is empty.
- Final remaining tree: the **113 original exclusions**, unchanged, plus this one intentionally untracked finalized report. Protected local environment/probe files also remain unchanged.
- No push, merge, rebase, deployment, production access, real OpenAI call or database operation against an existing database occurred.
- **Recommendation: local security hardening complete and ready for review; production deployment remains NOT READY until the listed target/configuration/migration gates are closed.** The 18 Medium development-tooling findings remain documented; Composer and production npm audits are clean.
