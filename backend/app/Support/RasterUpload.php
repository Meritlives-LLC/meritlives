<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class RasterUpload
{
    public const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    public const MAX_KIB = 5120;

    public static function field(string $name, string $directory): \Filament\Forms\Components\FileUpload
    {
        return \Filament\Forms\Components\FileUpload::make($name)
            ->image()->acceptedFileTypes(self::MIME_TYPES)->maxSize(self::MAX_KIB)
            ->disk('public')->visibility('public')->directory($directory)
            ->rules(['mimes:jpg,jpeg,png,webp,gif', 'extensions:jpg,jpeg,png,webp,gif'])
            ->saveUploadedFileUsing(fn ($file) => self::store($file, $directory));
    }

    public static function store(UploadedFile $file, string $directory): string
    {
        Validator::make(['file' => $file], ['file' => [
            'required', 'file', 'image', 'max:'.self::MAX_KIB,
            'mimetypes:'.implode(',', self::MIME_TYPES),
            'mimes:jpg,jpeg,png,webp,gif', 'extensions:jpg,jpeg,png,webp,gif',
        ]])->validate();

        $info = @getimagesize($file->getRealPath());
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
        $mime = $file->getMimeType(); // server-side fileinfo, never the client MIME
        if (! is_array($info) || ($info['mime'] ?? null) !== $mime || ! isset($extensions[$mime])
            || $info[0] > 12000 || $info[1] > 12000 || $info[0] * $info[1] > 40000000
            || ! in_array($directory, ['general', 'blogs', 'news-images', 'products', 'attachments'], true)) {
            throw ValidationException::withMessages(['file' => 'Upload a supported raster image up to 40 megapixels.']);
        }

        $path = $file->storeAs($directory, Str::uuid().'.'.$extensions[$mime], ['disk' => 'public', 'visibility' => 'public']);
        if (! $path) {
            throw ValidationException::withMessages(['file' => 'The image could not be stored.']);
        }
        return $path;
    }
}
