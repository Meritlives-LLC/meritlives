<?php
namespace App\Support;

use Illuminate\Http\Request;

final class PublicPagination
{
    public static function size(Request $request): int
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'page' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'type' => ['sometimes', 'string', 'max:100'],
            'category' => ['sometimes', 'string', 'max:100'],
        ]);
        return (int) ($validated['per_page'] ?? 12);
    }
}
