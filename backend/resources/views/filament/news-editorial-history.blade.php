<div class="space-y-4">
    @forelse ($events as $event)
        <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <strong class="text-sm">{{ str($event->event_type)->replace('_', ' ')->title() }}</strong>
                <span class="text-xs text-gray-500">{{ $event->created_at?->format('M j, Y H:i') }}</span>
            </div>
            <p class="mt-1 text-sm text-gray-500">
                {{ $event->user?->name ?? $event->user?->email ?? 'System' }}
                @if ($event->from_status || $event->to_status)
                    · {{ $event->from_status ?? '—' }} → {{ $event->to_status ?? '—' }}
                @endif
            </p>
            @if ($event->notes)
                <p class="mt-2 whitespace-pre-wrap text-sm">{{ $event->notes }}</p>
            @endif
        </div>
    @empty
        <p class="text-sm text-gray-500">No editorial history recorded yet.</p>
    @endforelse
</div>
