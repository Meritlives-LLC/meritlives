<?php

namespace Tests\Support;

use App\Services\NewsDiscovery\NewsRewriteProvider;
use RuntimeException;

class FakeNewsRewriteProvider implements NewsRewriteProvider
{
    public int $calls = 0;
    public bool $fail = false;
    public bool $malformed = false;

    public function rewrite(array $source): array
    {
        $this->calls++;
        if ($this->fail) { throw new RuntimeException('fake provider credential=hidden'); }
        if ($this->malformed) { return ['headline' => '<script>bad</script>']; }

        return [
            'headline' => 'Officials announce a new digital services plan',
            'lead' => 'Officials announced a digital services plan on Tuesday in Abuja, according to the supplied source excerpt.',
            'paragraphs' => [
                'The source summary says the plan will improve access to government services for residents.',
                'The source excerpt does not include costs, implementation dates or independently verified outcomes.',
            ],
            'slug' => 'officials-announce-digital-services-plan',
            'seo_title' => 'Officials announce a digital services plan',
            'meta_description' => 'Officials announced a digital services plan in Abuja, according to the supplied source summary.',
            'verification_flags' => ['Confirm the implementation timeline with an authorized source.'],
            'provider' => 'fake',
            'model' => 'deterministic',
        ];
    }
}
