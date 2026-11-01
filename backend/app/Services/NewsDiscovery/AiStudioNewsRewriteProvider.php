<?php

namespace App\Services\NewsDiscovery;

use App\Services\AiStudio\AiGenerationProvider;
use JsonException;

class AiStudioNewsRewriteProvider implements NewsRewriteProvider
{
    public function __construct(private readonly AiGenerationProvider $provider) {}

    public function rewrite(array $source): array
    {
        $schema = 'Return JSON only, with keys headline, lead, paragraphs (array of strings), slug, seo_title, meta_description, verification_flags (array of strings).';
        $rules = implode(' ', array_filter([
            trim((string) ($source['prompt_template'] ?? '')),
            trim((string) ($source['prompt_template_instructions'] ?? '')),
            'Write an original, neutral, professional news article in inverted-pyramid order.',
            'Use only facts explicitly present in the supplied source fields.',
            'Preserve names, dates, figures, quotation wording and attribution exactly where supplied.',
            'Do not invent context, claims, sources, quotes, or independent verification.',
            'Do not copy the source excerpt verbatim beyond short necessary names or quoted phrases.',
            'Flag uncertainties, missing facts, allegations, and any point requiring editorial verification.',
            $schema,
        ]));
        $result = $this->provider->generateArticle(json_encode($source, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), $rules);
        $body = (string) ($result['body'] ?? '');
        if (strlen($body) > 50000) {
            throw new InvalidNewsRewriteResponse('The rewrite provider returned an oversized response.');
        }
        try {
            $structured = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new InvalidNewsRewriteResponse('The rewrite provider returned an invalid structured response.');
        }
        if (! is_array($structured)) {
            throw new InvalidNewsRewriteResponse('The rewrite provider returned an invalid structured response.');
        }

        return [
            ...$structured,
            'provider' => $result['provider'] ?? null,
            'model' => $result['model'] ?? null,
        ];
    }
}
