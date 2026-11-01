<?php

namespace App\Services\AiEditorial;

use Illuminate\Support\Str;

class MockEditorialProvider implements EditorialProvider
{
    public function suggest(array $input, array $categories): array
    {
        $title = '[Mock draft] '.mb_substr($input['topic'], 0, 180);
        $body = $input['operation'] === 'outline'
            ? "Introduction\nKey context\nEvidence to verify\nImplications for readers\nConclusion"
            : '[Mock suggestion — editor review required] '.mb_substr($input['source_text'] ?? $input['existing_content'] ?? $input['topic'], 0, 4000);

        return ['title' => $title, 'body' => $body, 'excerpt' => mb_substr($body, 0, 300),
            'seo_title' => mb_substr($title, 0, 70), 'seo_description' => mb_substr($body, 0, 170),
            'slug' => Str::slug($title), 'category_id' => null,
            'verification_checklist' => ['Mock output: replace with original editorial copy.', 'Verify every fact against the supplied source.']];
    }
}
