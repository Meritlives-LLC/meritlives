# CMS-managed About page

## Implementation

The existing `/about` page now uses scoped white/neutral styling, MERITLIVES red, the existing fonts, and existing professional photography. It includes the supplied hero, company statement, story, mission/vision, service cards, core values, five-step approach, real product catalogue, and final CTA. Unsupported company-history/performance claims from the previous About page were removed. The shared header/footer and other public pages were not edited.

The singleton admin screen is **Content → About Page**, `/admin/about-page`. It uses Filament sections, repeaters, existing raster uploads, and the existing `manage_settings` permission plus an admin/super_admin role check. Authorization is rechecked for every save, preview and publish method.

There is **no new table, model, migration or permission seeder requirement**. Two JSON records in the existing settings table hold separate snapshots:

- `about_page_draft`: saved work; not read by the public API.
- `about_page_published`: the explicitly published snapshot.

Save draft leaves the published snapshot intact. Preview changes renders an admin-only content preview of the current unsaved form, including uploaded images. This is a content preview, not a WYSIWYG rendering of the Next.js layout. Publishing uses an explicit Filament confirmation modal and an atomic transaction. CTA destinations remain the existing `/contact` and `/services` routes.

## API and data

`GET /api/v1/pages/about` returns `{ "data": { ...publishedContent } }`. It is covered by the existing public-read throttle and returns no-store cache directives. It exposes no draft-selection parameter or public preview route. Before the first publication it returns the supplied source defaults from `content/about.json`; reads do not create settings records.

The shared defaults file is required alongside both applications when packaging the repository. The frontend imports the same file used by Laravel config. If the API is unavailable, the public page uses these source defaults rather than exposing or inventing draft content.

Services and products reuse the existing frontend catalogues and route destinations. Administrators may also select published CMS services/products; those are resolved through existing detail endpoints by slug, so records beyond a listing's first page are supported. Failed/unpublished custom selections are omitted. Existing catalogue names/descriptions are retained without invented capabilities or statistics.

Images reuse `RasterUpload` (public disk, generated names, raster MIME/extension/dimension/size checks). They use `general/` storage, with explicit image descriptions for hero and story. Existing stock photographs remain the defaults. The Next.js component uses responsive optimized images and prioritizes the hero. Other About photographs are requested at low priority to avoid the native lazy-loading failure observed during mobile browser checks. Loopback storage images bypass the production-only optimizer allowlist during isolated tests; production configured storage images use the existing optimizer policy.

Metadata includes a canonical About URL, SEO title/description, Open Graph image and Twitter summary card. No fabricated founders, offices, certifications, achievements, testimonials, company statistics or structured company claims were added. Motion respects reduced-motion settings.

## Files

- `content/about.json`: shared supplied content and initial selections.
- `frontend/app/about/page.tsx`: dynamic server page and metadata.
- `frontend/components/AboutPage.tsx`, `AboutPage.module.css`: page layout and scoped responsive styles.
- `frontend/lib/about.ts`: published content fetch, image-origin handling and existing catalogue/CMS record resolution.
- `backend/config/about.php`: shared defaults and existing catalogue selection labels.
- `backend/app/Services/AboutPageContent.php`: authorization, validation, snapshots and public projection.
- `backend/app/Http/Controllers/Api/V1/AboutPageController.php`, `backend/routes/api.php`: public read endpoint.
- `backend/app/Filament/Pages/ManageAboutPage.php`, `backend/resources/views/filament/pages/manage-about-page.blade.php`: singleton editor and private content preview.
- `backend/app/Providers/Filament/AdminPanelProvider.php`: discovery of the new Filament page.
- `backend/tests/Feature/AboutPageTest.php`: CMS, API, image, authorization and confirmation tests.
- `frontend/tests/about-data.test.cjs`, `frontend/tests/about-browser.cjs`: data and browser checks.
- `backend/tests/browser/about-app.php`: disposable About fixture/server wrapper.
- `backend/tests/browser/editorial-app.php`: one test-only addition configuring Livewire's temporary upload disk inside isolated storage.
- `frontend/next-env.d.ts`, `frontend/tsconfig.json`: Next.js-generated references for the isolated build directories; prior edits preserved.
- `backend/tests/browser/about-evidence/`: browser results, screenshots and isolation evidence.

## Checks

- Initial isolated Laravel run: **27 tests / 191 assertions passed**, including About (7), AI Editorial Assistant (14), Editorial API Integration (3), Filament Resource Authorization (3).
- Final focused About run after the publish confirmation fix: **8 tests / 46 assertions passed**. Includes guest/editor/author denial; draft isolation; publish confirmation; repeaters/selections; valid raster storage; external-media rejection.
- Frontend data tests: **3 passed**, verifying slug-based resolution, hiding unpublished custom products and external-image fallback.
- TypeScript validation passed; final production build (including lint/type checks) passed in `.next.about-release-check`.
- Public browser run: **9 checks passed**, including all four viewport/image checks, 13 working service/product destinations, canonical/Open Graph metadata, reduced motion and no uncaught JavaScript errors.
- CMS browser run: **8 checks passed**, including actual admin login, private draft save/preview, hero-image replacement/upload, publish confirmation, published media reaching the frontend and later draft isolation.
- `git diff --check` passed.

### Final browser evidence

| Scenario | Result | Evidence |
|---|---|---|
| 320px layout and all images | PASS | [Screenshot](../tests/browser/about-evidence/about-320.png) |
| 390px layout and all images | PASS | [Screenshot](../tests/browser/about-evidence/about-390.png) |
| 768px layout and all images | PASS | [Screenshot](../tests/browser/about-evidence/about-768.png) |
| 1440px layout and all images | PASS | [Screenshot](../tests/browser/about-evidence/about-1440.png) |
| Admin draft preview | PASS | [Content preview](../tests/browser/about-evidence/admin-preview.png) |
| Explicit publication | PASS | [Confirmation](../tests/browser/about-evidence/admin-publish-confirmation.png) |
| Public route/link/SEO/motion checks | PASS | [Public results](../tests/browser/about-evidence/public-results.json) |
| Admin save/upload/publish/isolation checks | PASS | [CMS results](../tests/browser/about-evidence/cms-results.json) |
| Disposable database and separate snapshots | PASS | [Isolation evidence](../tests/browser/about-evidence/isolation.json) |

Screenshots were visually inspected. There was no horizontal overflow at the tested widths. Existing service/product destinations returned 200 using disposable published fixtures; the current MySQL catalogue was not queried. Both local test servers were stopped after acceptance. Temporary test data/storage is retained for review, with no real business records.

### Defects and limitations

The browser caught and verified a fix for the initial publish action bypassing its confirmation modal: a mounted callback is required, rather than a direct Livewire method-name handler. A regression test now proves that mounting the action does not publish until confirmation.

The mobile browser checks exposed native lazy-loaded images remaining unloaded despite being visible. About photography now uses explicit requests with low fetch priority except for the high-priority hero, retaining Next.js responsive image optimization. The final checks load and decode every image at every requested width. No browser-side style or loading-attribute overrides are used in final acceptance.

Test-harness corrections included configuring Livewire's `tmp-for-tests` disk in disposable storage, waiting for uploads to finish, using the normal remove/save/upload sequence when replacing an existing file, and avoiding global network-idle waits while Next.js prefetches links. Diagnostic failure images/JSON are retained as history; `cms-results.json` and `public-results.json` are the final results.

No blocking issue remains in the verified local scope. Real MySQL publishing was deliberately not exercised; use an authorized admin to publish in a non-disposable environment when approved. Preview is content-only rather than an exact public-layout preview. Other browser engines and manual screen-reader testing were not performed. The shared defaults file must be included when packaging both applications.

Backend tests used `EDITORIAL_MEMORY_ONLY=1`, `APP_ENV=testing`, `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, empty `DB_URL` and the existing fail-closed database guard. Browser tests use the separately marked disposable SQLite file and storage from the earlier editorial harness. No existing MySQL or production database was accessed or modified. No real AI requests were made. No deployment or push was performed.

## Safe local preview

Use the existing marked disposable browser run directory. If it no longer exists, first create a fresh disposable directory using `tests/browser/README.md`; do not point these commands at an existing application database.

In `backend`:

```powershell
$env:EDITORIAL_BROWSER_ROOT = (Get-Content tests/browser/run-root.txt -Raw).Trim()
php -d extension=pdo_sqlite -d extension=sqlite3 tests/browser/about-app.php about-fixtures
php -d extension=pdo_sqlite -d extension=sqlite3 -d max_execution_time=180 -S 127.0.0.1:3187 -t public tests/browser/about-app.php
```

In `frontend`, in a separate terminal:

```powershell
$env:NEXT_DIST_DIR = '.next.about-release-check'
$env:NEXT_PUBLIC_API_URL = 'http://127.0.0.1:3187/api/v1'
$env:NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3188'
# Build first if this directory is not present:
npm.cmd run build
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3188
```

Public preview: `http://127.0.0.1:3188/about`.
Admin: `http://127.0.0.1:3187/admin/about-page`.
Disposable fixture login: `about-admin@example.test` / `Disposable-About-Only-483!`. This account exists only in the isolated SQLite file, not in MySQL.

Browser checks, from `frontend`:

```powershell
node tests/about-browser.cjs --cms-only
node tests/about-browser.cjs --public-only
node --test --require ./tests/forms-register.cjs tests/about-data.test.cjs
```

Stop both servers with Ctrl+C. No `.env` changes are needed. Publishing from this isolated admin writes only disposable test settings. To activate CMS-managed content in another environment, an authorized administrator must publish there; this task did not write to that database.
