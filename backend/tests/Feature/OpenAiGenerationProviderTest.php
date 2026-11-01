<?php

namespace Tests\Feature;

use App\Services\AiStudio\AiGenerationProvider;
use App\Services\AiStudio\OpenAiGenerationProvider;
use App\Services\AiStudio\UnavailableAiGenerationProvider;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use GuzzleHttp\Psr7\Response as PsrResponse;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class OpenAiGenerationProviderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'ai_studio.provider' => 'openai',
            'ai_studio.api_key' => 'test-secret-key',
            'ai_studio.model' => 'test-model',
            'ai_studio.connect_timeout_seconds' => 3,
            'ai_studio.timeout_seconds' => 17,
            'ai_studio.max_output_tokens' => 321,
            'ai_studio.max_response_bytes' => 100000,
        ]);
        Http::preventStrayRequests();
    }

    public function test_article_request_uses_server_key_and_returns_validated_contract(): void
    {
        Http::fake(['api.openai.com/*' => Http::response([
            'choices' => [['message' => ['content' => json_encode([
                'title' => 'Generated title', 'slug' => 'generated-title', 'excerpt' => 'An excerpt.', 'body' => '<p>Body</p>',
            ], JSON_THROW_ON_ERROR)]]],
        ])]);

        $result = app(OpenAiGenerationProvider::class)->generateArticle('A private prompt', 'Return article JSON.');

        $this->assertSame('Generated title', $result['title']);
        $this->assertSame('generated-title', $result['slug']);
        $this->assertSame('openai', $result['provider']);
        Http::assertSent(fn ($request): bool => $request->url() === 'https://api.openai.com/v1/chat/completions'
            && $request->hasHeader('Authorization', 'Bearer test-secret-key')
            && $request['model'] === 'test-model'
            && $request['messages'][1]['content'] === 'A private prompt'
            && $request['response_format']['type'] === 'json_object');
        Http::assertSent(fn ($request): bool => str_contains($request['messages'][0]['content'], 'non-empty string fields title, slug, excerpt, and body')
            && str_contains($request['messages'][0]['content'], 'Return article JSON.')
            && ($request['max_completion_tokens'] ?? null) === 321);
    }

    public function test_configured_connection_and_request_timeouts_are_applied(): void
    {
        $content = json_encode(['title' => 'A title', 'slug' => 'a-title', 'excerpt' => 'An excerpt', 'body' => '<p>Body</p>'], JSON_THROW_ON_ERROR);
        $pending = Mockery::mock(PendingRequest::class);
        $pending->shouldReceive('withToken')->once()->with('test-secret-key')->andReturnSelf();
        $pending->shouldReceive('connectTimeout')->once()->with(3)->andReturnSelf();
        $pending->shouldReceive('timeout')->once()->with(17)->andReturnSelf();
        $pending->shouldReceive('withOptions')->once()->with(['stream' => true])->andReturnSelf();
        $pending->shouldReceive('post')->once()->with(
            'https://api.openai.com/v1/chat/completions',
            Mockery::on(fn (array $payload): bool => ($payload['max_completion_tokens'] ?? null) === 321),
        )->andReturn(new Response(new PsrResponse(200, [], json_encode(['choices' => [['message' => ['content' => $content]]]], JSON_THROW_ON_ERROR))));
        Http::shouldReceive('acceptJson')->once()->andReturn($pending);

        $result = app(OpenAiGenerationProvider::class)->generateArticle('Prompt', null);

        $this->assertSame('A title', $result['title']);
    }

    public function test_missing_article_fields_are_rejected(): void
    {
        Http::fake(['api.openai.com/*' => Http::response(['choices' => [['message' => ['content' => json_encode([
            'title' => 'A title', 'slug' => 'a-title', 'body' => '<p>Body</p>',
        ], JSON_THROW_ON_ERROR)]]]])]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('The AI provider returned malformed content.');
        app(OpenAiGenerationProvider::class)->generateArticle('Prompt', null);
    }

    public function test_news_rewrite_json_remains_in_body_for_existing_consumer(): void
    {
        $content = json_encode([
            'headline' => 'News headline', 'lead' => 'News lead', 'paragraphs' => ['First paragraph.'],
            'slug' => 'news-headline', 'seo_title' => 'SEO title', 'meta_description' => 'Description', 'verification_flags' => [],
        ], JSON_THROW_ON_ERROR);
        Http::fake(['api.openai.com/*' => Http::response(['choices' => [['message' => ['content' => $content]]]])]);

        $result = app(OpenAiGenerationProvider::class)->generateArticle('A news rewrite payload', 'Return the news schema.');

        $this->assertSame('News headline', $result['title']);
        $this->assertSame('News lead', $result['excerpt']);
        $this->assertSame($content, $result['body']);
    }

    public function test_provider_http_error_does_not_expose_response_or_key(): void
    {
        Http::fake(['api.openai.com/*' => Http::response(['error' => 'test-secret-key provider detail'], 500)]);

        try {
            app(OpenAiGenerationProvider::class)->generateArticle('Prompt', null);
            $this->fail('Expected provider error.');
        } catch (RuntimeException $exception) {
            $this->assertSame('The AI provider returned an unusable response.', $exception->getMessage());
            $this->assertStringNotContainsString('test-secret-key', $exception->getMessage());
        }
    }

    public function test_network_timeout_has_safe_error(): void
    {
        Http::fake(function () {
            throw new ConnectionException('test-secret-key and private provider detail');
        });

        try {
            app(OpenAiGenerationProvider::class)->generateArticle('Prompt', null);
            $this->fail('Expected connection error.');
        } catch (RuntimeException $exception) {
            $this->assertSame('The AI provider request failed.', $exception->getMessage());
            $this->assertStringNotContainsString('private provider detail', $exception->getMessage());
        }
    }

    public function test_timeout_specific_connection_failure_is_generic(): void
    {
        Http::fake(function () {
            throw new ConnectionException('cURL error 28: Operation timed out; test-secret-key');
        });

        try {
            app(OpenAiGenerationProvider::class)->generateArticle('Prompt', null);
            $this->fail('Expected timeout failure.');
        } catch (RuntimeException $exception) {
            $this->assertSame('The AI provider request failed.', $exception->getMessage());
            $this->assertStringNotContainsString('timed out', $exception->getMessage());
            $this->assertStringNotContainsString('test-secret-key', $exception->getMessage());
        }
    }

    public function test_refusal_malformed_and_oversized_responses_fail_safely(): void
    {
        $provider = app(OpenAiGenerationProvider::class);
        Http::fakeSequence('api.openai.com/*')->push([
            'choices' => [['message' => ['refusal' => 'sensitive refusal details']]],
        ])->push([
            'choices' => [['message' => ['content' => 'not JSON']]],
        ])->push(str_repeat('x', 100));
        try {
            $provider->generateArticle('Prompt', null);
            $this->fail('Expected refusal.');
        } catch (RuntimeException $exception) {
            $this->assertSame('The AI provider could not generate this content.', $exception->getMessage());
            $this->assertStringNotContainsString('sensitive refusal', $exception->getMessage());
        }

        try {
            $provider->generateArticle('Prompt', null);
            $this->fail('Expected malformed response.');
        } catch (RuntimeException $exception) {
            $this->assertSame('The AI provider returned malformed content.', $exception->getMessage());
        }

        config(['ai_studio.max_response_bytes' => 10]);
        try {
            $provider->generateArticle('Prompt', null);
            $this->fail('Expected oversized response.');
        } catch (RuntimeException $exception) {
            $this->assertSame('The AI provider returned an unusable response.', $exception->getMessage());
        }
    }

    public function test_image_generation_never_makes_an_http_request(): void
    {
        try {
            app(OpenAiGenerationProvider::class)->generateImage('Image prompt', null);
            $this->fail('Image generation must be unavailable.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Image generation is unavailable for the configured AI provider.', $exception->getMessage());
        }
        Http::assertNothingSent();
    }

    public function test_container_uses_openai_only_with_explicit_provider_and_nonempty_key(): void
    {
        $this->assertInstanceOf(OpenAiGenerationProvider::class, app(AiGenerationProvider::class));

        config(['ai_studio.api_key' => '']);
        app()->forgetInstance(AiGenerationProvider::class);
        $this->assertInstanceOf(UnavailableAiGenerationProvider::class, app(AiGenerationProvider::class));

        config(['ai_studio.provider' => 'none', 'ai_studio.api_key' => 'test-secret-key']);
        app()->forgetInstance(AiGenerationProvider::class);
        $this->assertInstanceOf(UnavailableAiGenerationProvider::class, app(AiGenerationProvider::class));
    }
}
