# Security Audit & Hardening service page

## Route and content ownership

`frontend/app/services/security/page.tsx` is an explicit App Router route that takes precedence over `services/[slug]`. It renders the reusable SecurityServicePage component without an API/database lookup. Previously the slug fell through to `getService`, where a missing/unpublished service or unavailable API became a 404. No database was queried to infer which condition applied locally.

This is source-managed, approved marketing content, matching the existing dedicated service-page approach. It does not retrieve or publish a CMS draft. Laravel's published-service filters, permissions and public APIs are unchanged. A published CMS service with slug `security` appears once in the catalogue; otherwise a source-managed card links to the static page. The card remains discoverable if the CMS catalogue is unavailable. Other service content and navigation/footer designs are unchanged.

Future ownership decision: if editors should control this page through Laravel, define which content and media are managed and how publication status applies before replacing the explicit route. An admin toggling a CMS security record does not currently unpublish this independent source-managed page. No synthetic record IDs, automatic CMS writes, migrations or seeding are used.

## Media

Three licensed stock photographs are local under `frontend/public/security`; sources and limitations are recorded in `ASSET-CREDITS.md` there. They are not represented as actual staff or security engagements. Approved MERITLIVES photography can replace them later without changing the page structure.

Optional public variables follow the existing service pattern:
- `NEXT_PUBLIC_SECURITY_SHOWCASE_VIDEO_URL`
- `NEXT_PUBLIC_SECURITY_SHOWCASE_CAPTIONS_URL`

Use an approved HTTPS URL or a same-origin absolute path. Empty/invalid values leave the static image fallback; no video URL or controls are invented. Public visitors never see setup instructions. Review external media origins for CSP compatibility before configuration. No video/captions were supplied or fetched in this task.

Metadata includes title, description, canonical, Open Graph and Service JSON-LD without certification, rating, pricing or guaranteed protection claims. Canonical uses the configured HTTPS site origin, otherwise https://meritlives.com; staging should set its intended site origin explicitly.

## Verification

Component tests run with `node --test --require ./tests/forms-register.cjs tests/security-service.test.cjs` from frontend. Browser checks use an isolated build and mock API; contact POSTs are intercepted and never reach Laravel. See test source for fixed loopback origins. Existing form regression tests remain separate and unchanged.

Do not deploy verification build directories: they deliberately point to local test infrastructure. No production operations or real enquiries are part of these checks.


Verified in this task:
- Requested `http://localhost:3000/services/security` returned HTTP 200 with the new headline and title.
- Six focused component/route/catalogue/media tests passed; all 34 existing mocked form tests passed.
- Browser checks passed at 320, 390, 768 and 1440px against the isolated production build: HTTP 200, title/canonical, three distinct loaded image assets, unclipped headings, no horizontal overflow, keyboard FAQ interaction, approach anchor, catalogue discovery and mocked enquiry 422/success responses.
- TypeScript and production build passed (18 static generation tasks); the first build attempt failed on Google Fonts DNS, then succeeded on retry with no font changes.
- No real enquiry, API write, CMS publication, migration or seeder was performed. Laravel and existing source-managed service routes remain unchanged.

Reproduce the browser check with the existing GET-only `tests/forms-mock-api.cjs` fixture server on port 3139, build/start this task's `.next.security-service-check` artifact on loopback port 3138 and run `node tests/security-service-browser.cjs`. Build with `NEXT_PUBLIC_API_URL=http://127.0.0.1:3139/api/v1`, `NEXT_PUBLIC_SITE_URL=https://meritlives.com`, and empty security video/caption variables to verify the no-video fallback. The existing localhost:3000 development page can also be checked using `SECURITY_PAGE_TEST_ORIGIN=http://localhost:3000`; its category requests and enquiries are mocked and its CMS catalogue is not navigated.
