<?php

namespace App\Filament\Resources\Concerns;

use Illuminate\Database\Eloquent\Model;

trait UsesResourcePermissions
{
    /** @return array<string, string> */
    protected static function permissions(): array
    {
        return [];
    }

    protected static function isAuthorized(string $ability): bool
    {
        $user = auth()->user();
        if (! $user) {
            return false;
        }

        $permission = static::permissions()[$ability] ?? null;

        return $permission
            ? $user->can($permission)
            : $user->hasAnyRole(['super_admin', 'admin']);
    }

    public static function canViewAny(): bool
    {
        return static::isAuthorized('view');
    }

    public static function canView(Model $record): bool
    {
        return static::isAuthorized('view');
    }

    public static function canCreate(): bool
    {
        return static::isAuthorized('create');
    }

    public static function canEdit(Model $record): bool
    {
        return static::isAuthorized('edit');
    }

    public static function canDelete(Model $record): bool
    {
        return static::isAuthorized('delete');
    }

    public static function canDeleteAny(): bool
    {
        return static::isAuthorized('delete');
    }

    public static function canForceDelete(Model $record): bool
    {
        return static::isAuthorized('delete');
    }

    public static function canForceDeleteAny(): bool
    {
        return static::isAuthorized('delete');
    }

    public static function canReplicate(Model $record): bool
    {
        return static::isAuthorized('create');
    }
}
