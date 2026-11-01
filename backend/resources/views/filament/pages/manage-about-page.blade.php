<x-filament-panels::page>
    <p class="text-sm text-gray-600">Drafts are private. Save your work, review the content preview, then explicitly publish when ready. The preview checks content; the public site provides the final layout.</p>
    @if ($previewData)
        <section aria-label="Unpublished About page preview" class="space-y-6 rounded-xl border border-gray-300 bg-white p-6 text-gray-950">
            <h2 class="text-xl font-bold">Unpublished content preview</h2>
            @foreach (['hero_title','hero_description','who_title','who_body','story_title','story_body','mission','vision'] as $key)
                <div><h3 class="font-semibold">{{ str_replace('_', ' ', ucfirst($key)) }}</h3><p class="whitespace-pre-line">{{ $previewData[$key] }}</p></div>
            @endforeach
            @foreach (['hero_image','section_image','social_image'] as $key)
                @if ($previewData[$key])
                    <img src="{{ Storage::disk('public')->url($previewData[$key]) }}" alt="{{ $key === 'hero_image' ? $previewData['hero_image_alt'] : $previewData['section_image_alt'] }}" style="max-width:100%;max-height:320px;object-fit:contain">
                @endif
            @endforeach
            @foreach (['values','approach'] as $key)
                <div><h3 class="font-bold">{{ ucfirst($key) }}</h3><ol class="space-y-2">
                    @foreach ($previewData[$key] as $item)<li><strong>{{ $item['title'] }}</strong> — {{ $item['description'] }}</li>@endforeach
                </ol></div>
            @endforeach
            <p><strong>Services:</strong> {{ implode(', ', $previewData['service_slugs']) }}</p>
            <p><strong>Products:</strong> {{ implode(', ', $previewData['product_slugs']) }}</p>
            <h3 class="font-bold">{{ $previewData['cta_title'] }}</h3><p>{{ $previewData['cta_description'] }}</p>
            <p>{{ $previewData['cta_primary_label'] }} / {{ $previewData['cta_secondary_label'] }}</p>
            <p><strong>SEO:</strong> {{ $previewData['seo_title'] }} — {{ $previewData['seo_description'] }}</p>
        </section>
    @endif
    <form wire:submit="saveDraft" class="space-y-6">
        {{ $this->form }}
        <x-filament::button type="submit">Save draft</x-filament::button>
    </form>
</x-filament-panels::page>
