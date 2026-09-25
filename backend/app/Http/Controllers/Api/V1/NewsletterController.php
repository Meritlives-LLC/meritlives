<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\NewsletterSubscriptionRequest;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;

class NewsletterController extends Controller
{
    public function store(NewsletterSubscriptionRequest $request): JsonResponse
    {
        $subscriber = NewsletterSubscriber::updateOrCreate(
            ['email' => strtolower($request->validated('email'))],
            [
                'name' => $request->validated('name'),
                'status' => 'subscribed',
                'subscribed_at' => now(),
            ]
        );

        return response()->json([
            'data' => [
                'id' => $subscriber->id,
                'status' => 'subscribed',
            ],
            'message' => 'Subscription received.',
            'meta' => [],
        ], 201);
    }
}
