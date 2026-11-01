# AI Feature Image Generator — implementation and acceptance

Date: 2026-10-31. **Mock acceptance PASS:** 75 image browser checks and 73 existing writing browser checks, across all requested viewports. This extends the existing Filament/Livewire editorial assistant; it does not replace writing generation. Live OpenAI image generation is **NOT VERIFIED** and was never activated or called.

## Architecture and operation

News and Blog create/edit headers now expose **AI Feature Image**, with an additional entry inside the existing AI Assist panel. Editors can generate from bounded current article context or a custom prompt, choose five styles and three aspect ratios, inspect a protected preview, edit the prompt, regenerate, save to the existing Media Library, or assign to the existing `featured_image` upload field. Opening and cancelling do not generate anything. Regeneration requires another explicit submission. Failed regeneration retains the previous preview and editor content.

Assignment requires image/alt-text review and separate confirmation when replacing an image. It changes the editor state only; the editor must use the normal article Save/Create action. Existing editorial draft enforcement is reused: News becomes pending/unpublished/unfeatured; Blog becomes draft/unapproved, with publication fields cleared. A Media Library save alone neither assigns an image nor saves an article. Existing article fields and writing suggestions remain independent.

`App\Services\AiImages` contains `FeatureImageService`, `ImagePromptBuilder`, `ImageProcessor`, `ImageProvider`, `MockImageProvider`, `OpenAiImageProvider`, and normalized `ImageException`. Existing `AiGenerationJob`, `AiAuditEvent`, `Media`, filesystem disks and `RasterUpload` are reused. New jobs use distinct type `feature_image`, preventing attachment through the older AI Studio image workflow.

Prompts use the headline, excerpt, relevant body and category, requested style and crop. They request conceptual editorial imagery, natural light, no text/watermarks/fabricated logos, and no false documentary depiction. African contexts are included only when supported by article context; unrelated places, people and branding are not automatically added. Image generation does not fact-check articles.

## Configuration and live-provider gates

The real environment file was not edited. New defaults are disabled/mock/nonbillable. For an explicitly disposable local environment only:

```dotenv
AI_IMAGE_ENABLED=true
AI_IMAGE_PROVIDER=mock
AI_IMAGE_ALLOW_BILLABLE=false
AI_IMAGE_MODEL=
AI_IMAGE_QUALITY=medium
AI_IMAGE_PER_MINUTE=3
AI_IMAGE_PER_DAY=20
```

Image configuration is independent of `AI_EDITORIAL_PROVIDER`. The OpenAI credential stays server-side in the existing `ai_studio.api_key` configuration. Real requests require both administrator `AI_IMAGE_ALLOW_BILLABLE=true` and a fresh editor cost confirmation. Regeneration resets that confirmation. No automatic retries multiply charges. There is no browser API key or editor-controlled provider endpoint. Production PHP must have **GD**, fileinfo and the usual Laravel extensions enabled; missing GD fails before requesting an image.

Official documentation was checked before implementing the real adapter: [Images generation reference](https://developers.openai.com/api/reference/resources/images/methods/generate), [image generation guide](https://developers.openai.com/api/docs/guides/image-generation), [GPT Image 1.5 model](https://developers.openai.com/api/docs/models/gpt-image-1.5), and [pricing](https://developers.openai.com/api/docs/pricing). Model availability and pricing must be checked again before live enablement. The adapter uses server-authenticated `POST /v1/images/generations`, one image, configured model/quality, PNG output and `data[0].b64_json`; it does not fetch arbitrary provider URLs or request obsolete `response_format` behavior. The reviewed model allowlist is in `config/ai_image.php`; no live account/model availability was tested. Prices vary with model, quality and image tokens; account rate limits vary by usage tier. Local request limits are not a monetary spending cap.

Only supported native dimensions are sent, then safely center-cropped/resampled:

| Requested ratio | Provider dimensions | Stored dimensions |
|---|---|---|
| 16:9 | 1536×1024 | 1280×720 |
| 1:1 | 1024×1024 | 1024×1024 |
| 4:5 | 1024×1536 | 1024×1280 |

Timeouts are 5 seconds connecting and 120 seconds overall. Responses are bounded to 8 MiB JSON and 5 MiB decoded image, four megapixels, valid JPEG/PNG/WebP bytes with actual image decoding. Output is metadata-stripped optimized JPEG. The mock produces deterministic, repeatedly labelled **MOCK TEST IMAGE — NOT A REAL EVENT** imagery. Server-only failure, quota, malformed output and bounded delay scenarios never access external services.

## Storage, provenance and security

Private UUID previews live on the existing `local` disk under `ai-studio/feature-previews`, with SHA-256/size/MIME integrity checks and a 30-minute lifetime. `GET /admin/feature-images/{job}/preview` uses the real Filament admin authentication, editorial permission, record ownership/context and job-owner checks; it returns private/no-store/nosniff images. Expired previews cannot be saved. `php artisan ai-images:cleanup` is scheduled every ten minutes; it removes expired/abandoned files only from this feature's private namespace, preserving public Media and older AI Studio previews. Production scheduler operation was not executed.

Media saves use `RasterUpload::store(..., 'general')`, UUID filenames, existing public disk validation and an SQL transaction. No base64 is stored in the database. Alt text, dimensions, MIME, size and AI disclosure/provider/style/ratio/job provenance are stored on existing Media records. Media UI shows provenance. News/Blog public resources expose `featured_image_alt` and `featured_image_disclosure`; list/detail frontend components render those fields. Metadata is loaded in batches. Draft content remains excluded by existing publication/approval rules.

Authorization requires the existing News/Blog editorial permission plus `manage_media`; existing Blog ownership restrictions apply. Locked Livewire job/input state and server-side checks prevent job substitution. User locks prevent concurrent requests; three attempts per minute and twenty per rolling 24 hours are shared across News/Blog, counting failures. Audit events record generation/failure, Media save, form assignment and discard, without provider secrets. Provider responses and credentials are not shown in errors. Preview paths are constrained to the feature's UUID namespace.

## Database change requiring approval

`database/migrations/2026_10_31_000001_add_ai_metadata_to_media.php` adds one nullable JSON `metadata` column to the existing Media table. No new article table or image-URL column is introduced. It was applied only in isolated tests and the marked disposable browser SQLite database. **It has not been applied to existing MySQL or production. Approval is required before doing so.** Generation fails with an explicit configuration message until the column exists.

## Executed automated tests

All SQL-writing PHPUnit tests ran with `EDITORIAL_MEMORY_ONLY=1`, `APP_ENV=testing`, `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, empty `DB_URL`. The pre-provider test guard rejects unsafe configuration, removes non-SQLite connections, blocks persistent SQLite paths and prevents stray HTTP requests. `RefreshDatabase`, role fixtures, factory users and fake storage are disposable. This is actual in-memory SQL persistence, not mocked saves.

Commands use `php -d extension=pdo_sqlite -d extension=sqlite3 -d extension=gd vendor/bin/phpunit --testdox --do-not-cache-result` with the isolation variables above.

| Check | Executed result | Evidence |
|---|---|---|
| Existing `AiEditorialAssistantTest` alone | PASS, 14 tests / 96 assertions | Console execution |
| Combined image + editorial/API/security/authorization/legacy AI Studio/OpenAI regression | PASS, 73 tests / 646 assertions | `tests/feature-image-results.xml` |
| Final expanded `FeatureImageGeneratorTest` | PASS, 23 tests / 274 assertions | `tests/feature-image-focused-results.xml` |
| `EditorialIsolationTest` | PASS, 1 test / 14 assertions; empty SQLite database filename, unavailable MySQL/WordPress/MariaDB/PostgreSQL/SQL Server connections and rejected persistent SQLite path | `tests/feature-image-isolation-results.xml` |
| Frontend `npm.cmd run test:forms` | PASS, 34 tests | Console execution |
| `npx.cmd tsc --noEmit --incremental false` | PASS | Console execution |
| Frontend `npm.cmd run build`, `NEXT_DIST_DIR=.next.feature-image-check`, loopback API, telemetry disabled | PASS | Build completed including compilation, lint/type checking and route generation |
| `git diff --check` | PASS | Exit 0; existing line-ending conversion warnings only |

Combined filter: `FeatureImageGeneratorTest|AiEditorialAssistantTest|EditorialApiIntegrationTest|SecurityRemediationTest|FilamentResourceAuthorizationTest|AiStudioWorkflowTest|OpenAiGenerationProviderTest`. Counts overlap; they must not be summed as unique tests. All real-adapter tests use Laravel HTTP fakes, not OpenAI requests.

The 23 image tests cover isolation; article/custom prompts; all five styles and three normalized ratios; deterministic mock/delay; guests, permissions and ownership; invalid/oversized/disabled input; safe failure/quota/malformed images and audits; fake OpenAI request contract; both billing gates; fake quota/malformed/oversized responses; authenticated expiring previews; cleanup/path traversal; Media idempotency/alt/disclosure/dimensions; successful and failed regeneration; News replacement review; Blog content/draft/approval preservation; Media-only save; minute/day limits; form preservation; API metadata without publishing; fresh regeneration cost confirmation; orphan cleanup preserving legacy previews.

## Browser acceptance

The existing marked disposable SQLite browser harness is reused through `tests/browser/feature-image-app.php`. It verifies the exact temporary database path before providers run, removes all other connections, rejects any other SQLite path and blocks external DB connectors. Storage, sessions and cache are in the same marked temporary directory. Backend HTTP stray requests are blocked; Playwright aborts every non-loopback browser request. Both providers are forced to mock and billable requests disabled. Test-only editor credentials and fictional article records never enter existing MySQL. Actual admin login and actual disposable SQL-backed draft saves are exercised.

Final image browser command: `node tests/feature-image-browser.cjs`, exit 0, **75/75 PASS**. Final writing regression command: `node tests/feature-image-writing-regression.cjs`, exit 0, **73/73 PASS** (25 at 1440px, 24 at 768px and 24 at 390px; the additional desktop case is duplicate-source validation). The writing wrapper executes the existing scenario source, adding readiness waits and separate evidence; it does not remove assertions or suppress errors. Final runs were sequential. No live-provider behavior is represented as browser-verified.

| Image browser scenario | 390px | 768px | 1440px |
|---|---|---|---|
| Actual authorized admin login | PASS | PASS | PASS |
| Open image workspace through existing AI Assist section | PASS | PASS | PASS |
| Article context, default style and all style options | PASS | PASS | PASS |
| Keyboard opening, Tab/Shift+Tab focus containment | PASS | PASS | PASS |
| Escape/cancel preserves editor and restores focus | PASS | PASS | PASS |
| Explicit Generate and loading indicator | PASS | PASS | PASS |
| Protected 16:9 mock preview with disclosure | PASS | PASS | PASS |
| Preview modal/controls fit viewport | PASS | PASS | PASS |
| Review confirmation required before Media save | PASS | PASS | PASS |
| Media-only save preserves article and feature-image field | PASS | PASS | PASS |
| Corrected validation clears after successful save | PASS | PASS | PASS |
| Assignment populates existing upload field only | PASS | PASS | PASS |
| Edit Prompt opens without generating | PASS | PASS | PASS |
| Regenerate requires explicit prompt submission | PASS | PASS | PASS |
| Existing-image replacement requires confirmation | PASS | PASS | PASS |
| Regenerated 1:1 image replaces selected image | PASS | PASS | PASS |
| Actual News save forces pending/private despite published selection | PASS | PASS | PASS |
| Actual Blog 4:5 image save preserves body, draft and unapproved state | PASS | PASS | PASS |
| Page has no horizontal overflow | PASS | PASS | PASS |
| No uncaught browser errors | PASS | PASS | PASS |
| Native required validation focuses correct prompt field | PASS | PASS | PASS |
| Provider failure preserves prompt/article | PASS | PASS | PASS |
| Quota exhaustion preserves prompt/article | PASS | PASS | PASS |
| Invalid image error preserves prompt/article | PASS | PASS | PASS |
| Fourth request is rate-limited without generation | PASS | PASS | PASS |

News workflow, Blog workflow, authorization, actual disposable draft saves, approval preservation and responsive mock browser acceptance are **PASS**. Authorization/ownership denial, daily limits, expired previews and cleanup are additionally verified by the PHPUnit cases. No unresolved application defect was found in the final executed mock scenarios. Live provider/account behavior and production operation remain **NOT VERIFIED**.

Machine-readable evidence:

- [75 image scenario results](../tests/browser/feature-image-evidence/browser-results.json).
- [73 writing regression scenario results](../tests/browser/feature-image-evidence/writing-regression/results.json).
- [Database isolation and actual draft records](../tests/browser/feature-image-evidence/isolation-and-drafts.json).
- [Image PHPUnit results](../tests/feature-image-focused-results.xml), [related regression results](../tests/feature-image-results.xml), [isolation proof](../tests/feature-image-isolation-results.xml).

The final snapshot proves SQLite-only connections to `C:\Users\citi\AppData\Local\Temp\meritlives-editorial-browser-8dcbda4b2e0e432486f3e5769d5f199a\database.sqlite`, writing/image providers both `mock`, billable=false, public News=0 and public Blog=0. It contains eight image-assisted pending News drafts, six draft/unapproved Blog posts, 22 generated Media records and 46 image jobs, including earlier acceptance/debug reruns and deliberate failures. These are disposable records, not existing MERITLIVES data. Public detail requests for the newly saved draft slugs returned 404.

The isolated PHP browser server was stopped after evidence capture; port 3187 has no listener. Disposable storage and evidence remain available for review and the guarded local-preview instructions below.

Screenshots are under `tests/browser/feature-image-evidence/`. Key final states:

| State | 390px | 768px | 1440px |
|---|---|---|---|
| Generation controls | [image](../tests/browser/feature-image-evidence/390-generation.png) | [image](../tests/browser/feature-image-evidence/768-generation.png) | [image](../tests/browser/feature-image-evidence/1440-generation.png) |
| Preview and successful Media save | [image](../tests/browser/feature-image-evidence/390-preview-and-media.png) | [image](../tests/browser/feature-image-evidence/768-preview-and-media.png) | [image](../tests/browser/feature-image-evidence/1440-preview-and-media.png) |
| Replacement validation | [image](../tests/browser/feature-image-evidence/390-replacement-confirmation.png) | [image](../tests/browser/feature-image-evidence/768-replacement-confirmation.png) | [image](../tests/browser/feature-image-evidence/1440-replacement-confirmation.png) |
| Saved Blog draft | [image](../tests/browser/feature-image-evidence/390-blog-draft.png) | [image](../tests/browser/feature-image-evidence/768-blog-draft.png) | [image](../tests/browser/feature-image-evidence/1440-blog-draft.png) |
| Quota error with preserved prompt | [image](../tests/browser/feature-image-evidence/390-error-quota.png) | [image](../tests/browser/feature-image-evidence/768-error-quota.png) | [image](../tests/browser/feature-image-evidence/1440-error-quota.png) |

Additional final screenshots use `{width}-loading.png`, `{width}-news-draft.png`, `{width}-blog-portrait.png`, `{width}-error-failure.png` and `{width}-error-invalid.png`. Historical `*-failure.png` captures belong to earlier failed test/debug attempts, not the final matrix. Earlier fast-navigation writing evidence under `tests/browser/evidence/results.json` recorded two lazy-load error failures; the final readiness-aware regression results linked above supersede that run. The source writing scenarios were preserved.

### Safe local preview

The tested disposable root is recorded in `tests/browser/run-root.txt` and must still contain its `DISPOSABLE-EDITORIAL-ONLY` marker. From `backend`, restart only the test entry point (never the normal database-backed server for this preview):

```powershell
$env:EDITORIAL_BROWSER_ROOT=(Get-Content tests/browser/run-root.txt -Raw).Trim()
php -d extension=pdo_sqlite -d extension=sqlite3 -d extension=gd -d max_execution_time=180 -S 127.0.0.1:3187 -t public tests/browser/feature-image-app.php
```

Visit `http://127.0.0.1:3187/admin/login`. Disposable credential conventions are defined in `tests/browser/feature-image-app.php`; the current account suffix is in the marked root's `image-user-suffix.txt`. These credentials apply only to that disposable database. From `frontend`, `node tests/feature-image-browser.cjs` exercises all three widths; `--width=1440` reruns and replaces only that width's evidence. `node tests/feature-image-writing-regression.cjs` runs the established writing scenarios with explicit asset-readiness waits and separate evidence, leaving the original scenario source unchanged. Do not point either script at another application origin or database.

## Defects discovered and corrected

- The first guest-preview test exposed a redirect to a nonexistent generic `login` route. The new preview route now uses the existing Filament panel/auth middleware; guest/auth tests pass without weakening controls.
- Replacing the writing modal with the image modal left browser focus on the document body. A bounded, visibility-aware focus handoff was added to the generation method input.
- A manual review validation error remained visible after a successful Media save. Successful validation now clears only the image-review field errors.
- An initial browser assertion expected a server error for an empty native-required textarea. The test now checks native invalidity and focus on that exact field; backend field-error validation is tested separately.
- Rapid test navigation exposed asynchronous Filament asset loading, and a literal `[contenteditable=true]` selector did not match the initialized Trix editor's equivalent editable state. Browser scripts now wait for navigation assets and the DOM `isContentEditable` property before typing. These waits preserve the scenarios and do not suppress browser errors.

## Task-owned files

Created: `config/ai_image.php`; `app/Services/AiImages/{ImageProvider,ImageException,ImagePromptBuilder,MockImageProvider,OpenAiImageProvider,ImageProcessor,FeatureImageService}.php`; `app/Filament/Resources/Concerns/HasFeatureImageAssistant.php`; `app/Http/Controllers/Admin/FeatureImagePreviewController.php`; `app/Console/Commands/CleanupFeatureImagePreviews.php`; `app/Support/EditorialImageMetadata.php`; the Media metadata migration; `tests/Feature/FeatureImageGeneratorTest.php`; `tests/browser/feature-image-app.php`; `../frontend/tests/feature-image-browser.cjs`; `../frontend/tests/feature-image-writing-regression.cjs`; this report and test evidence.

Extended existing files: `.env.example`; `app/Models/Media.php`; `app/Providers/AppServiceProvider.php`; `routes/web.php`; `routes/console.php`; `HasEditorialAssistant.php`; `MediaResource.php`; News/Blog/Search API controllers; News/Blog API resources; test-only `tests/browser/editorial-app.php`; frontend News/Blog list/detail components and `types/api.ts`. Next build also refreshed generated `next-env.d.ts`/TypeScript build-directory references. Existing modified/untracked files were preserved; git status contains substantial prior unrelated work. About, Services, Products, legal pages and shared navbar/footer were not edited for this task.

## Before live activation

Obtain approval for the Media metadata migration; enable GD in the actual PHP runtime; align PHP/web-server/proxy request timeouts with the configured provider timeout and image-processing budget; review current model availability, provider pricing, account usage limits and organizational spending controls; configure backend credentials; verify private/public storage and scheduler permissions. Obtain explicit authorization for a separately budgeted live-provider test and review image quality, moderation and cropping. Live output quality, paid generation, production scheduler/storage, and model access remain **NOT VERIFIED**. Public News/Blog disclosure rendering was compiled and resource-tested, but no public article was published to exercise it in a browser. Do not switch providers as part of these acceptance tests. No real credits, public publication, deployment or push occurred.
