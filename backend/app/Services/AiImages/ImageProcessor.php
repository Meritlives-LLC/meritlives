<?php
namespace App\Services\AiImages;

class ImageProcessor
{
    public function ready(): void
    {
        if (! function_exists('imagecreatefromstring')) throw new ImageException('Image processing requires the PHP GD extension. Contact an administrator.', 'configuration');
    }

    public function inspect(string $bytes): array
    {
        if ($bytes === '' || strlen($bytes) > config('ai_image.max_bytes')) throw new ImageException('Image data is empty or too large.', 'invalid');
        $info = @getimagesizefromstring($bytes);
        if (! $info || ! in_array($info['mime'], ['image/png','image/jpeg','image/webp'], true)
            || $info[0] * $info[1] > config('ai_image.max_pixels') || min($info[0], $info[1]) < 64) {
            throw new ImageException('The provider returned an unsupported or invalid image.', 'invalid');
        }
        return $info;
    }

    public function normalize(string $bytes, string $ratio): string
    {
        $this->ready(); $info = $this->inspect($bytes);
        [$w, $h] = config('ai_image.output_sizes.'.$ratio);
        $source = @imagecreatefromstring($bytes);
        if (! $source) throw new ImageException('The image could not be decoded.', 'invalid');
        $target = imagecreatetruecolor($w, $h);
        imagefill($target, 0, 0, imagecolorallocate($target, 255, 255, 255));
        $cropW = min($info[0], $info[1] * $w / $h); $cropH = min($info[1], $info[0] * $h / $w);
        imagecopyresampled($target, $source, 0, 0, (int) (($info[0] - $cropW) / 2), (int) (($info[1] - $cropH) / 2), $w, $h, (int) $cropW, (int) $cropH);
        imageinterlace($target, true);
        ob_start(); imagejpeg($target, null, 85); $result = ob_get_clean();
        imagedestroy($source); imagedestroy($target);
        $this->inspect($result);
        return $result;
    }
}
