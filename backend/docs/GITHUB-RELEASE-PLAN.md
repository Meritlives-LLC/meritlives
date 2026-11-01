# MERITLIVES controlled GitHub release proposal

Prepared 2026-10-31. This is a proposed file selection, not a staged change set. Nothing was staged, committed, pushed, merged or deployed. Existing work, environment configuration and databases were not changed. This report is the only new file created during release preparation.

## Repository and branches

- Configured origin fetch/push: `https://github.com/Meritlives-LLC/meritlives.git`.
- Intended repository established from both origin URLs: [Meritlives-LLC/meritlives](https://github.com/Meritlives-LLC/meritlives).
- Current branch: `feature/watch-production-integration`, HEAD `864d90c` (`Fix Watch production integration`).
- Proposed new branch: `release/meritlives-2026-10-31`, created from the current HEAD when authorized; no branch was created.
- Local tracking references show current branch aligned with `origin/feature/watch-production-integration`, and two commits ahead of `origin/main`, zero behind. Those existing commits are Watch collection/scheduler and Watch production integration and will also be part of a release PR relative to main. Remote refs were not refreshed; live access, push permission and branch protection have not been verified.
- Index is empty. Do not push the current working branch automatically. Inspect the final staged diff and refresh remote state in the separately authorized Git operation.

## Release scope and selection

Include application source, public assets and credits, About shared content, reviewed configuration templates, dependency manifest/lock, reusable tests/fixtures, migration source, feature documentation, audit documentation and this proposal. The release deliberately carries the earlier product/service/legal/newsletter/Watch/UI/security work alongside the three named features; preserve that complete application scope.

- About: `ManageAboutPage`, `AboutPageContent`, API controller/config/view, `content/about.json`, frontend About component/styles/data layer/page metadata, tests and documentation are included. `content/about.json` is needed by both sides of the application and must remain at the repository root's content path.
- AI Editorial Assistant: provider/services, Filament concern and News/Blog create/edit hooks, configuration, draft/approval controls, reusable tests and docs included.
- AI Feature Image Generator: provider/processor/service, resource concern, private preview controller/route, cleanup command/schedule, Media metadata migration/model, metadata output/presentation, reusable tests and docs included.
- The deletion of `frontend/components/Hero.tsx` is intentional; `FeaturedStoriesHero` and new home sections replace it. Include this deletion in the release.
- Keep `backend/composer.lock` in the repository/release checkout; it is already tracked and unchanged, so it is not an entry in the proposed change manifest. Frontend package manifest and lock changes are included together.

The exact changed-path manifest below contains **282 proposed paths** (including this new report), and **113 explicitly excluded visible changed/untracked paths**. M means modified, A means currently untracked/new, D means deleted. No wildcard staging is implied. Unchanged tracked files remain part of the repository checkout.

## Exclusions

Exclude generated browser screenshots/result JSON under the three evidence directories, the browser run-root pointer, and modified `frontend/next-env.d.ts` / `frontend/tsconfig.json`. The latter diffs are generated references, local `.next.*` includes and formatting; preserve them locally but leave them unstaged. Future clean builds regenerate Next typing references.

Already ignored, also excluded: all `.next/` and `.next.*/` output; node_modules; vendor; TypeScript build-info and backups; PHPUnit result XML/cache; `backend/test-openai.php`; actual `.env`/`.env.local`; logs; sessions; framework/compiled caches. Exclude any SQL/database dumps, private keys, uploaded runtime media, backup archives and private previews regardless of their ignore status. No such private/dump paths were found in the proposed changed-path manifest. Do not use `git add -A`, `git add .` or `git add -f` for this selection.

`backend/.env.example` is a reviewed placeholder template with blank secrets and is included. Existing unchanged tracked `frontend/.env.production` contains only public API/site URLs; it is not an additional release change and contains no credentials. Existing example templates remain tracked. No populated secret environment file is proposed for addition. Treat template local defaults as development examples, not deployment configuration.

## Security and dependency review

- Re-scanned the 281 original proposed changed paths: read all 280 existing files (one deletion), about 29 MB including public assets. Checked candidate text for OpenAI/GitHub/AWS token signatures, private-key headers, credential-like assignments and suspicious dump/environment/key paths.
- No real API key, password, private key or database dump detected in proposed additions/modifications. One credential-like assignment is an explicitly fake provider key in `AiStudioWorkflowTest.php`; browser tests use disposable example.test credentials and an isolated testing key. Those are test fixtures, not production credentials.
- Scanned the two existing branch commits above locally recorded origin/main for recognized key/private-key patterns; no match. This is not a full historical secret scanner, entropy audit or guarantee against unknown secret formats. Gitleaks/TruffleHog are not installed. Excluded evidence images were not approved for publication; they stay out of the release. Public illustration assets are intentionally publishable application assets.
- `git diff --check` passed, with informational CRLF normalization warnings only. Index remains empty.
- Prior accepted regression evidence is unchanged: backend 128 tests / 991 assertions, frontend production build, 34 form tests. No application changes were made here, so expensive suites were not rerun.

Documented Medium findings remain open and must accompany review:

1. Composer: Symfony Mime CVE-2026-45070 / GHSA-vqc8-7275-q272 (email header injection in MIME parameter names). Audit identified 7.4.22 as patched in the 7.4 line. No application exploit path was established. Schedule a compatible, tested dependency patch; no lock updates or forced fixes were made here.
2. npm: 18 moderate development-tooling package findings rooted in minimatch GHSA-g3hv-75wg-m249, propagated through ESLint tooling. Accepted production-only audit reported zero vulnerabilities. Do not accept suggested major downgrades blindly or describe the complete dependency tree as vulnerability-free.

The audit also records missing frontend search edge throttling and unbounded legacy RSS downloads as Medium operational/application concerns. Keep cron disabled until outbound feed behavior is accepted and configure edge throttling before deployment. These do not prevent publishing the reviewed source branch for review. Dependency audit results are the documented prior run, not a newly refreshed advisory database query.

## Migration deployment order (source included; no execution)

Back up full database including migrations ledger, protected configuration/key, shared public/private media and current release; verify restoration on a disposable MySQL copy. Check the actual target schema/version and pending ledger later. Migrate during an approved maintenance window with AI disabled, before serving the new code to users. Apply pending migrations in Laravel filename order, never re-run an already recorded create migration:

| Order | Filename under backend/database/migrations | Effect / requirement |
| --- | --- | --- |
| Existing prerequisite | `2026_10_08_000001_create_watch_sources_table.php` | Included modified create definition; used on fresh databases only. Existing databases need the forward alignment migration. |
| Existing prerequisite | `2026_10_08_000002_create_watch_videos_table.php` | Same rule; depends on Watch sources. |
| 1 | `2026_10_18_000001_align_watch_column_lengths.php` | Checks stored values before changing Watch string lengths; can abort on oversized values. MySQL locking/duration must be rehearsed. |
| 2 | `2026_10_18_000002_create_ai_studio_tables.php` | Adds prompt templates, generation jobs, audit events; requires users. Down throws: forward-only to preserve history. |
| 3 | `2026_10_18_000003_create_news_discovery_tables.php` | Adds News Discovery tables and relationships; adds `ai_generation_jobs.result_metadata`, `news.seo_title`, `news.seo_description`. Depends on AI tables and existing categories/news/users. Down throws: forward-only. Required by Feature Images metadata workflows. |
| 4 | `2026_10_27_000001_reorganize_news_and_blog_categories.php` | Inserts/activates Blog categories and retires legacy categories without deleting post associations; down is a no-op. |
| 5 | `2026_10_28_000001_add_public_approval_to_blog_posts.php` | Adds indexed boolean approval, default false. Existing published Blog posts need explicit reviewer approval to become public. Do not bulk approve or weaken the scope. |
| 6 | `2026_10_31_000001_add_ai_metadata_to_media.php` | Adds nullable `media.metadata` JSON, preserving existing rows/files. Down drops provenance metadata; prefer leaving the additive column on code rollback. |

After schema changes, review and deliberately run only `RolesAndPermissionsSeeder` if approved, reset permission cache, verify grants/ownership and publication inventory, rebuild config/routes/views, verify storage and hosting process configuration, then smoke-test before opening traffic. Do not run ContentSeeder/DatabaseSeeder or regenerate an existing APP_KEY. Full commands and hosting blockers remain in `PRE-DEPLOYMENT-AUDIT.md`. Do not use a blind migrate:rollback: two migrations are forward-only, taxonomy does not reverse, and restoring a backup requires write reconciliation.

## Recommended commit message

```text
feat: prepare MERITLIVES CMS and public site release

Add the About CMS, AI Editorial Assistant and reviewed feature-image workflow.
Integrate AI Studio, News Discovery, publication controls and CMS permissions.
Update public editorial, product, service, legal and enquiry experiences.
Include migrations, reusable tests, asset credits and deployment audit guidance.
Exclude generated browser evidence, build caches and local configuration changes.

Validation: 128 backend tests (991 assertions), production frontend build,
34 form tests and zero production npm advisories in the accepted audit.
Medium dependency findings and production hosting/migration gates remain documented.
```

## Readiness

**READY for explicit approval of the proposed release branch/file selection and a controlled GitHub push workflow.** Actual push remains conditional on authorized branch creation, deliberate staging, inspection of the staged diff/secret scan and current remote state. No approval is inferred from this report. **Production deployment remains NOT READY** until the separate hosting, migration rehearsal, backup/restore, publication and runtime gates are closed. GitHub publication does not authorize deployment or merging.

## Exact proposed changed-path manifest

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
M frontend/next.config.mjs
M frontend/package-lock.json
M frontend/package.json
M frontend/types/api.ts
A backend/app/Console/Commands/CleanupFeatureImagePreviews.php
A backend/app/Console/Commands/DiscoverNews.php
A backend/app/Console/Commands/ImportNewsImagesFromBackup.php
A backend/app/Console/Commands/RehostBlogImages.php
A backend/app/Filament/Pages/ManageAboutPage.php
A backend/app/Filament/Resources/AiAuditEventResource.php
A backend/app/Filament/Resources/AiAuditEventResource/Pages/ListAiAuditEvents.php
A backend/app/Filament/Resources/AiGenerationJobResource.php
A backend/app/Filament/Resources/AiGenerationJobResource/Pages/CreateAiGenerationJob.php
A backend/app/Filament/Resources/AiGenerationJobResource/Pages/ListAiGenerationJobs.php
A backend/app/Filament/Resources/AiGenerationJobResource/Pages/ViewAiGenerationJob.php
A backend/app/Filament/Resources/AiPromptTemplateResource.php
A backend/app/Filament/Resources/AiPromptTemplateResource/Pages/CreateAiPromptTemplate.php
A backend/app/Filament/Resources/AiPromptTemplateResource/Pages/EditAiPromptTemplate.php
A backend/app/Filament/Resources/AiPromptTemplateResource/Pages/ListAiPromptTemplates.php
A backend/app/Filament/Resources/Concerns/HasEditorialAssistant.php
A backend/app/Filament/Resources/Concerns/HasFeatureImageAssistant.php
A backend/app/Filament/Resources/Concerns/UsesResourcePermissions.php
A backend/app/Filament/Resources/NewsDiscoveryResource.php
A backend/app/Filament/Resources/NewsDiscoveryResource/Pages/ListNewsDiscoveries.php
A backend/app/Filament/Resources/NewsDiscoveryResource/Pages/ViewNewsDiscovery.php
A backend/app/Filament/Resources/NewsSourceResource.php
A backend/app/Filament/Resources/NewsSourceResource/Pages/CreateNewsSource.php
A backend/app/Filament/Resources/NewsSourceResource/Pages/EditNewsSource.php
A backend/app/Filament/Resources/NewsSourceResource/Pages/ListNewsSources.php
A backend/app/Http/Controllers/Admin/AiStudioImagePreviewController.php
A backend/app/Http/Controllers/Admin/FeatureImagePreviewController.php
A backend/app/Http/Controllers/Api/V1/AboutPageController.php
A backend/app/Http/Middleware/TrustedProxies.php
A backend/app/Models/AiAuditEvent.php
A backend/app/Models/AiGenerationJob.php
A backend/app/Models/AiPromptTemplate.php
A backend/app/Models/NewsDiscovery.php
A backend/app/Models/NewsDiscoveryEvent.php
A backend/app/Models/NewsSource.php
A backend/app/Services/AboutPageContent.php
A backend/app/Services/AiEditorial/EditorialAssistant.php
A backend/app/Services/AiEditorial/EditorialProvider.php
A backend/app/Services/AiEditorial/MockEditorialProvider.php
A backend/app/Services/AiEditorial/ResponsesEditorialProvider.php
A backend/app/Services/AiImages/FeatureImageService.php
A backend/app/Services/AiImages/ImageException.php
A backend/app/Services/AiImages/ImageProcessor.php
A backend/app/Services/AiImages/ImagePromptBuilder.php
A backend/app/Services/AiImages/ImageProvider.php
A backend/app/Services/AiImages/MockImageProvider.php
A backend/app/Services/AiImages/OpenAiImageProvider.php
A backend/app/Services/AiStudio/AiGenerationProvider.php
A backend/app/Services/AiStudio/AiStudioException.php
A backend/app/Services/AiStudio/AiStudioManager.php
A backend/app/Services/AiStudio/OpenAiGenerationProvider.php
A backend/app/Services/AiStudio/UnavailableAiGenerationProvider.php
A backend/app/Services/NewsDiscovery/AiStudioNewsRewriteProvider.php
A backend/app/Services/NewsDiscovery/InvalidNewsRewriteResponse.php
A backend/app/Services/NewsDiscovery/NewsDiscoveryException.php
A backend/app/Services/NewsDiscovery/NewsDiscoveryManager.php
A backend/app/Services/NewsDiscovery/NewsDiscoveryUrlPolicy.php
A backend/app/Services/NewsDiscovery/NewsRewriteProvider.php
A backend/app/Services/NewsDiscovery/RssFeedParser.php
A backend/app/Support/EditorialImageMetadata.php
A backend/app/Support/HtmlContent.php
A backend/app/Support/PublicPagination.php
A backend/app/Support/RasterUpload.php
A backend/config/about.php
A backend/config/ai_editorial.php
A backend/config/ai_image.php
A backend/config/ai_studio.php
A backend/config/news_discovery.php
A backend/config/security.php
A backend/config/wordpress_import.php
A backend/database/migrations/2026_10_18_000001_align_watch_column_lengths.php
A backend/database/migrations/2026_10_18_000002_create_ai_studio_tables.php
A backend/database/migrations/2026_10_18_000003_create_news_discovery_tables.php
A backend/database/migrations/2026_10_27_000001_reorganize_news_and_blog_categories.php
A backend/database/migrations/2026_10_28_000001_add_public_approval_to_blog_posts.php
A backend/database/migrations/2026_10_31_000001_add_ai_metadata_to_media.php
A backend/docs/ABOUT-PAGE.md
A backend/docs/AI-EDITORIAL-ACCEPTANCE.md
A backend/docs/AI-EDITORIAL.md
A backend/docs/AI-FEATURE-IMAGE-GENERATOR.md
A backend/docs/AI-STUDIO.md
A backend/docs/GITHUB-RELEASE-PLAN.md
A backend/docs/NEWS-DISCOVERY.md
A backend/docs/PRE-DEPLOYMENT-AUDIT.md
A backend/phpunit.security.xml
A backend/resources/views/filament/pages/manage-about-page.blade.php
A backend/tests/Feature/AboutPageTest.php
A backend/tests/Feature/AiEditorialAssistantTest.php
A backend/tests/Feature/AiStudioWorkflowTest.php
A backend/tests/Feature/EditorialAcceptanceTest.php
A backend/tests/Feature/EditorialApiIntegrationTest.php
A backend/tests/Feature/EditorialIsolationTest.php
A backend/tests/Feature/FeatureImageGeneratorTest.php
A backend/tests/Feature/FilamentResourceAuthorizationTest.php
A backend/tests/Feature/NewsDiscoveryWorkflowTest.php
A backend/tests/Feature/OpenAiGenerationProviderTest.php
A backend/tests/Feature/RemoteImageCommandSecurityTest.php
A backend/tests/Feature/SecurityRemediationTest.php
A backend/tests/Feature/SyncRssNewsModerationTest.php
A backend/tests/Feature/WatchMigrationLengthGuardTest.php
A backend/tests/Support/FakeAiGenerationProvider.php
A backend/tests/Support/FakeNewsRewriteProvider.php
A backend/tests/browser/README.md
A backend/tests/browser/about-app.php
A backend/tests/browser/editorial-app.php
A backend/tests/browser/feature-image-app.php
A content/about.json
A docs/EDITORIAL-NEWSLETTER.md
A docs/LEGAL-PAGES-REVIEW.md
A docs/NAMECHEAP-STAGING-PLAN.md
A docs/SECURITY-REMEDIATION.md
A docs/SECURITY-SERVICE-PAGE.md
A docs/SERVICES-CATALOGUE.md
A frontend/app/api/editorial-search/route.ts
A frontend/app/blog/layout.tsx
A frontend/app/cookies/page.tsx
A frontend/app/news/layout.tsx
A frontend/app/privacy/page.tsx
A frontend/app/services/security/page.tsx
A frontend/app/terms/page.tsx
A frontend/components/AboutPage.module.css
A frontend/components/AboutPage.tsx
A frontend/components/AdditionalServices.tsx
A frontend/components/BusinessAutomationServicePage.tsx
A frontend/components/EdTechServicePage.tsx
A frontend/components/EditorialNewsletterExperience.tsx
A frontend/components/EditorialNewsletterPopup.tsx
A frontend/components/EditorialNewsletterSection.tsx
A frontend/components/EditorialSearch.tsx
A frontend/components/EducationServicePage.tsx
A frontend/components/FeaturedStoriesHero.tsx
A frontend/components/FeaturedWatchCarousel.tsx
A frontend/components/FintechServicePage.tsx
A frontend/components/FormFieldError.tsx
A frontend/components/LegalPage.module.css
A frontend/components/LegalPage.tsx
A frontend/components/RealEstateServicePage.tsx
A frontend/components/SecurityServicePage.tsx
A frontend/components/WatchVideoPlayer.tsx
A frontend/components/WebDevelopmentEnquiryModal.module.css
A frontend/components/WebDevelopmentPage.tsx
A frontend/lib/about.ts
A frontend/lib/featured-stories.ts
A frontend/lib/legal-metadata.ts
A frontend/lib/newsletter-preferences.ts
A frontend/lib/product-catalogue.ts
A frontend/lib/security-service.ts
A frontend/lib/service-catalogue.ts
A frontend/lib/use-form-submission.ts
A frontend/lib/watch-playback.ts
A frontend/public/business-automation-hero.png
A frontend/public/business-automation-operations.png
A frontend/public/business-automation-video-poster.png
A frontend/public/edtech-hero.png
A frontend/public/edtech-learning-environment.png
A frontend/public/edtech-lms-poster.png
A frontend/public/education-operations.png
A frontend/public/education-portal-hero.png
A frontend/public/education-portal-video-poster.png
A frontend/public/fintech-service-hero.png
A frontend/public/products/audioflow-presenter.jpg
A frontend/public/products/bookmarketing-author.jpg
A frontend/public/products/politcs-professional-meeting.jpg
A frontend/public/products/skillhub-learning.jpg
A frontend/public/products/wauabot-customer-conversation.jpg
A frontend/public/real-estate-hero.png
A frontend/public/real-estate-operations.png
A frontend/public/real-estate-video-poster.png
A frontend/public/security/ASSET-CREDITS.md
A frontend/public/security/professional-review.jpg
A frontend/public/security/stakeholder-review.jpg
A frontend/public/security/team-assessment.jpg
A frontend/public/services/ASSET-CREDITS.md
A frontend/public/services/financial-review.jpg
A frontend/public/services/property-consultation.jpg
A frontend/public/web-development-hero.png
A frontend/tests/FORMS.md
A frontend/tests/about-browser.cjs
A frontend/tests/about-data.test.cjs
A frontend/tests/editorial-browser.cjs
A frontend/tests/feature-image-browser.cjs
A frontend/tests/feature-image-writing-regression.cjs
A frontend/tests/forms-browser.cjs
A frontend/tests/forms-mock-api.cjs
A frontend/tests/forms-register.cjs
A frontend/tests/forms.test.cjs
A frontend/tests/image-security.mjs
A frontend/tests/legal-pages-browser.cjs
A frontend/tests/legal-pages.test.cjs
A frontend/tests/newsletter-browser.cjs
A frontend/tests/newsletter-mock-api.cjs
A frontend/tests/newsletter.test.cjs
A frontend/tests/security-service-browser.cjs
A frontend/tests/security-service.test.cjs
A frontend/tests/services-catalogue-browser.cjs
A frontend/tests/services-catalogue-fixtures.cjs
A frontend/tests/services-catalogue.test.cjs
```

## Exact visible exclusions

```text
 M frontend/next-env.d.ts
 M frontend/tsconfig.json
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
```
