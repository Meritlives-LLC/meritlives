<?php
namespace App\Support;

use App\Models\Media;

class EditorialImageMetadata
{
    // One lookup per collection, none when there are no stored feature images.
    public static function attach(iterable $models): void
    {
        $models = collect($models);
        $paths = $models->pluck('featured_image')->filter(fn ($path) => is_string($path) && ! str_contains($path, '://'))->unique()->values();
        $media = $paths->isEmpty() ? collect() : Media::where('disk', 'public')->whereIn('path', $paths)->get()->keyBy('path');
        foreach ($models as $model) $model->setRelation('featuredMedia', $media->get($model->featured_image));
    }
}
