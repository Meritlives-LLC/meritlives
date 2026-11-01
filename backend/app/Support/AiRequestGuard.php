<?php

namespace App\Support;

use Illuminate\Support\Facades\{Cache, RateLimiter};

class AiRequestGuard
{
    public function run(int $actor, callable $operation): mixed
    {
        $userLock = Cache::lock('ai-request-user:'.$actor, 180);
        if (! $userLock->get()) {
            throw new AiRequestLimitException('An AI request is already running for your account. Try again after it finishes.');
        }
        $slot = null;
        try {
            // Fixed-size slot pool: no unbounded per-request counters or blocking queue.
            for ($i = 0; $i < max(1, min(8, (int) config('traffic.ai_concurrency', 2))); $i++) {
                $candidate = Cache::lock('ai-request-slot:'.$i, 180);
                if ($candidate->get()) { $slot = $candidate; break; }
            }
            if (! $slot) throw new AiRequestLimitException('AI capacity is busy. Try again shortly.');
            $this->consume($actor, 'generation', [
                'minute' => [(int) config('traffic.ai_per_minute', 10), 60],
                'day' => [(int) config('traffic.ai_per_day', 60), 86400],
            ]);
            return $operation();
        } finally {
            $slot?->release();
            $userLock->release();
        }
    }

    public function createJob(int $actor): void
    {
        $lock = Cache::lock('ai-job-budget:'.$actor, 5);
        if (! $lock->get()) throw new AiRequestLimitException('Another AI job is being created. Try again shortly.');
        try {
            $this->consume($actor, 'job', [
                'minute' => [(int) config('traffic.ai_jobs_per_minute', 10), 60],
                'day' => [(int) config('traffic.ai_jobs_per_day', 100), 86400],
            ]);
        } finally { $lock->release(); }
    }

    private function consume(int $actor, string $type, array $windows): void
    {
        foreach ($windows as $window => [$limit, $seconds]) {
            $key = 'ai-budget:'.$type.':'.$window.':'.$actor;
            if (RateLimiter::tooManyAttempts($key, max(1, $limit))) {
                $retry = max(1, RateLimiter::availableIn($key));
                throw new AiRequestLimitException('AI request limit reached. Try again in '.$retry.' seconds.');
            }
        }
        foreach ($windows as $window => [$limit, $seconds]) RateLimiter::hit('ai-budget:'.$type.':'.$window.':'.$actor, $seconds);
    }
}
