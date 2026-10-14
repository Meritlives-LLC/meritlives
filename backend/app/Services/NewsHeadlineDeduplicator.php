<?php

namespace App\Services;

use App\Models\News;
use Illuminate\Support\Str;

class NewsHeadlineDeduplicator
{
    /**
     * Find an exact or near-duplicate recent headline. This is a review aid,
     * not a factual-equivalence detector; editors can still choose to keep
     * distinct stories that happen to have similar titles.
     */
    public function findDuplicate(string $title, ?int $ignoreNewsId = null): ?News
    {
        $normalized = $this->normalize($title);
        if ($normalized === '') {
            return null;
        }

        $query = News::query()->where('created_at', '>=', now()->subDays(45));
        if ($ignoreNewsId) {
            $query->whereKeyNot($ignoreNewsId);
        }

        // Exact title matches are cheap and should be caught before fuzzy checks.
        $exact = (clone $query)->whereRaw('LOWER(title) = ?', [mb_strtolower(trim($title))])->first();
        if ($exact) {
            return $exact;
        }

        $candidates = $query->latest('created_at')->limit(1000)->get(['id', 'title', 'slug', 'created_at']);
        foreach ($candidates as $candidate) {
            $candidateTitle = $this->normalize((string) $candidate->title);
            if ($candidateTitle === '' || abs(strlen($normalized) - strlen($candidateTitle)) > max(8, (int) (strlen($normalized) * 0.15))) {
                continue;
            }

            similar_text($normalized, $candidateTitle, $similarity);
            if ($similarity >= 92.0) {
                return $candidate;
            }
        }

        return null;
    }

    private function normalize(string $title): string
    {
        return preg_replace('/[^a-z0-9]+/', '', Str::lower(trim($title))) ?? '';
    }
}
