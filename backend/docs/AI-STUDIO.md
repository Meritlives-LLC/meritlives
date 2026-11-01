# Editorial AI Studio

The Filament panel exposes **AI Studio → Generation Jobs**, **Prompt Templates**, and **Audit History**. Editors can create an article or image job, select a versioned prompt template, and request a preview. A reviewer with `review_ai_generations` must approve or reject the preview. Approved articles can only be copied into a Blog post through the explicit **Create Blog draft** action. That action creates a `draft`; it never publishes. Approved images are copied to the configured public storage disk with a random filename and remain unattached until the explicit **Attach to Blog post** action.

## Provider status

The default configuration is `AI_STUDIO_ENABLED=false` and `AI_STUDIO_PROVIDER=none`. No real provider adapter is implemented, and the default adapter always returns unavailable. Setting the enable flag alone does not enable generation. Tests inject a deterministic provider and make no external requests.

## Persistence and migration

`2026_10_18_000002_create_ai_studio_tables.php` creates prompt template, generation job, and append-only audit event tables. It is intentionally forward-only; `down()` throws to avoid silently deleting audit history. It has **not** been run against the existing local database.

To rehearse after explicit approval, provision a separate disposable database (for example, `meritlives_ai_studio_test`) with a dedicated local account. Create an isolated backend environment file/configuration targeting only that database, verify the effective driver, database name, and loopback host without printing credentials, then run `php artisan migrate --pretend` followed by `php artisan migrate` against that disposable database. Do not point this rehearsal at the existing `meritlives` database or any production endpoint. Application tests use PHPUnit's in-memory SQLite configuration instead.

## Local use

The UI and prompt template management can be inspected in `/admin` after the migration and role permissions have been installed. Generation remains unavailable until a real provider adapter, reviewed credential handling, and provider-specific safety limits are implemented. Do not add provider credentials to frontend configuration. The permission seeder must be run in the target environment by an authorized administrator to assign the new permissions to roles.
