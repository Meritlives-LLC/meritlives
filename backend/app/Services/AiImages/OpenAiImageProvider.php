<?php
namespace App\Services\AiImages;

use Illuminate\Support\Facades\Http;
use Throwable;

class OpenAiImageProvider implements ImageProvider
{
    public const ENDPOINT = 'https://api.openai.com/v1/images/generations';

    public function generate(string $prompt, string $size, bool $authorizeCost = false): string
    {
        if (! config('ai_image.allow_billable') || ! $authorizeCost) {
            throw new ImageException('Billable image requests require administrator enablement and explicit editor confirmation.', 'configuration');
        }
        if (! config('ai_studio.api_key') || ! in_array(config('ai_image.model'), config('ai_image.models'), true)
            || ! in_array($size, config('ai_image.sizes'), true) || ! in_array(config('ai_image.quality'), ['low','medium','high'], true)
            || mb_strlen($prompt) < 10 || mb_strlen($prompt) > 8000) {
            throw new ImageException('Image provider configuration or request is invalid. Contact an administrator.', 'configuration');
        }
        try {
            $response = Http::acceptJson()->withToken(config('ai_studio.api_key'))
                ->connectTimeout(config('ai_image.connect_timeout_seconds'))->timeout(config('ai_image.timeout_seconds'))
                ->withOptions(['stream' => true])->post(self::ENDPOINT, [
                    'model' => config('ai_image.model'), 'prompt' => $prompt, 'n' => 1,
                    'size' => $size, 'quality' => config('ai_image.quality'), 'output_format' => 'png',
                    'background' => 'opaque', 'moderation' => 'auto',
                ]);
            try {
                if ($response->status() === 429) throw new ImageException('Image quota or rate limit reached. Check credits or try later; your article is unchanged.', 'quota');
                if (! $response->successful()) throw new ImageException('Image provider unavailable. Try later; your article is unchanged.');
                $stream = $response->toPsrResponse()->getBody(); $json = '';
                while (! $stream->eof()) {
                    $chunk = $stream->read(8192);
                    if ($chunk === '' && ! $stream->eof()) throw new ImageException('The image response could not be read.', 'invalid');
                    $json .= $chunk;
                    if (strlen($json) > config('ai_image.max_response_bytes')) throw new ImageException('The image response exceeded the size limit.', 'invalid');
                }
                $data = json_decode($json, true, 32, JSON_THROW_ON_ERROR);
                $encoded = $data['data'][0]['b64_json'] ?? null;
                if (! is_string($encoded) || strlen($encoded) > (int) ceil(config('ai_image.max_bytes') * 4 / 3) + 4) throw new ImageException('The provider returned invalid image data.', 'invalid');
                $bytes = base64_decode($encoded, true);
                if (! is_string($bytes) || $bytes === '') throw new ImageException('The provider returned invalid image data.', 'invalid');
                app(ImageProcessor::class)->inspect($bytes);
                return $bytes;
            } finally { $response->close(); }
        } catch (ImageException $e) { throw $e; }
        catch (Throwable) { throw new ImageException('Image generation failed or timed out. Your article is unchanged.'); }
    }
}
