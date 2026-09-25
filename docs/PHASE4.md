# MERITLIVES LLC — Phase 4: Filament CMS

This package adds the CMS resource layer required by the MERITLIVES specification.

## Included resources

- Products
- Product Features
- Services
- News
- Blog Posts
- Categories
- Tags
- Media
- Newsletter Subscribers
- Contact Messages
- Settings

It also includes a dashboard statistics widget and a Filament panel provider.

## Installation

Run these commands from the Laravel `backend` directory:

```bash
composer require filament/filament:"^4.0" spatie/laravel-permission:"^6.0"
php artisan filament:install --panels
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
php artisan storage:link
```

Then make sure the generated Filament panel provider is using the provider supplied in this package.

## Important authentication setup

The existing Laravel User model must implement Filament's access contract if your installed Filament version requires it.

For Filament installations using the standard access contract, update `app/Models/User.php`:

```php
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

class User extends Authenticatable implements FilamentUser
{
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->is_admin ?? true;
    }
}
```

Adapt the final access rule to the application's real authorization model rather than leaving all users enabled in production.

## Roles

The specification identifies:

- super_admin
- admin
- editor
- author

Use Spatie Permission for the role/permission layer.

Example roles/permissions should be created in a dedicated production seeder after confirming the application's final authorization rules.

## Admin URL

After installation:

```text
http://127.0.0.1:8000/admin
```

## Production security

Do not use the development admin password in production. Replace it immediately and enforce strong credentials.

Do not expose database credentials, API keys or mail credentials in source control.
