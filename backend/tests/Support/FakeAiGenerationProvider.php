<?php

namespace Tests\Support;

use App\Services\AiStudio\AiGenerationProvider;
use RuntimeException;

class FakeAiGenerationProvider implements AiGenerationProvider
{
    public int $articleCalls = 0;
    public int $imageCalls = 0;
    public bool $fail = false;
    public ?array $imageResult = null;

    public function generateArticle(string $prompt, ?string $instructions): array
    {
        $this->articleCalls++;
        if ($this->fail) {
            throw new RuntimeException('fake provider internal credential=never-log-this');
        }

        return [
            'title' => 'A Test Article',
            'slug' => 'a-test-article',
            'excerpt' => 'A safe preview excerpt.',
            'body' => '<p>Safe body.</p><script>bad()</script>',
            'provider' => 'fake',
            'model' => 'deterministic',
        ];
    }

    public function generateImage(string $prompt, ?string $instructions): array
    {
        $this->imageCalls++;
        if ($this->imageResult !== null) {
            return $this->imageResult;
        }
        if ($this->fail) {
            throw new RuntimeException('fake image provider failure');
        }

        return [
            'bytes' => base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/jXcAAAAASUVORK5CYII=', true),
            'mime' => 'image/png',
            'provider' => 'fake',
            'model' => 'deterministic-image',
        ];
    }
}
