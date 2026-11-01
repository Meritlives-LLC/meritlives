# MERITLIVES security remediation — operator verification

No production access or deployment was performed. Existing workspace changes were preserved.

## Application controls

- News listing/detail/featured and search use `News::publiclyEligible`: published status and non-null `published_at <= now()`.
- Watch listing/detail use the existing active/media scope plus a non-null past publication timestamp. No player, carousel, autoplay or timing code changes are required.
- Blog public eligibility remains published + explicitly approved + non-null past date. Resource record actions and queries enforce `user_id` ownership unless the user is an administrator or has `review_blog`. Create/edit server hooks strip publication, approval, featured and owner manipulation from unprivileged submissions.
- `review_blog` must be created and deliberately assigned to authorized reviewers in the deployed permission store. Seeder source grants it to editors/admins, but no seeder was run. Existing editors will need an authorized permission update. Do not run the whole seeder without reviewing its permission synchronization effects.
- List endpoints default to 12, maximum 50, integer `per_page`; invalid values return 422. Page range is 1–10000. Categories previously defaulted to 50; the frontend explicitly requests 50. Search remains capped at 10 per content type with a 2–100 character query.
- Named public read limit: 120/minute/IP; search: 30/minute/IP. Contact/newsletter limits remain 5/10. Tune with staging traffic measurements. Server-rendered frontend requests may share a backend IP; size limits for this topology before production.
- Filament image uploads and rich-editor attachments share content validation: JPEG/PNG/WebP/GIF, 5 MiB, maximum 12000 pixels on either axis and 40 megapixels. fileinfo MIME and decoded image metadata must agree. UUID filenames use the detected content extension, never an original filename. Fake storage only is used in upload tests.

## Next.js release and advisories

Selected target: Next.js 15.5.28, React/React DOM 19.2.9, sharp 0.35.5. Exact installed/lockfile versions and build results must be checked before release.

Authoritative references:
- https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw
- https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4
- https://github.com/vercel/next.js/releases/tag/v15.5.28
- https://nextjs.org/docs/app/guides/upgrading/version-15
- https://nextjs.org/support-policy

SVG advisory: affected >=10.0.0 <=15.5.27 and >=16.0.0 <=16.4.0; patches 15.5.28 / 16.4.1. Describes an upstream memory issue on glibc Linux; sharp >=0.35.5 is its workaround. AVIF advisory: affected >=10.0.0 <15.5.24 and >=16.0.0 <16.3.3; patches 15.5.24 / 16.3.3 disable AVIF optimization pending upstream fixes. Next 14.2.35 falls inside both ranges. Next 15 maintenance security support is extended through January 31, 2027; plan a separately validated Next 16 upgrade before then.

Registry metadata for Next 15.5.28 accepts React ^18.2 or ^19. App Router upgrade guidance recommends React 19 and async params/searchParams; migrated only request API plumbing. Sharp 0.35.5 requires Node >=20.9. Use a supported Node 22 or 24 LTS deployment and verify native optional dependencies installed for the target OS/CPU/libc.

Production optimizer permits HTTPS/default port/no query strings for the configured MERITLIVES API host under `/storage/**`, and YouTube thumbnail hosts under `/vi/**`. API hosts are limited to meritlives.com, www.meritlives.com, api.meritlives.com; confirm the actual media origin matches before deployment. Development-only loopback storage applies only for NODE_ENV=development. Test cases match Next's actual URL allowlist implementation without fetching internal or third-party URLs. Approved remote image fetching still needs staging verification.

## Required authorized production checks

1. From the running release directory/container, record `node --version`, `npm ls next react react-dom sharp --all`, OS, CPU and libc; inspect `sharp.versions` and native dependencies. Check the deployed build's effective image settings, optimizer enablement and redirects. Local Windows dependencies do not establish Linux production exposure or resolution.
2. Confirm the frontend runs persistently (`next start` or approved cPanel startup adapter), the correct build/lockfile is deployed and no stale Next 14 process or cached release remains. Do not omit sharp/native optional packages.
3. Identify TLS termination, origin access policy and exact proxy IPs/CIDRs. Set `TRUSTED_PROXIES` accordingly. Wildcards and hostnames are rejected. Only forwarded client-IP and scheme headers are trusted, only from these proxies. Proxies must overwrite inbound forwarded headers and prevent direct origin bypass. Verify HTTPS detection and IP-based limits using a single staging request from a known client.
4. Verify effective production session settings: Secure=true, HttpOnly=true, SameSite=lax unless requirements dictate otherwise; host-only domain unless shared subdomain auth is intentional; path `/`; review 120-minute idle lifetime and login/logout session rotation. Production code defaults Secure on, but explicit environment overrides must be checked. Do not print environment secrets.
5. Confirm HTTPS redirects, certificate chain and all domain/subdomain coverage. HSTS is opt-in via `SECURITY_HSTS_ENABLED=true`, production only, secure requests only; default max-age 31536000 without includeSubDomains. Stage with a short max-age before a long commitment. Check existing CDN HSTS and avoid duplicate/conflicting headers.
6. Verify nosniff, frame protection, referrer and permissions headers on both Next and Laravel responses, including errors. No CDN configuration was supplied. Laravel and Next set these basic headers; verify effective responses on both production origins.
7. Inspect current CDN/proxy CSP before adding one. CSP remains incomplete: start report-only in staging, inventory next inline hydration scripts/styles (nonce/hash needed for strict enforcement), self-hosted next/font assets, API origin, images and YouTube nocookie frames, and environment-configured service video/caption origins. Do not use an unrestricted script policy or enforce before testing marketing pages, search, forms, admin/editor and Watch. No CSP was enabled blindly.
8. Configure storage origin/server to serve raster files as static content only. Disable PHP/CGI/script handlers for `/storage` and upload directories, directory listing, content sniffing and dotfile access. Prefer an isolated media origin. Verify server-level controls, MIME responses and historical uploaded files. Application validation cannot prove uploaded files cannot execute; no production server config was available or modified.
9. Use a shared persistent production cache for throttling across workers. Verify proxy IP handling and separately configure CDN/proxy request, connection, body and timeout limits for API search and Next image optimization. No load tests were performed; do not claim CDN protection without configuration evidence.
10. Validate legitimate storage/YouTube images and unsupported URLs on staging; test all marketing routes, pagination/Load More, contact/newsletter validation (no valid real submissions), admin ownership and approval workflows. No database migrations/seeders were run. Existing pending schema changes require separate approval/rehearsal.


## Verification results and limits

- PHP 8.4.25 syntax checks passed for all tracked modified PHP files and new security files.
- `php -d extension=pdo_sqlite -d extension=sqlite3 vendor/bin/phpunit -c phpunit.security.xml --colors=never`: **passed: 9 tests, 163 assertions**, forced in-memory SQLite and fake storage, with no migrations or seeders. Authorization tests exercise actual resource route binding and authorization plus server data hooks, using mocked permission-bearing users. Full Filament browser request replay remains a staging check.
- `node tests/image-security.mjs`: Next remote matching and optimizer parameter validation reject unsafe sources; approved sources pass. A generated in-memory PNG was optimized to WebP by Next/sharp 0.35.5 without remote fetches.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: passed.
- `NEXT_DIST_DIR=.next.security-check NEXT_PUBLIC_API_URL=http://127.0.0.1:9/api/v1 npm run build`: passed compilation, lint/type checks and all 17 static-page generation tasks. The closed local API endpoint intentionally exercises fallback paths; this is not end-to-end verification against populated content. Existing Google Fonts were fetched for the build after sandbox network access was authorized.
- Final dependency installation reported zero npm vulnerabilities after compatible overrides for Next's PostCSS (8.5.32), postcss-selector-parser (6.1.5) and source-map-js (1.2.2). No `npm audit fix --force` was used.
- `git -c core.safecrlf=false diff --check`: passed. Existing line-ending warnings are not whitespace failures.

Important optimizer limit: Next 15's external image fetch follows redirects. An allowlisted origin must not redirect its allowed paths to internal/untrusted services; verify this on staging and restrict optimizer-process network egress to public approved origins. No internal network probing was performed. Direct unsafe URL input is rejected locally, but redirect/DNS behavior and actual production remote fetching remain environment verification requirements.

## Changed files for this remediation

Existing unrelated edits are excluded from this list.

- Frontend: `next.config.mjs`, `package.json`, `package-lock.json`; async request API plumbing only in `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `app/news/page.tsx`, `app/news/[slug]/page.tsx`, `app/products/[slug]/page.tsx`, `app/services/[slug]/page.tsx`, `app/search/page.tsx`, `app/watch/page.tsx`.
- Backend: BlogPostResource and its Create/Edit pages; Media/News/Product/Service resources for uploads; Blog/News/Category/Product/Service/Watch API controllers; News and WatchVideo models; SearchService; AppServiceProvider; routes/api.php; RolesAndPermissionsSeeder source only; Support/PublicPagination.php and RasterUpload.php; bootstrap/app.php; TrustedProxies and SecurityHeaders middleware; config/security.php and config/session.php.
- Tests/configuration: `backend/tests/Feature/SecurityRemediationTest.php`, `backend/phpunit.security.xml`, `frontend/tests/image-security.mjs`.
- Documentation: this report and the Node/Next runtime prerequisite in `NAMECHEAP-STAGING-PLAN.md`.
- Generated verification artifact: `.next.security-check/` (local build only). Original tsconfig settings are retained after Next's automatic build-directory addition. No shared navbar/footer or Watch components were edited by this remediation.

No production operations, real database records, migrations, seeders, contact enquiries or infrastructure changes were performed. No full pre-existing database-backed suite was run because those suites use RefreshDatabase/migrations, which were outside authorization.


## Finding status

| Finding | Status | Evidence / remaining gate |
| --- | --- | --- |
| Direct unsafe optimizer source input | Fixed locally | Next matcher and parameter validation tests |
| Next SVG/AVIF advisories | Requires Environment Verification | Patched local Next/sharp tree and build; deployed tree/OS/libc unknown |
| Image redirects / internal network access | Partially Fixed | Direct allowlist rejection verified; redirect and egress controls require operator verification |
| Blog ownership and protected review fields | Fixed locally | Resource authorization, direct route binding and server data-hook tests; reviewer permission rollout still needed |
| News/search/Watch early publication | Fixed locally | Listing/detail/featured/search tests with past/future/missing/draft fixtures |
| Public pagination | Fixed locally | Rejection and metadata tests on all six list endpoints; search is separately capped |
| API application rate limits | Fixed locally | Named policy checks and two-request 429 test; production proxy/cache sizing pending |
| Raster upload validation | Fixed locally | Content/extension/size rejection, fake storage and generated-filename tests |
| Public storage execution prevention | Requires Environment Verification | No server handler/CDN configuration supplied |
| Cookies/proxies/HTTPS/HSTS | Requires Environment Verification | Safer defaults and local trust/HSTS tests; actual deployment settings unknown |
| Basic security headers | Fixed locally | Laravel response tests, Next configuration checks and successful build; production headers pending |
| CSP | Not Fixed | CDN policy unknown; staged report-only inventory/testing still required |
| Infrastructure rate limits | Requires Environment Verification | No CDN/reverse-proxy limits available to verify |
