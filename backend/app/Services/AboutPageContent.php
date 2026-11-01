<?php

namespace App\Services;

use App\Models\{Setting, Product, Service};
use Illuminate\Support\Facades\{DB, Storage, Validator};
use Illuminate\Validation\Rule;

class AboutPageContent
{
    public const DRAFT = 'about_page_draft';
    public const PUBLISHED = 'about_page_published';

    public function authorize(): void
    {
        abort_unless(auth()->user()?->hasAnyRole(['admin', 'super_admin']) && auth()->user()->can('manage_settings'), 403);
    }

    public function read(string $key = self::PUBLISHED): array
    {
        $value = json_decode(Setting::where('key', $key)->value('value') ?? 'null', true);
        return array_replace(config('about.defaults'), is_array($value) ? array_intersect_key($value, config('about.defaults')) : []);
    }

    public function draft(): array
    {
        return Setting::where('key', self::DRAFT)->exists() ? $this->read(self::DRAFT) : $this->read();
    }

    public function serviceOptions(): array
    {
        return config('about.services') + Service::where('status', 'published')->orderBy('name')->pluck('name', 'slug')->all();
    }

    public function productOptions(): array
    {
        return config('about.products') + Product::where('status', 'published')->orderBy('name')->pluck('name', 'slug')->all();
    }

    public function validate(array $data): array
    {
        $rules = [];
        foreach (['hero_title','who_title','story_title','cta_title'] as $key) $rules[$key] = 'required|string|max:200';
        foreach (['hero_description','who_body','story_body','mission','vision','cta_description'] as $key) $rules[$key] = 'required|string|max:3000';
        foreach (['hero_image_alt','section_image_alt'] as $key) $rules[$key] = 'required|string|max:255';
        foreach (['cta_primary_label','cta_secondary_label'] as $key) $rules[$key] = 'required|string|max:60';
        $rules += ['seo_title' => 'required|string|max:70', 'seo_description' => 'required|string|max:170'];
        foreach (['hero_image','section_image','social_image'] as $key) {
            $rules[$key] = ['nullable', 'string', 'regex:~^general/[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$~'];
        }
        foreach (['values','approach'] as $key) {
            $rules[$key] = 'required|array|min:1|max:10';
            $rules[$key.'.*.title'] = 'required|string|max:80';
            $rules[$key.'.*.description'] = 'required|string|max:600';
        }
        $rules += ['service_slugs' => 'present|array|max:20', 'service_slugs.*' => ['string', 'distinct', Rule::in(array_keys($this->serviceOptions()))],
            'product_slugs' => 'present|array|max:20', 'product_slugs.*' => ['string', 'distinct', Rule::in(array_keys($this->productOptions()))]];
        $valid = Validator::make($data, $rules)->validate();
        foreach ($valid as $key => &$value) {
            if (is_string($value)) $value = trim(strip_tags($value));
            if (in_array($key, ['values','approach'])) $value = array_map(fn ($item) => [
                'title' => trim(strip_tags($item['title'])), 'description' => trim(strip_tags($item['description'])),
            ], $value);
        }
        unset($value);
        return $valid;
    }

    public function save(array $data, bool $publish = false): array
    {
        $this->authorize();
        $data = $this->validate($data);
        DB::transaction(function () use ($data, $publish) {
            foreach ($publish ? [self::DRAFT, self::PUBLISHED] : [self::DRAFT] as $key) {
                Setting::updateOrCreate(['key' => $key], ['type' => 'json', 'value' => json_encode($data, JSON_THROW_ON_ERROR)]);
            }
        });
        return $data;
    }

    public function publicContent(): array
    {
        $data = $this->read();
        foreach (['hero_image','section_image','social_image'] as $key) {
            $path = $data[$key];
            $data[$key] = is_string($path) && preg_match('~^general/[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$~', $path)
                ? Storage::disk('public')->url($path) : null;
        }
        $data['service_slugs'] = array_values(array_intersect($data['service_slugs'], array_keys($this->serviceOptions())));
        $data['product_slugs'] = array_values(array_intersect($data['product_slugs'], array_keys($this->productOptions())));
        return $data;
    }
}
