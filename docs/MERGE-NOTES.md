# MeritLives — Merge Notes (Phases 1–8)

This package is the 8 incremental phase deliverables (`meritlives-phase1.zip`
through `meritlives-phase8.zip`) combined into a single `frontend/` +
`backend/` project. Below is exactly what was merged, what conflicted, and
how each conflict was resolved.

## What's included

- `frontend/` — Next.js 14 (App Router) + TypeScript + Tailwind CSS v4
- `backend/` — Laravel **application layer** only (models, controllers,
  migrations, Filament v4 CMS, middleware, config) — see "Backend is not a
  runnable skeleton" below
- `docs/` — the original PHASE2–PHASE6 notes, phase4's extra composer
  requirements file, and this document

## Conflicts found and how they were resolved

1. **`backend/routes/api.php`** (present in phases 1, 3, 7)
   Phase 3 has the full route list (products/services/news/blog/search/
   contact/newsletter/health). Phase 7 only re-declared health + contact +
   newsletter, but switched contact/newsletter to named rate limiters
   (`throttle:contact`, `throttle:newsletter`, defined in
   `AppServiceProvider`) instead of the flat `throttle:10,1`. **Merged**:
   phase 3's full route list, with phase 7's named throttles applied to the
   two POST routes.

2. **Duplicate validation classes**: phase 7 shipped `ContactRequest.php`
   and `NewsletterRequest.php`, near-duplicates of phase 3's
   `ContactMessageRequest.php` / `NewsletterSubscriptionRequest.php` (same
   fields, slightly different max-length limits), which were already wired
   into phase 3's controllers. **Resolved**: kept phase 3's originals,
   dropped phase 7's duplicates so there's only one validation class per
   form.

3. **`backend/database/seeders/DatabaseSeeder.php`** (phases 2 and 4)
   Phase 2's version seeds demo categories/tags/services/products/settings.
   Phase 4's version replaced it entirely with a call to
   `RolesAndPermissionsSeeder` + `FilamentAdminSeeder`, silently dropping
   phase 2's content seeding. **Resolved**: moved phase 2's logic into a new
   `ContentSeeder.php` (unchanged apart from the class rename) and made
   `DatabaseSeeder` call all three seeders.

4. **`frontend/app/page.tsx`, `layout.tsx`, `globals.css`** (phases 1 and 6)
   Phase 1's versions are a plain placeholder shell; phase 6 explicitly adds
   "a polished corporate presentation layer while keeping the API/CMS
   architecture from earlier phases." Confirmed phase 1's
   `components/navigation/SiteHeader.tsx` and `components/layout/
   SiteFooter.tsx` were unreferenced elsewhere before removing them.
   **Resolved**: phase 6's homepage, layout, header, footer, hero, and
   design tokens (`globals.css`) are the ones kept.

5. **`frontend/lib/api.ts`** (phases 1 and 5)
   Phase 5's version is a superset (adds `revalidate` option, better error
   messages, `apiPost` helper). **Resolved**: kept phase 5's version.

6. **`frontend/next.config.ts` vs `next.config.mjs`** (phases 1 and 6)
   Phase 1 had `reactStrictMode` in a `.ts` config; phase 6 had `images.
   remotePatterns` in a separate `.mjs` config — Next.js only loads one
   config file, and (see bug below) `.ts` config files aren't supported on
   the pinned Next.js version anyway. **Resolved**: merged both settings
   into a single `next.config.mjs`.

7. **`frontend/package.json`** (phases 1 and 5)
   Phase 1 had unpinned `"latest"` versions plus Tailwind/ESLint dev
   dependencies; phase 5 had pinned versions but dropped Tailwind/ESLint.
   **Resolved**: merged into one file with pinned versions and all
   dependencies from both.

## Bugs caught by actually building this

This project was verified with a real `npm install && npm run build && npm
run start`, not just assembled from files. Two real bugs surfaced and were
fixed:

- **`next.config.ts` isn't supported on Next.js 14.2** (the version pinned
  by phase 5/6) — TypeScript config files are a Next.js 15+ feature. Build
  failed with `Configuring Next.js via 'next.config.ts' is not supported`
  until it was converted to `.mjs`.
- **`eslint": "^9.0.0"` conflicts with `eslint-config-next@14.2.x`**, which
  peer-depends on ESLint 7 or 8. `npm install` failed with `ERESOLVE` until
  pinned to `^8.57.0`.

After both fixes, `npm run build` compiles all 14 routes successfully and
`npm run start` serves the site (data sections render empty/fallback state
since no live API is connected — this is expected, see below).

## Backend is not a runnable skeleton

None of the 8 phases included Laravel's actual framework files (`artisan`,
`composer.json`, `bootstrap/app.php`, `public/index.php`, `vendor/`). Every
phase is an **application-layer overlay** meant to be copied onto a fresh
Laravel install. To actually run the backend:

```bash
composer create-project laravel/laravel backend-skeleton
# copy this package's backend/ contents into backend-skeleton/, then:
cd backend-skeleton
composer require "filament/filament:^4.0" "spatie/laravel-permission:^6.0"
php artisan filament:install --panels
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
cp .env.example .env   # fill in DB credentials
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve
```

Then update `app/Models/User.php` to implement `FilamentUser` as described
in `docs/PHASE4.md`, and merge `bootstrap/app.php.example` into the real
`bootstrap/app.php` (register `SecurityHeaders`/`ForceJson` middleware and
the `console.php` routes) rather than overwriting it — a fresh Laravel
install's `bootstrap/app.php` differs by version.

## Running the frontend

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your backend
npm install
npm run dev
```

## Not yet done (flagged by the phases themselves, not by this merge)

- Phase 6's homepage/about copy is placeholder wording, pending approved
  brand content (noted in `docs/PHASE6.md`)
- Phase 2's seeded product is a placeholder record, not real MeritLives
  product data (noted in `docs/PHASE2.md`)
- Production secrets, domains, SMTP, and hosting-specific deploy commands
  are intentionally not included (`docs/PHASE8.md`) — see
  `DEPLOYMENT.md` and `SECURITY-CHECKLIST.md` at the project root

---

## Revision 2 — real Laravel skeleton + fixed security gaps

The first version of this package only merged the 8 phase overlays into a
`backend/` folder with no actual Laravel framework underneath (no `artisan`,
`composer.json`, `bootstrap/app.php`, `public/index.php`). That's now fixed:

- **`backend/` is built on the real, current Laravel skeleton** (cloned
  from `laravel/laravel` on GitHub — Laravel 13.x), with the 8 phases'
  application code layered on top of it. `vendor/` is still not included —
  that's normal, every Laravel project excludes it and generates it via
  `composer install`, same as `node_modules/` for the frontend.
- **`app/Models/User.php`** now actually exists and implements
  `Filament\Models\Contracts\FilamentUser`, with `canAccessPanel()` checking
  the seeded roles (`super_admin`/`admin`/`editor`/`author`) instead of
  either not existing or defaulting to "everyone in." Phase 4 had only
  described this as a snippet to paste in by hand (`docs/PHASE4.md`); it's
  now the real, wired file.
- **`bootstrap/app.php`** is the real file (not a `.example` someone has to
  merge by hand) — API routing, `SecurityHeaders`, `ForceJson`, and
  JSON-exception rendering are all actually registered.
- **`bootstrap/providers.php`** registers `AdminPanelProvider` so `/admin`
  actually boots.
- **`FilamentAdminSeeder`** no longer hardcodes the password
  `ChangeThisPasswordImmediately!` in source. It now reads
  `ADMIN_SEED_PASSWORD` from the environment, or generates and prints a
  random one once if unset — and it actually calls `assignRole('super_admin')`,
  which the original left commented out (meaning `canAccessPanel()` would
  have failed for the seeded admin even after phase 4's manual snippet was
  applied).
- **`composer.json`** is real and includes `filament/filament` and
  `spatie/laravel-permission` directly in `require`, plus a `composer setup`
  script that runs `key:generate`, `migrate`, `vendor:publish` for Spatie,
  `storage:link`, and `db:seed` in the right order.

### What still can't be verified in this environment

This sandbox has no PHP runtime and no access to Packagist (only
`github.com`/`npmjs.org`/`pypi.org`/etc. are reachable), so `composer
install` and every `artisan` command have not been executed here. The
frontend, by contrast, *was* built and run (`npm install && npm run build &&
npm run start`) as proof it works — see the earlier revision's notes above.
Before deploying the backend, run at minimum:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed        # capture the printed admin password immediately
php artisan storage:link
php artisan test           # runs ApiHealthTest and ApiSecurityTest
```

---

## Revision 3 — Filament version mismatch (found via a real `composer install`)

Running this for real surfaced a genuine bug in the original phase 4
deliverable, not something introduced by the merge:

```
PHP Fatal error: Type of App\Filament\Resources\BlogPostResource::$navigationGroup
must be UnitEnum|string|null (as in class Filament\Resources\Resource)
```

**Root cause**: phase 4's `PHASE4.md` instructs installing
`filament/filament:"^4.0"`, but every resource file it shipped
(`BlogPostResource`, `ProductResource`, all 10 resources + the widget) is
written against Filament **v3's** API:

- `public static function form(Form $form): Form` — Filament v4 renamed this
  to `form(Schema $schema): Schema` (the Forms package was replaced by a
  Schemas package).
- `protected static ?string $navigationGroup` /
  `protected static ?string $navigationIcon` — Filament v4 changed these to
  `string|UnitEnum|null` and `string|BackedEnum|null` respectively, and PHP
  requires typed property overrides to match the parent's type exactly, so
  the mismatch is a fatal error, not a warning.

This was confirmed directly against Filament's actual source (both the
`3.x` and `4.x` branches on GitHub) rather than guessed.

**Fix applied**: `composer.json` now requires `"filament/filament": "^3.0"`
instead of `^4.0`. Filament 3.x supports Laravel 10–13
(`illuminate/*: ^10.45|^11.0|^12.0|^13.0`), so it's compatible with the
Laravel 13 skeleton this package is built on — no resource files needed to
change. This was the lower-risk fix versus rewriting all 10 resources to
Filament v4's Schema-based API blind, without a live PHP environment here to
test each one against.

If you specifically want Filament v4 later, the real migration work is
rewriting every resource's `form()` method signature to `Schema $schema` and
fixing the two property types above — treat that as a deliberate upgrade,
not a drop-in version bump.
