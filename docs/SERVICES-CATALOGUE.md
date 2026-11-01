# Services catalogue verification

The eight source-managed marketing entries live in `frontend/lib/service-catalogue.ts`. They remain discoverable when CMS data is unavailable without creating records or bypassing detail-route publication controls. Additional published CMS services use bounded 50-item pagination, case-insensitive deduplication and retry without losing existing entries.

## Remaining route decision

Web Development still requires an eligible CMS detail response and renders locally. Maintenance & Development uses the generic CMS route. Local verification found `NEXT_HTTP_ERROR_FALLBACK;404` and `noindex` after an initial HTTP 200. A content owner must supply an eligible published `ongoing-maintenance` record, or approve a dedicated page implementation. No records were created or published. The other six dedicated routes render independently of those CMS records. All eight catalogue links remain visible.

## Assets

No missing photographs. Four distinct licensed professional photos fill the editorial sections. Sources are documented in `frontend/public/services/ASSET-CREDITS.md` and `frontend/public/security/ASSET-CREDITS.md`. Stock subjects are not represented as staff or customers.

## Reproduce isolated checks

From `frontend`, run:

- `node --test --require ./tests/forms-register.cjs tests/services-catalogue.test.cjs tests/security-service.test.cjs`
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`
- `node tests/services-catalogue-fixtures.cjs` (GET-only API on 3139; keep running)

Build in another terminal with `NEXT_DIST_DIR=.next.services-catalogue-check`, `NEXT_PUBLIC_API_URL=http://127.0.0.1:3139/api/v1`, `NEXT_PUBLIC_SITE_URL=https://meritlives.com`, `NEXT_TELEMETRY_DISABLED=1`, then `npm.cmd run build`. Google Fonts may require network permission. Start with the same variables using `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3138`.

Run `node tests/services-catalogue-browser.cjs`. It checks 375/768/1440px layouts, optimized image decoding, eight links, alternating sections, mobile image ordering, 1/2/4 grid columns, focus, CTA text color, overflow and browser errors. Requests are restricted to local GET/HEAD. The absent Maintenance fixture deliberately exercises streamed not-found behavior. No database is used.

Restore build-generated `tsconfig.json` and `next-env.d.ts` changes from a task-start copy to preserve any pre-existing edits.
