# Legal pages: evidence and release review

## Status

`/privacy`, `/terms` and `/cookies` are source-managed, accessible review drafts. They do not require CMS records. Existing footer links already use these destinations; no shared layout/header/footer edits were necessary. No ads, analytics, consent SDK, vendor IDs, storage, forms or external media were added. Draft metadata deliberately uses `noindex, follow` until qualified review and company approval; remove that draft setting only as an approved release change. No effective date has been invented.

## Evidence inventory (source inspection, not production verification)

| Topic | Evidence | Conclusion / limitation |
| --- | --- | --- |
| Contact enquiries | `backend/app/Http/Requests/ContactMessageRequest.php`, `Controllers/Api/V1/ContactController.php`, `Models/ContactMessage.php`; `frontend/components/ContactForm.tsx`, shared enquiry modal and `lib/use-form-submission.ts` | Required name/email/subject/message; optional phone/company; validated payload stored. Receipt is backend confirmation, not project acceptance or email delivery. |
| Newsletter | `NewsletterSubscriptionRequest.php`, `Controllers/Api/V1/NewsletterController.php`, `Models/NewsletterSubscriber.php`, `Filament/Resources/NewsletterSubscriberResource.php` | Email, optional name, status and timestamp stored; admin supports unsubscribed status. No public unsubscribe route, double opt-in or delivery integration was identified. Re-submission currently sets subscribed again; suppression and consent evidence need design before campaigns. |
| Editorial bylines | `backend/app/Http/Resources/BlogPostResource.php`, `NewsResource.php`, News/Blog detail pages | Public author names, source attribution and editorial images; not private enquiries. Review lawful basis and correction/removal procedures. |
| IP handling | `backend/app/Providers/AppServiceProvider.php`, `backend/routes/api.php` | IP-keyed API throttles. No claim about retention of infrastructure logs or runtime client-IP accuracy. |
| Sessions | `backend/config/session.php`, `Providers/Filament/AdminPanelProvider.php`, `database/migrations/0001_01_01_000000_create_users_table.php` | Admin session/CSRF middleware; session schema supports account/IP/user-agent. Configured defaults: database sessions, 120-minute lifetime, expiry-on-close false, HttpOnly true, SameSite lax, production Secure default. Runtime cookie name/domain/duration unverified; no production cookie names invented. |
| Functional storage | `frontend/components/WebDevelopmentPage.tsx`, `BusinessAutomationServicePage.tsx` | `ml-web-development-enquiry-shown` and `ml-business-automation-enquiry-shown` in sessionStorage; simple prompt flags, no message contents. Consent classification still requires review. |
| Media | `frontend/lib/watch-playback.ts`, `WatchVideoPlayer.tsx`, `FeaturedWatchCarousel.tsx`, `next.config.mjs`, service-page media components | YouTube privacy-enhanced embeds and thumbnails; configured service media origins possible. Privacy-enhanced domain is not proof of no third-party processing. No Watch timing/playback/carousel changes made. |
| Analytics / ads / CMP | `frontend/app/layout.tsx`, application components/lib, package/config inspection | No AdSense, Google Analytics, Google Tag Manager, advertising units or consent SDK integration identified. No source evidence of activation. Deployed proxy/CDN injections and settings were not inspected. |
| Editorial assistance | `backend/config/ai_studio.php`, `Providers/AppServiceProvider.php`, `Services/AiStudio/OpenAiGenerationProvider.php` | Optional configured OpenAI admin workflow; production activation not verified. No direct enquiry-to-provider flow identified. Assess staff prompts and processor terms if enabled. |
| Typography | `frontend/app/layout.tsx` | next/font Google fonts fetched at build, served as local build assets; not evidence of Google Analytics. |
| Approved policy | existing docs and application/public files | No approved company policy text, retention schedule, registration details, governing-law clause or effective date located. |

Paths in backend evidence are under `backend/app` unless a full path is shown. Reading source does not establish deployed configuration, legal compliance, operational monitoring or processor contracts. Environment files and credentials were not read or exposed.

## Decisions required before production release

- Confirm the responsible legal entity, registration/jurisdiction details, required contact/address disclosures and applicable laws/audiences. Have qualified counsel approve governing law and dispute arrangements; do not infer them from branding or marketing locations.
- Assign a monitored privacy contact/request owner, verification/escalation procedures, applicable response deadlines and authority complaint information. `/contact` is a working intake path, not proof of an operating privacy-request process.
- Approve purpose-specific lawful bases, any legitimate-interest assessments, consent wording/evidence and withdrawals. Contact receipt is not marketing consent.
- Set retention/deletion rules and implement procedures for enquiries, subscribers/suppression, sessions, logs and backups, including legal-hold exceptions.
- Inventory hosting/database/mail/media/CDN/logging providers, processing regions, access, contracts and international transfers; review optional AI tooling and staff data submissions.
- Implement newsletter unsubscribe/suppression and consent auditability before campaigns. No dispatch integration or public self-service withdrawal was verified.
- Confirm intended child audience, age thresholds and safeguards, including separate external learning platforms.
- Approve content rights, editorial correction/removal procedures, website-use restrictions, disclaimers, liability terms and client-contract precedence.
- Verify actual HTTPS/security controls and all deployed cookies/storage/requests in staging, including hosting/CDN additions, CSRF/session lifetimes and optional authentication features. These pages make no guarantee of security.
- Approve cookie classification, third-party media consent behaviour and a CMP plan for relevant audiences. Do not claim a settings button exists before implementing it.
- Obtain qualified legal/privacy review, company sign-off, effective date, revision/change-notice procedure and final copy; replace REVIEW REQUIRED items and approve indexing before release.

## Future consent and advertising architecture (proposal only)

1. Inventory all purposes and providers before selecting a CMP. Assess applicable local rules and visitor regions. Provider lists and retention must be approved, not guessed.
2. Use a small client consent controller with explicit states: unknown, denied, and purpose-specific granted. Keep optional analytics, functional technologies and advertising separate. Default optional loading to blocked while preferences are absent, stale or unavailable. Essential classification needs documented review.
3. Persist only a versioned purpose/vendor choice and necessary timestamps/expiry under an approved storage policy; do not put enquiry contents or cross-site tracking IDs in the preference record. Provide equally clear accept/reject choices, granular preferences and a persistent accessible reopen/withdraw action. No duration or storage key is selected by this proposal.
4. Keep ad code inside an explicit News/Blog placement boundary for `/news`, `/news/[slug]`, `/blog`, `/blog/[slug]` only after route/content approval. An exact route/purpose allowlist must deny everything else, including `/privacy`, `/terms`, `/cookies`, `/contact`, search, enquiry UI, products and services. Never inject ads into the root layout, header or footer. A global preference interface may exist without a global advertising script.
5. Load optional provider scripts only after the matching explicit permission where required. Use a mode that avoids optional provider requests/pings before consent; a vendor's denied flag alone is not evidence of zero requests. Guard delayed script loads against route changes and revocation; recheck eligibility immediately before insertion.
6. On withdrawal or navigation to a denied route, stop providers, remove placements/iframes/listeners and clear permitted first-party optional storage as appropriate. Removing a script does not undo executed code: if reliable teardown is impossible, use a controlled full navigation/reload into a clean state and verify no residual provider request/activity. Do not load advertising resources on legal pages, including via client navigation from News/Blog.
7. Assess external-media gating separately; existing Watch behaviour has not been modified. Agree media consent and UX requirements before a future implementation.
8. For a future AdSense decision involving relevant regions and ad types, review current Google requirements and certified CMP/TCF compatibility. Certification does not itself establish legal compliance. No vendor is selected or activated here.
9. Staging tests must cover unknown/reject/accept/granular choices, stale preferences, revocation, failed CMP load, rapid navigation and reloads, cross-tab updates and keyboard/screen-reader operation. Assert request and cookie/storage inventories before consent, after each choice, and on every excluded route. Verify expiry and CSP compatibility with the approved provider list; do not weaken security headers to make tags load.

## Authoritative review references

These inform the review checklist, not a claim that a particular law necessarily governs MERITLIVES or that the company complies:

- [Nigeria Data Protection Act 2023, NDPC](https://ndpc.gov.ng/wp-content/uploads/2024/03/Nigeria_Data_Protection_Act_2023.pdf): purpose/basis review, rights, children, security and transfer assessment.
- [NDPC GAID 2025](https://ndpc.gov.ng/wp-content/uploads/2025/03/NDP-ACT-GAID-2025-MARCH-20TH.pdf): review applicable implementation guidance with counsel; not the earlier draft guidance.
- [Google publisher CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en): currently specifies certified CMP/TCF requirements for personalised ads in the EEA, UK and Switzerland and explains certification limitations. Recheck before any future integration.

## Isolated validation

From `frontend`:

- `node --test --require ./tests/forms-register.cjs tests/legal-pages.test.cjs`
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`
- Start existing disposable GET-only fixture: `node tests/services-catalogue-fixtures.cjs` (3139; rejects writes).
- In another shell set `NEXT_DIST_DIR=.next.legal-check`, `NEXT_PUBLIC_API_URL=http://127.0.0.1:3139/api/v1`, `NEXT_PUBLIC_SITE_URL=https://meritlives.com`, `NEXT_TELEMETRY_DISABLED=1`; run `npm.cmd run build`, then `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3138`.
- Run `node tests/legal-pages-browser.cjs`. It checks all three pages at 375/768/1440px, footer destinations, metadata/draft noindex, table-of-contents anchor focus/position, readability/overflow and no third-party requests/ads/browser exceptions. Only local GET/HEAD is allowed.
- `git diff --check` from the repository root.

No form submissions, database writes, migrations, seeders, production access or deployments are needed. Build-generated tsconfig/next-env changes are restored from exact task-start copies; pre-existing workspace files are checked against a source hash baseline.
## Recorded results

- Four isolated legal rendering/metadata tests passed.
- Explicit TypeScript `--noEmit --incremental false` check passed.
- Final isolated Next.js production build passed, including lint/type checks and generation of all 21 static pages. All three legal routes appear in the build output. Initial sandbox build could not download the existing Google Fonts; the authorised network-enabled build succeeded.
- Nine headless Chrome page/viewport scenarios passed (all three pages at 375, 768 and 1440px), including footer links, anchor keyboard focus/offset, metadata, review status, overflow, absence of ad elements/third-party requests and browser errors. Desktop/mobile screenshots were visually reviewed.
- `git diff --check` passed. A hash comparison confirmed no pre-existing source file changed or disappeared; generated tsconfig/next-env changes were restored from task-start copies.
- No production checks or valid form submissions were performed. No DB/migration/seeder/infrastructure operations were performed.

New source files: the three App Router pages, `frontend/components/LegalPage.tsx`, `LegalPage.module.css`, `frontend/lib/legal-metadata.ts`, the two `frontend/tests/legal-pages*.cjs` scripts and this review document. Build output remains isolated under `frontend/.next.legal-check/`.
