# Editorial newsletter implementation

## Placement and behavior

- `EditorialNewsletterSection` reuses `NewsletterForm`: full section at the end of News and Blog articles; compact banner after listing cards and before existing Load More controls.
- News and Blog nested layouts mount `EditorialNewsletterExperience`. Other sections and shared navigation/footer are unchanged.
- Desktop eligibility: at least 1024px, hover and fine pointer. No automatic popup on mobile/tablet layouts.
- Trigger: 45 seconds of visible, unblocked engagement following pointer, keyboard or scroll activity; article scroll at approximately 60% can trigger after a minimum 3 seconds of engagement. No immediate page-load trigger. Hidden tabs, active forms, pending submissions and existing dialogs defer the trigger.
- Popup code is lazy-loaded. Native modal dialog supplies focus containment, background inertness and Escape handling; focus returns on close. No animations or tracking scripts.
- Dismissal stores a 30-day timestamp. Success stores only a boolean; no email/name is persisted. Memory fallback handles blocked storage. A module-level shown flag prevents repeated triggers across client navigation. A successful API receipt in any NewsletterForm suppresses future triggers.
- Existing API receipt validation, pending request guard, field errors, retained values on failure and throttling remain intact. Optional name remains available for existing consumers; editorial forms request email only.

## Backend audit: outstanding requirements

The existing endpoint validates email using Laravel RFC/DNS rules and normalizes it to lowercase. Its unique email column and `updateOrCreate` avoid duplicate subscriber records. A successful response is a stored subscription receipt, not email ownership confirmation.

The current schema has email, optional name, status, subscribed timestamp and normal timestamps. Admin UI supports subscribed/unsubscribed status.

Outstanding before operating the newsletter as described in its supplied copy:

1. Durable consent evidence (consent wording/version, collection source and timestamp policy). Current subscription timestamp is overwritten on repeated subscriptions and does not provide this evidence.
2. Email confirmation/double opt-in workflow; none was found. No confirmation email is promised by this UI.
3. Public, secure unsubscribe capability and operational delivery of unsubscribe links. No unsubscribe route, token or mailing workflow was found; no fabricated link was added.
4. Preserve unsubscribe/suppression status. The existing POST endpoint currently reactivates unsubscribed addresses. Delivery suppression and a deliberate resubscription policy need backend work.
5. Review Privacy Policy against actual provider, retention, consent and delivery practices before launch.

No backend files, schema, migrations, publication rules or security controls were changed. No real subscriptions were submitted.

## Validation commands

Run from `frontend`:

- `node --test --require ./tests/forms-register.cjs tests/forms.test.cjs tests/newsletter.test.cjs`
- `npx tsc --noEmit`
- Build with `NEXT_DIST_DIR=.next.newsletter-check` and `NEXT_PUBLIC_API_URL=http://127.0.0.1:3139/api/v1`.
- Start `node tests/newsletter-mock-api.cjs` (GET-only fixtures on 3139) and the isolated production build on 3138.
- `node tests/newsletter-browser.cjs`: layout at 320/390/768/1440, mobile exclusion, desktop trigger, scroll trigger, keyboard focus wrap, Escape, dismissal/reload, mocked success and no client errors. Screenshots go to an OS temporary directory.
- `node tests/forms-browser.cjs`: existing contact/enquiry browser regression checks, with mocked POST responses.
- `git diff --check`.

Native dialog keyboard/inert behavior is checked in Chrome; other browser engines and manual assistive-technology testing remain outside this validation.

## Browser timeout diagnosis and resumed validation (2026-10-29)

The timeout was a test initialization race, not a 45-second production timing defect. In the reproduced failure the test's pointer event occurred at performance time 2815ms, before hydration registered the popup's pointer/keyboard/scroll listeners and interval at 48849ms. Advancing the browser clock therefore advanced time before the application timer existed; the resulting interval had zero ticks and the application had missed the interaction. The route, desktop media query, visible document, empty preferences and absence of competing forms/dialogs were all verified.

The harness now installs the clock before navigation, waits for the effect's scroll listener registration, and then sends a keyboard interaction before advancing time. Failure diagnostics include route, desktop eligibility, visibility, storage, active element, form/modal blockers, listener registration, interactions, timer ticks and dialog state. Build source timestamps and a SHA-256 comparison of a served JavaScript chunk against the isolated build detect outdated output.

Browser validation also found and fixed two accessibility defects without redesigning the newsletter or changing production timing:

- Native Chrome dialog focus could move to the body when tabbing past the last link. Explicit Tab/Shift+Tab wrapping and focus containment now supplement native modal behavior; cleanup removes listeners before restoring prior focus.
- Existing global main-content CSS overrides classes containing `text-white`, making the inline CTA text black. The newsletter button now uses an explicit white utility that avoids that selector. Browser checks verify the computed foreground and MERITLIVES red background.

The suite covers timer timing with an early-opening assertion, independent 59%/62% scroll boundaries, 320/390/768 mobile/tablet exclusion, initial focus, repeated Tab/Shift+Tab containment, Escape and focus restoration, dismissal across navigation, suppression on day 29 and expiration after day 30, inline and popup subscription success, field validation/value retention, and success suppression across navigation/reload.

Headless visibility deferral uses an emulated `document.visibilityState` signal. The competing editorial-page enquiry guard uses a DOM fixture matching the existing project dialog's role/aria-modal semantics; the separate existing form browser suite exercises the real contact form and all six actual project enquiry modals. This does not constitute manual screen-reader testing or cross-browser/background-tab OS scheduling validation.

Files created for the newsletter implementation:

- `frontend/components/EditorialNewsletterExperience.tsx`
- `frontend/components/EditorialNewsletterPopup.tsx`
- `frontend/components/EditorialNewsletterSection.tsx`
- `frontend/lib/newsletter-preferences.ts`
- `frontend/app/news/layout.tsx`, `frontend/app/blog/layout.tsx`
- `frontend/tests/newsletter.test.cjs`, `frontend/tests/newsletter-browser.cjs`, `frontend/tests/newsletter-mock-api.cjs`
- `docs/EDITORIAL-NEWSLETTER.md`

Existing files modified for the newsletter implementation:

- `frontend/components/NewsletterForm.tsx`
- `frontend/components/NewsList.tsx`, `frontend/components/BlogList.tsx`
- `frontend/app/news/[slug]/page.tsx`, `frontend/app/blog/[slug]/page.tsx`

During the resumed task, application edits were limited to the popup's focus handling and the form's button text utility. Other changes were to newsletter tests, their local fixture and this report. Existing placements and unrelated changes were preserved.

## Final validation results

- Production build `vAnQw6Jip5sltvEp8wno3`: passed. Served chunk content matched the isolated output; source timestamp checks passed.
- Mocked component and existing form regression suite: 39/39 passed.
- Newsletter Chrome suite: 34/34 checks passed at 320, 390, 768 and 1440px, including computed CTA colours.
- Existing contact/enquiry Chrome suite: 20/20 responsive scenarios passed, covering all six service enquiry modals.
- Standalone TypeScript (`tsc --noEmit`): passed.
- `git diff --check`: passed (existing line-ending warnings only).
- Visual review: desktop popup and 320px inline newsletter screenshots inspected. The final inline CTA has white text on MERITLIVES red.
- Newsletter screenshots: `C:/Users/citi/AppData/Local/Temp/meritlives-newsletter-j89Net`.
- Contact/enquiry screenshots: `C:/Users/citi/AppData/Local/Temp/meritlives-forms-browser-VbzQ4c`.

All newsletter and enquiry POSTs were mocked. No real subscriber records, migrations, schema changes, production requests, pushes or deployments were performed. The isolated build's automatic tsconfig include/reformatting was removed to preserve the configuration present at the start of the resumed task.
