# MERITLIVES request-flood protection

Commit-review note (2026-11-01): the audit below is a pre-commit snapshot. Its statements about uncommitted/unstaged files describe that audit phase. The separately authorized review includes its 23 paths, `SECURITY-HARDENING-REPORT.md`, and one directly related AI Studio creation-page correction, for 25 reviewed commit candidates. See "Local commit review" at the end for the new verification and exact inventory. No existing commit is amended.

Audit window: 2026-10-31–2026-11-01. Branch: `release/meritlives-2026-10-31`. Starting HEAD: `fcd327e21a70224bcd254bda4e84f91bf2a78260`. Original release `286c0be9e64379e1f6f1c9b5770100eb4eb6f817` and security commit are preserved. Changes described here are **local and uncommitted**. No staging, commit, push, deployment, DNS/WAF change, production access, existing-database migration/seeding or real AI call was performed.

## Assessment

Application admission controls are substantially stronger, but this is **not protection against a volumetric DDoS or a guarantee of availability**. PHP throttles run after a connection reaches the hosting account; they cannot protect its network capacity or eliminate PHP bootstrap/cache costs. An edge proxy and origin restrictions are still required. Actual Namecheap plan, Cloudflare zone/plan, origin topology and production capacity were not inspected.

The lightweight framework /up endpoint and unknown/404 paths still incur PHP bootstrap; they are not covered by the /api/v1 aggregate budget. Adding a counter alone cannot remove that floor of origin work. Edge-wide HTTP DDoS handling, request admission and origin connection limits must cover those paths too.

### Findings

| Finding | Severity / practical exposure | Local action |
| --- | --- | --- |
| Public route budgets were independent, and API health had no admission budget. | Medium: one source could alternate routes while consuming application workers. | Add aggregate 180/minute/IP admission for all /api/v1 routes, before existing endpoint-specific limits. |
| Contact/newsletter allowed indefinitely repeated minute windows. | Medium: automated submissions can exhaust DB/mail/editorial handling. | Retain minute limits and add hourly IP budgets. Invalid controller requests consume the same admission allowance. |
| AI writing, Studio and images had separate allowances; writing had no account concurrency guard and Studio could create unlimited draft jobs. | Medium: authorized-account abuse or mistakes can exhaust provider credits, workers and database storage. | Shared account minute/day allowance, one in-flight operation per account, fixed global AI slot pool and separate draft-job creation allowance. Existing feature-specific checks remain. |
| The generic Livewire request path lacked an outer account/IP admission budget. | Medium: requests can repeatedly boot components, validate data and reach DB-backed forms. | Attach a named limiter to the actual POST /livewire/update route. Filament's credential-attempt limiter and all component permissions remain. |
| Temporary uploads used a generic signed upload path/default 12 MiB validation and inherited the default storage disk. | Medium: signed upload abuse consumes disk/inodes before final resource validation. | Require admin-panel authentication, add upload account/IP limits, enforce 5 MiB raster validation, and explicitly store temporary files on existing private local disk. Final RasterUpload destination/authorization is unchanged. |
| Full News/Blog body sanitization ran for list/search results even though those responses omit body content. | Medium availability inefficiency, especially with long bodies. | Evaluate the sanitizer lazily only when returning detail content. No sanitizer or publication scope was removed. |
| Next search could issue unbounded concurrent upstream calls and SSR requests amplified backend work. | Medium: public callers can consume Node sockets, memory and PHP/DB capacity. | Fixed-cardinality process gates, bounded API response reading, existing timeouts capped to a finite maximum, and retry metadata propagation. No spoofable header-based visitor identity was introduced. |
| Arbitrary supported image quality values expanded optimizer work/cache variants. | Low/Medium: unauthenticated optimizer CPU/cache pressure. | Permit quality 75, the application's existing default; remote origin/path restrictions remain. Width variations and cold-cache pressure still need edge protection. |

## Implemented limits

Application defaults live in `backend/config/traffic.php`; existing environment files were not modified. Values are conservative starting points for staging, not a measured production SLA. Lower limits can reject legitimate users sharing a NAT; raise them only after observing actual origin capacity and edge protection.

| Surface | Limit | Result / scope |
| --- | --- | --- |
| All /api/v1 routes, including health | 180/minute/IP aggregate | HTTP 429 plus Laravel rate/retry headers; enforced before controller work. |
| Public lists/details/About/categories | Existing 120/minute/IP | Retained in addition to aggregate budget. |
| Public search | Existing 30/minute/IP | Retained; does not cache approval-sensitive content. |
| Contact | 5/minute + 30/hour/IP | 429 with Retry-After; no automatic retry of a submission. |
| Newsletter | 10/minute + 60/hour/IP | Same admission behavior; validation and subscription semantics unchanged. |
| Livewire POST updates | 300/minute/IP and 120/minute/account (guest fallback IP) | HTTP 429 before component work. This includes login actions as well as editor actions. |
| Filament credential attempts | Existing 5 attempts per limiter window | Installed Filament login rate limiting, generic failure handling and session regeneration retained. GET /admin/login is not the credential POST endpoint: authentication actions use /livewire/update. |
| Temporary uploads | 60/minute/IP + 30/minute/account; signed URL and panel access required | Raster only, 5 MiB each, private temporary storage. Unsigned requests and guests remain rejected. |
| All AI generation together | 10/minute and 60/day/account | Attempts share budgets across all three services; failed attempts also count. Existing authorization/feature flags/billable confirmation are checked as before. |
| Existing Feature Images | 3/minute and 20/day/account by default | Retained on top of the shared allowance. |
| Existing Editorial/Studio generation | Existing 5/minute/account per service | Retained on top of the shared allowance. |
| AI concurrency | 1/account; 2 operations across application workers by default | Nonblocking cache locks, released in finally, 180-second crash-expiry leases. No unbounded queue. Slot setting is clamped to 1–8. |
| Studio draft jobs | 10/minute and 100/day/account | Counts before creating job rows, after authorization/validation. |
| Next search proxy | 4 in-flight requests and 60/minute/process aggregate | 429, no-store and Retry-After; denied work does not call the API. Ignores X-Forwarded-For/CF-Connecting-IP as limiter identities. |
| Next server API fetching | 16 in-flight fetch/parse operations/process | Fails fast with 503 and retry metadata; slots release on success/error. Browser form clients are not subjected to a shared browser-process gate. |
| API response parsing in frontend | 2 MiB decompressed stream limit | Cancel oversized responses, including false Content-Length; no JSON parse of unbounded responses. Large legitimate results will need pagination/content review rather than silently raising limits. |
| API fetch duration | Default 6 seconds; finite configured range 1 ms–10 seconds | No retry loop. Existing cancellation/timeout behavior and retained form values tested. |
| AI text provider HTTP | Maximum 10-second connect / 60-second overall timeout | Existing lower configured values retained. Feature Image provider remains bounded at its existing 5/120 seconds. |
| API / Livewire query strings | 4 KiB | HTTP 414 before routing/controller work. |
| API bodies | 64 KiB | HTTP 413 before JSON/controller validation; accommodates valid 10,000-character Unicode contact messages. |
| Livewire component bodies | 1 MiB | Leaves space for article form data and component snapshots. |
| Livewire multipart upload bodies | 8 MiB Content-Length ceiling | Each temporary raster file also limited to 5 MiB. Web-server/PHP body limits remain mandatory, especially for absent-length multipart bodies. |

AI quota/capacity errors are deliberately translated to existing safe editor notifications/domain exceptions so Livewire forms retain unsaved content. These UI notifications are not all HTTP 429 responses. The outer component limiter produces actual HTTP 429. It is unsafe to blindly retry billable AI operations after a timeout because a provider may have completed the first request.

## Proxy identity and bypass resistance

`TrustedProxies` remains fail-closed: only exact configured IPs/CIDRs are accepted; wildcard and /0 trust are rejected; only forwarded-for and forwarded-proto are trusted. No new trust ranges, production environment variables or CF header overrides were installed.

Tests establish that a direct client cannot reset its allowance by changing X-Forwarded-For or CF-Connecting-IP, and that changing an injected leftmost forwarded value does not bypass a trusted chain when the nearest untrusted peer remains the same. Different real client addresses and different authenticated accounts retain separate allowances.

Before deployment, establish whether Namecheap already restores visitor REMOTE_ADDR using a trusted server module. If so, do not reinterpret forwarded headers a second time. If Laravel sees proxy peers, configure only the real peer ranges after verifying network access controls. Cloudflare appends forwarding information; do not take the first forwarded token blindly or trust CF-Connecting-IP from arbitrary internet clients. See [Cloudflare header behavior](https://developers.cloudflare.com/fundamentals/reference/http-headers/).

Next server-side API calls currently appear to the API as the Next server's IP, unless the host supplies a separately verified topology. **No arbitrary browser-supplied IP is forwarded to defeat this grouping.** Backend search 30/minute/IP can therefore be the binding site-wide search allowance behind one Node egress address. Production visitor-aware edge limits and, if necessary, a separately authenticated server-to-server identity design are required before increasing this allowance. A public header or user-agent string is not such an identity.

## Caching, rendering and expensive paths

Homepage rendering can issue three editorial API requests; About may resolve additional selected catalogue records; detail pages perform lookups; search queries four content classes with bounded results. These remain request-time/database-backed paths. Contains/LIKE search and pagination counts can still be expensive with large data, even though parameters are bound and page sizes are bounded. Per-IP throttles cannot prevent a distributed botnet from saturating database/cache infrastructure.

Blog approval-sensitive fetches and API responses stay no-store, preserving immediate revocation. No new public HTML/article-result cache was introduced. Products/services retain their existing 60-second revalidation; this patch does not extend stale editorial visibility. Lazy News/Blog sanitization avoids needless CPU on lists/search, but queries can still read large stored bodies and product/service list serialization can still be expensive. The 2 MiB frontend response limit and origin/edge admission reduce exposure; query/index/content-size redesign requires a separate measured database change.

Next's process gates have constant state, no attacker-keyed IP map and no background cleanup timer. They are **per process**, reset on restart and do not coordinate across multiple Node instances. They are a last-resort capacity fuse, not visitor fairness or a distributed rate limiter. A shared backend cache is required for Laravel counters/locks; the existing database or file store may be used after validating host semantics. Do not use array/null cache in production. File cache must be shared across workers on the same host; multiple machines need a supported shared store. DB cache creates DB load itself; high-cardinality source-IP attacks can also exhaust file-cache inodes. Monitor and prune according to the hosting platform, and stop abuse at the edge.

Private previews, signed temporary uploads and authenticated editor pages must not be edge-cached. Immutable /_next/static assets can use their existing long-lived cache headers. Public UUID media may be cached only when intentionally public; private storage paths must never be exposed through a web-server alias. Optimizer widths, cold variants and actual disk cache behavior still need host validation.

## Cloudflare configuration proposal — NOT APPLIED

Use the current zone's plan capabilities, not an assumed Enterprise feature set. Current documentation lists Free: 1 rate rule, path/verified-bot matching and a 10-second window/mitigation; Pro: 2 rules; Business: 5 and richer fields/NAT-aware choices. Edge counters are approximate and may admit excess requests while enforcement propagates. Confirm available options in the account before translating these starting thresholds. [Current rate-rule availability](https://developers.cloudflare.com/waf/rate-limiting-rules/).

1. Proxy both actual frontend and API hostnames through Cloudflare only after DNS/SSL review. Use Full (strict) with a valid origin certificate; retain emergency access procedures. Verify that all required hostnames and ports are proxy-compatible.
2. Keep managed HTTP DDoS protection active and review available managed WAF rules. Validate rules against Next server-to-API calls, forms, signed uploads and Livewire before enabling bot challenges. Browser challenges on JSON/API endpoints can break SSR, fetch and form handling. Use block/429 responses for those paths; reserve managed challenges for browser document navigation when supported.
3. On Free, prioritize the public search proxy with a path-only rule:

   ```text
   http.request.uri.path eq "/api/editorial-search"
   ```

   Starting proposal: 30 requests/10 seconds/IP, block for 10 seconds. It is a burst guard, not the app's sustained allowance. If the active attack targets other dynamic paths, reallocate this one rule based on observations; Free cannot implement the whole matrix below simultaneously.
4. On Pro, keep the search rule and spend the second rule on the observed dominant abuse surface (dynamic pages, submissions or Livewire). Do not assume method/body matching or response-based counting is available on this plan. Conditions must validate in the dashboard.
5. With sufficient rules/fields (for example Business), consider these separate starting rules, tuned from staging and real legitimate traffic:

   | Surface | Proposed starting count/IP | Action / caution |
   | --- | --- | --- |
   | /api/editorial-search | 30/minute | Block/throttle where supported; do not challenge JSON. |
   | /api/v1/contact and /api/v1/newsletter | 10/minute combined | Block; existing app limits/hourly budgets still apply. |
   | /livewire/update and /livewire/upload-file | 120/minute combined | Block; account for shared-office editors. Retain credential-specific app limiter. |
   | /_next/image | 60/minute | Block; allow initial image bursts and useful cache hits. |
   | Dynamic HTML /, /search, /news*, /blog*, /watch*, /products*, /services* | 60/minute | Browser challenge only where supported; account for navigation/prefetch and verified crawlers. Exclude immutable assets. |

   These are application-specific proposals, not Cloudflare product guarantees. Choose only periods/actions supported by the plan. Do not apply the visitor search rule to the API host's server-to-server search traffic without accounting for Node egress grouping. Do not exempt clients merely because they send a cookie, user-agent or forwarding header. Avoid broad Skip rules that disable unrelated WAF phases. [Rule parameters](https://developers.cloudflare.com/waf/rate-limiting-rules/parameters/).
6. Explicitly bypass cache for admin, Livewire, JSON search/submissions, signed/private storage and preview routes. Do not deploy Cache Everything over editorial pages or override private/no-store. Cache hashed static assets; any HTML caching proposal needs publication invalidation tests. Keep operational health monitoring low-frequency and narrowly identified rather than creating a public unrestricted bypass.
7. Observe Security Events and origin metrics before tightening rules. Track status 429/413/414/5xx, latency, CPU, memory, entry processes, DB/cache load and AI quota rejections without logging form bodies, prompts or secrets. No per-denial disk logging was added in these patches.

Cloudflare managed rules/features differ by subscription; see [WAF overview](https://developers.cloudflare.com/waf/) and [DDoS protection](https://developers.cloudflare.com/ddos-protection/). No account was accessed or configuration written.

## Origin protection and Namecheap limitations

Cloudflare is bypassable when attackers can reach the public origin directly. DNS history, unproxied records or shared mail/hosting IPs can reveal it. Protect frontend and API origins, not just the browser hostname.

- Ask Namecheap whether this exact plan can restrict each web origin to current Cloudflare peer ranges, verified server-to-server callers and narrow operational exceptions. Do not paste a global firewall rule onto a shared server. If a real-IP module rewrites REMOTE_ADDR, a naive .htaccess Require ip rule may test visitors instead of connection peers and lock everyone out; have the host confirm the correct layer.
- If supported, use origin client-certificate verification/mTLS. Cloudflare's global AOP certificate proves Cloudflare-network origin, not your account specifically; account-specific certificates provide stronger separation where supported. Do not confuse an Origin CA server certificate with client-authenticated origin pulls. [AOP options](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/).
- A private tunnel avoids a publicly reachable origin but requires an approved persistent daemon and compatible networking; do not assume shared cPanel permits this. A secret header validated before PHP is a possible HTTP-layer fallback only with host support and protected secret provisioning; it does not stop network floods. No secret header was invented or committed here. [Origin protection options](https://developers.cloudflare.com/fundamentals/security/protect-your-origin-server/).
- Namecheap shared hosting uses CloudLinux account resource limits; CPU, RAM, entry processes, IO and inodes are finite. Account-level throttling can affect the entire site. cPanel access does not imply control of kernel firewall, Apache global directives, PHP pools or persistent Node processes. Determine actual limits/metrics and an escalation path with the host. [Namecheap LVE explanation](https://www.namecheap.com/support/knowledgebase/article.aspx/1127/103/a-handy-guide-to-resource-limits-or-what-is-lve/), [resource-overuse guidance](https://www.namecheap.com/support/knowledgebase/article.aspx/1128/103/ways-of-resolving-resource-overusage-issues/).
- Host-side recommendations: bounded URI/header sizes, slow-client/read timeouts, maximum body size, upload_max_filesize around 5M, post_max_size around 8M and measured worker/process caps. PHP parses multipart bodies before app validation, so an app Content-Length check is not enough. Do not globally impose a 30-second PHP limit while expecting synchronous 120-second AI images; coordinate per-surface timeouts or leave expensive AI disabled until a reviewed worker/queue design exists. Cloudflare proxy timeouts and target PHP limits must both support the selected workflow.
- The exact release lock requires PHP >=8.4.1. Next needs a supported Node runtime, persistent server and native sharp support. Verify private temporary storage, public storage link, cache locks, disk quotas and existing scheduler cleanup. Nothing in this audit confirms the actual hosting plan meets these requirements.
- Sustained distributed attacks or insufficient origin controls justify a protected VPS/managed runtime with enforceable connection/request limits, rather than simply increasing application counters or worker counts on shared hosting.

## Controlled local verification

Automated tests lower thresholds to a handful of requests; they do not generate a stress flood. PHPUnit uses APP_ENV=testing, SQLite :memory:, the existing EDITORIAL_MEMORY_ONLY guard, removed non-SQLite connections and blocked stray HTTP. No migration or seeder ran against an existing database; test-only RefreshDatabase/role fixtures are disposable.

The socket check uses `backend/tests/traffic/local-router.php` and `frontend/tests/traffic-local-load.cjs`. The router requires a disposable marker and loopback peer, replaces storage/cache/config paths, removes non-SQLite connections, disables AI and performs no migrations. The client accepts a numeric loopback port only, not a target URL. Its own temporary PHP server was stopped after testing; existing local servers were left running.

Successful run: **10 sequential health requests**, no more than four starts/second (actual origin bootstrap made it slower), concurrency **1**. Outcomes: **7 HTTP 200**, **3 HTTP 429** with Retry-After (54/53/52 seconds). Spoofed forwarding headers did not bypass admission. A 61-second simulated clock advance verified recovery without waiting a real minute or increasing traffic. Local observed times were roughly 612–1,393 ms on this workstation; these are functional-check observations, not production capacity benchmarks.

Results: `%TEMP%/meritlives-traffic-2b2ba62f12794871bb184bceff83c3c0/results.json`. Two earlier harness attempts failed before a valid JSON result because request binding and disposable view directories were not initialized; those harness issues were corrected and were not counted as passing load tests.

## Regression results and release state

Final results and the exact local patch inventory are recorded below after verification. No browser stress suite or production scan was performed. No caches, environment files, database schema or live Cloudflare/Namecheap settings were changed in production. The changes must be reviewed before any commit or rollout.

| Verification | Result |
| --- | --- |
| Final full backend suite | **150 tests / 1,131 assertions passed**, including About, Editorial, Feature Images, authorization, publication and all new admission controls. PHP 8.4.25; 512M configured test limit; 2m53s. |
| Final focused flood/upload suite | 12 tests / 75 assertions passed; includes guest/unsigned rejection, a legitimate signed editor upload, budget isolation/recovery, spoof prevention and deferred sanitization. Livewire uses tmp-for-tests during unit tests; that disk was explicitly faked, while production config is asserted local/private. |
| Frontend selected suites | 65 tests passed, including 34 form checks, About/legal/newsletter/service regressions and 6 request-gate/optimizer tests. No automatic submission retry or hidden false success introduced. |
| Production frontend build | Passed using a disposable source copy, original committed typing config, public production URL template and explicit closed-loopback API override. Fonts were downloaded from Google; no production API was accessed. |
| Separate TypeScript check | Passed: tsc --noEmit --incremental false in the disposable build copy. |
| Socket traffic verification | Ten sequential loopback requests, seven 200 / three 429, retry metadata and simulated retry recovery passed; own server stopped. |
| Whitespace and recognized secret patterns | git diff --check passed; no recognized API-key/private-key signatures found in changed files. These pattern checks are not a full-history entropy audit. |
| Existing work | All 113 original exclusions, the pre-existing local SECURITY-HARDENING-REPORT.md and protected local environment/probe files match their starting SHA-256 hashes. The existing local Next dev process regenerated next-env.d.ts when config changed; its exact original bytes were restored using the recorded hash. No existing process was stopped. |

No browser suite was repeated because this patch changes admission/HTTP behavior rather than visual layout, and real Filament/API tests cover the affected flows. One intermediate frontend timeout test failed when a proposed minimum timeout overrode its existing short configuration; the implementation now preserves finite shorter values while capping long waits. The legitimate-upload test initially lacked Livewire's special test disk; only the fixture was corrected, without weakening production rules. Final passing checks supersede those intermediate failures.

Relevant reproducible test commands (PowerShell, local only):

```powershell
Set-Location C:\Users\citi\Desktop\meritlives\backend
$env:APP_ENV='testing'
$env:DB_CONNECTION='sqlite'
$env:DB_DATABASE=':memory:'
$env:DB_URL=''
$env:EDITORIAL_MEMORY_ONLY='1'
php -d memory_limit=512M -d extension=pdo_sqlite -d extension=sqlite3 -d extension=gd vendor/bin/phpunit --colors=never

Set-Location ..\frontend
node --test --require ./tests/forms-register.cjs tests/request-flood.test.cjs tests/editorial-search-security.test.cjs tests/forms.test.cjs tests/about-data.test.cjs tests/legal-pages.test.cjs tests/newsletter.test.cjs tests/security-service.test.cjs tests/services-catalogue.test.cjs
```

For the socket check, create a fresh temporary directory with DISPOSABLE-TRAFFIC-ONLY and cache directories, set TRAFFIC_TEST_ROOT, launch the marked router with PHP -S 127.0.0.1:<unused-port>, run `node frontend/tests/traffic-local-load.cjs <port>`, and stop only that newly created server in finally. Do not point a test router at normal application storage, use an existing server or change the client to accept a production URL.

## Exact local patch/report inventory

The following 23 paths are this task's changes. The existing untracked security report and 113 excluded paths are not part of this set. Nothing is staged.

```text
backend/app/Http/Middleware/RequestSizeLimit.php
backend/app/Http/Resources/BlogPostResource.php
backend/app/Http/Resources/NewsResource.php
backend/app/Providers/AppServiceProvider.php
backend/app/Services/AiEditorial/EditorialAssistant.php
backend/app/Services/AiEditorial/ResponsesEditorialProvider.php
backend/app/Services/AiImages/FeatureImageService.php
backend/app/Services/AiStudio/AiStudioManager.php
backend/app/Services/AiStudio/OpenAiGenerationProvider.php
backend/app/Support/AiRequestGuard.php
backend/app/Support/AiRequestLimitException.php
backend/bootstrap/app.php
backend/config/traffic.php
backend/routes/api.php
backend/tests/Feature/RequestFloodProtectionTest.php
backend/tests/traffic/local-router.php
backend/docs/DDOS-PROTECTION-REPORT.md
frontend/app/api/editorial-search/route.ts
frontend/lib/api.ts
frontend/lib/request-gate.ts
frontend/next.config.mjs
frontend/tests/request-flood.test.cjs
frontend/tests/traffic-local-load.cjs
```

These patches introduce no dependency upgrade, database migration or external service. Existing release readiness gates remain, including actual PHP/Node/Namecheap compatibility, MySQL rehearsal and backups. **Recommendation: review these local patches before a separate commit; production flood resilience is not established until edge/origin protections and legitimate-traffic thresholds are validated on the real hosting topology.**

## Local commit review

Review date: 2026-11-01. Verified branch `release/meritlives-2026-10-31`, pre-commit HEAD `fcd327e21a70224bcd254bda4e84f91bf2a78260`, direct parent `286c0be9e64379e1f6f1c9b5770100eb4eb6f817`. Classified the initial **137** visible paths, then **138** after the review correction: **25** intended application/test/documentation paths and **113** preserved exclusions. The two additions to the prior 23-path inventory are the expressly reviewed earlier security report and the AI Studio creation-page correction described below. Both reports received historical-status clarification.

Review conclusions:

- Actual diffs match the described request limits, shared AI quotas/locks, signed authenticated temporary uploads, private temporary disk, lazy detail-only sanitization, bounded frontend parsing/fetch gates and image quality allowlist. Restrictive behavior changes are intentional and documented; they require legitimate-traffic and capacity tuning on staging.
- One verified quota error-path bug was found during review: CreateAiGenerationJob did not catch AiStudioException from the new create-job budget. A legitimate editor exceeding the allowance could receive a server error. The creation handler now sends the safe danger notification and throws Filament Halt with transaction rollback requested, preserving the unsaved form and preventing record creation. A regression invokes that actual handler against an exhausted real budget and verifies the notification/rollback flag; all database connections are blocked during this check. The patch neither changes quotas nor grants permission.
- The High Blog approval bypass remains fixed: non-reviewer saves force draft, false approval, null publication time and featured false. Ownership/reviewer controls and the existing actual-Livewire regression remain unchanged from the earlier security commit. An additional database-free author-save check passed in this review.
- Both reports contain historical findings, public documentation references, code paths, fake/reserved test addresses and local evidence pointers. No real credentials, populated environment files, private keys, database dumps or browser evidence are included. Historical dependency results are not presented as a newly refreshed advisory query.
- Preserve `frontend/next-env.d.ts`, `frontend/tsconfig.json`, all 111 untracked browser-evidence/run-pointer files and ignored local environments/builds/dependencies. Exclusion and protected-file SHA-256 hashes were recorded before verification and must match after committing. No reset, clean, stash, revert or unrelated file deletion is part of this operation.

Verification rerun for this commit:

| Check | Result |
| --- | --- |
| Migration-free backend checks | **9 tests / 53 assertions passed**, including the new quota-notification regression. A temporary runner reused the database-independent request-flood regressions and added a direct author-save approval assertion. It disabled RefreshDatabase migration fixtures, rejected seed calls and migration/seeder console commands, blocked all database connectors and retained the existing stray-HTTP guard. No schema, migration or seeder ran. |
| Frontend regressions | **65 tests passed**: forms, About data, legal, newsletter, service catalogue, search/flood gates and optimizer settings. |
| Production Next build | **Passed**, including lint/type validation, page generation and traces, in a disposable source copy. The API URL was an explicit closed loopback port, not production. Existing local generated configuration was not used or overwritten. |
| Standalone TypeScript | **Passed**, tsc --noEmit --incremental false in that disposable copy. |
| Whitespace | git diff --check passed; staged verification is required immediately before commit. |
| Secret/path scan | No recognized API key/private-key signatures or credential-like assignments in the 24 candidate paths. No credential environment, dump or private-key path selected. This is a pattern/path review, not a full-history entropy audit. |

The earlier **150 tests / 1,131 assertions** full backend run and the ten-request socket check remain prior audit evidence. They were **not rerun here**: the full suite invokes migrations/seeders for disposable fixtures, which this commit request explicitly prohibits. This review does not weaken tests or production controls to bypass that restriction; the temporary migration-free runner is outside the repository and is not committed.

Exact reviewed commit inventory (25 paths):

```text
backend/app/Http/Middleware/RequestSizeLimit.php
backend/app/Filament/Resources/AiGenerationJobResource/Pages/CreateAiGenerationJob.php
backend/app/Http/Resources/BlogPostResource.php
backend/app/Http/Resources/NewsResource.php
backend/app/Providers/AppServiceProvider.php
backend/app/Services/AiEditorial/EditorialAssistant.php
backend/app/Services/AiEditorial/ResponsesEditorialProvider.php
backend/app/Services/AiImages/FeatureImageService.php
backend/app/Services/AiStudio/AiStudioManager.php
backend/app/Services/AiStudio/OpenAiGenerationProvider.php
backend/app/Support/AiRequestGuard.php
backend/app/Support/AiRequestLimitException.php
backend/bootstrap/app.php
backend/config/traffic.php
backend/routes/api.php
backend/tests/Feature/RequestFloodProtectionTest.php
backend/tests/traffic/local-router.php
backend/docs/DDOS-PROTECTION-REPORT.md
backend/docs/SECURITY-HARDENING-REPORT.md
frontend/app/api/editorial-search/route.ts
frontend/lib/api.ts
frontend/lib/request-gate.ts
frontend/next.config.mjs
frontend/tests/request-flood.test.cjs
frontend/tests/traffic-local-load.cjs
```

Requested separate local commit subject: `fix(security): harden application and DDoS protections`. The commit's SHA is reported after creation rather than embedded into its own content. **Ready for hosting preparation/planning; not ready for production deployment.** Outstanding gates include PHP >=8.4.1 and Node/hosting support, protected origin/Cloudflare configuration, shared cache/lock semantics, worker/memory/time limits, MySQL backup/restore and rehearsal, and publication/permissions rollout. The documented 18 Medium development-tooling nodes remain open. No push, merge/rebase, deployment, production access, DNS/Cloudflare operation or real AI request is authorized by this review.
