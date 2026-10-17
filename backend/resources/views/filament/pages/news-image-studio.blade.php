<x-filament-panels::page>
    <div class="space-y-6">
        <x-filament::section>
            <form wire:submit="generate" class="space-y-4">
                {{ $this->form }}
                <x-filament::button type="submit" icon="heroicon-o-sparkles">
                    Generate image
                </x-filament::button>
            </form>
        </x-filament::section>

        @if ($latestImageUrl)
            <x-filament::section heading="Latest generated image">
                <img src="{{ $latestImageUrl }}" alt="Generated editorial illustration awaiting approval" class="max-w-full rounded-xl" />
                <p class="mt-3 text-sm text-gray-500">This image is pending editorial approval. Review it in News before publishing.</p>
            </x-filament::section>
        @endif
    </div>
</x-filament-panels::page>
