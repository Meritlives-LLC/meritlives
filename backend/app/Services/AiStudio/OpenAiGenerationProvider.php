<?php

namespace App\Services\AiStudio;

use Illuminate\Support\Facades\Http;
use JsonException;
use RuntimeException;
use Throwable;

class OpenAiGenerationProvider implements AiGenerationProvider
{
    private const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

    public function generateArticle(string $prompt, ?string $instructions): array
    {
        $apiKey = config('ai_studio.api_key');
        $model = config('ai_studio.model');
        if (! is_string($apiKey) || trim($apiKey) === '' || ! is_string($model) || trim($model) === '') {
            throw new RuntimeException('The configured AI provider is unavailable.');
        }

        try {
            $response = Http::acceptJson()
                ->withToken($apiKey)
                ->connectTimeout(max(1, (int) config('ai_studio.connect_timeout_seconds', 5)))
                ->timeout(max(1, (int) config('ai_studio.timeout_seconds', 45)))
                ->withOptions(['stream' => true])
                ->post(self::ENDPOINT, [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => implode("\n\n", array_filter([
                            'Return exactly one JSON object with no markdown. For standard article output, include non-empty string fields title, slug, excerpt, and body. When caller instructions specify a structured schema, follow that schema exactly.',
                            trim((string) $instructions),
                        ], static fn (string $instruction): bool => $instruction !== ''))],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'max_completion_tokens' => max(1, (int) config('ai_studio.max_output_tokens', 1200)),
                ]);
        } catch (Throwable) {
            throw new RuntimeException('The AI provider request failed.');
        }

        $maxBytes = max(1, (int) config('ai_studio.max_response_bytes', 100000));
        if (! $response->successful()) {
            $this->closeResponse($response);
            throw new RuntimeException('The AI provider returned an unusable response.');
        }

        try {
            $body = $this->readBoundedBody($response, $maxBytes);
        } catch (Throwable) {
            $this->closeResponse($response);
            throw new RuntimeException('The AI provider returned an unusable response.');
        }
        $this->closeResponse($response);

        try {
            $payload = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new RuntimeException('The AI provider returned malformed content.');
        }

        if (! is_array($payload)) {
            throw new RuntimeException('The AI provider returned an unusable response.');
        }
        $choice = $payload['choices'][0] ?? null;
        $message = is_array($choice) ? ($choice['message'] ?? null) : null;
        $content = is_array($message) ? ($message['content'] ?? null) : null;
        if (! is_array($message) || ! empty($message['refusal']) || ! is_string($content) || trim($content) === '') {
            throw new RuntimeException('The AI provider could not generate this content.');
        }

        try {
            $data = json_decode($content, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new RuntimeException('The AI provider returned malformed content.');
        }
        if (! is_array($data)) {
            throw new RuntimeException('The AI provider returned malformed content.');
        }

        // News Discovery sends a schema requiring headline/lead/paragraphs and
        // consumes the JSON string from body. Keep that existing contract.
        if (isset($data['headline'], $data['lead'], $data['paragraphs'])) {
            $title = $data['headline'];
            $slug = $data['slug'] ?? $data['headline'];
            $excerpt = $data['lead'];
            $body = $content;
        } else {
            $title = $data['title'] ?? null;
            $slug = $data['slug'] ?? null;
            $excerpt = $data['excerpt'] ?? null;
            $body = $data['body'] ?? null;
        }

        foreach ([$title, $slug, $excerpt, $body] as $field) {
            if (! is_string($field) || trim($field) === '') {
                throw new RuntimeException('The AI provider returned malformed content.');
            }
        }

        return [
            'title' => $title,
            'slug' => $slug,
            'excerpt' => $excerpt,
            'body' => $body,
            'provider' => 'openai',
            'model' => $model,
        ];
    }

    public function generateImage(string $prompt, ?string $instructions): array
    {
        throw new RuntimeException('Image generation is unavailable for the configured AI provider.');
    }

    private function readBoundedBody(\Illuminate\Http\Client\Response $response, int $maxBytes): string
    {
        $stream = $response->toPsrResponse()->getBody();
        $contentLength = $response->header('Content-Length');
        if (is_string($contentLength) && ctype_digit($contentLength) && (int) $contentLength > $maxBytes) {
            throw new RuntimeException('Response exceeds configured byte limit.');
        }

        $body = '';
        while (! $stream->eof()) {
            $remaining = $maxBytes + 1 - strlen($body);
            if ($remaining <= 0) {
                throw new RuntimeException('Response exceeds configured byte limit.');
            }

            $chunk = $stream->read(min(8192, $remaining));
            if ($chunk === '' && ! $stream->eof()) {
                throw new RuntimeException('Response stream could not be read.');
            }

            $body .= $chunk;
            if (strlen($body) > $maxBytes) {
                throw new RuntimeException('Response exceeds configured byte limit.');
            }
        }

        return $body;
    }

    private function closeResponse(\Illuminate\Http\Client\Response $response): void
    {
        try {
            $response->close();
        } catch (Throwable) {
            // Closing a failed provider stream must not expose transport details.
        }
    }
}
