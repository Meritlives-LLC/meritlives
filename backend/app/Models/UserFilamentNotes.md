# User authorization note

The existing User model should be extended for the final Filament installation.

Recommended production approach:

1. Install `spatie/laravel-permission`.
2. Add `Spatie\Permission\Traits\HasRoles` to `User`.
3. Implement Filament's panel access contract required by the installed Filament version.
4. Gate panel access using an explicit role/permission.
5. Assign `super_admin`, `admin`, `editor` or `author` through controlled admin workflows.

Do not leave unrestricted panel access enabled in production.
