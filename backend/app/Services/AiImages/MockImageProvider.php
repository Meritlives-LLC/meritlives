<?php
namespace App\Services\AiImages;

class MockImageProvider implements ImageProvider
{
    public function generate(string $prompt, string $size, bool $authorizeCost = false): string
    {
        $delay = min(2000, max(0, (int) config('ai_image.mock_delay_ms')));
        if ($delay) usleep($delay * 1000);
        match (config('ai_image.mock_scenario')) {
            'failure' => throw new ImageException('Mock image provider unavailable. Your article is unchanged.'),
            'quota' => throw new ImageException('Image quota exhausted. Check credits or try later; your article is unchanged.', 'quota'),
            default => null,
        };
        if (config('ai_image.mock_scenario') === 'invalid') return 'not an image';
        [$w, $h] = array_map('intval', explode('x', $size));
        $image = imagecreatetruecolor($w, $h);
        $hash = hash('sha256', $prompt);
        $bg = imagecolorallocate($image, 25 + hexdec(substr($hash, 0, 2)) % 60, 35, 65);
        imagefill($image, 0, 0, $bg);
        $white = imagecolorallocate($image, 255, 255, 255);
        $red = imagecolorallocate($image, 215, 25, 32);
        for ($y = 0; $y < $h; $y += 160) {
            imagefilledrectangle($image, 0, $y, $w, $y + 45, $red);
            imagestring($image, 5, max(10, intdiv($w - 440, 2)), $y + 15, 'MOCK TEST IMAGE - NOT A REAL EVENT', $white);
        }
        imagestring($image, 5, max(10, intdiv($w - 400, 2)), intdiv($h, 2), 'MERITLIVES DISPOSABLE QA ILLUSTRATION', $white);
        ob_start(); imagepng($image); $bytes = ob_get_clean(); imagedestroy($image);
        return $bytes;
    }
}
