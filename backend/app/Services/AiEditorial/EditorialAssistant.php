<?php

namespace App\Services\AiEditorial;

use App\Filament\Resources\BlogPostResource;
use App\Filament\Resources\NewsResource;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\News;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class EditorialAssistant
{
    public function authorize(string $type, ?int $id = null): void
    {
        abort_unless(in_array($type, ['news', 'blog'], true), 404);
        $resource = $type === 'news' ? NewsResource::class : BlogPostResource::class;
        $user = auth()->user();
        abort_unless($user && $user->hasAnyRole(['super_admin', 'admin', 'editor', 'author']), 403);
        $record = $id ? ($type === 'news' ? News::findOrFail($id) : BlogPost::findOrFail($id)) : null;
        abort_unless($record ? $resource::canEdit($record) : $resource::canCreate(), 403);
    }

    public function categories(string $type): array
    {
        $query = Category::query()->where('type', $type)->where('status', 'active');
        if ($type === 'news') {
            $query->whereIn('name', ['Technology', 'Business', 'Insights']);
        }
        return $query->orderBy('name')->pluck('name', 'id')->all();
    }

    public function generate(string $type, array $input, ?int $id = null): array
    {
        $this->authorize($type, $id);
        abort_unless(config('ai_editorial.enabled'), 503, 'AI editorial assistance is disabled.');
        abort_if(strlen(json_encode($input, JSON_THROW_ON_ERROR)) > 140000, 413, 'Editorial request is too large.');
        $input = Validator::make($input, [
            'topic' => 'required|string|max:250',
            'operation' => ['required', Rule::in($type === 'news' ? ['draft', 'headline', 'improve', 'seo', 'category'] : ['outline', 'draft', 'introduction', 'headline', 'improve', 'seo', 'category'])],
            'source_text' => 'nullable|string|max:16000', 'existing_content' => 'nullable|string|max:16000',
            'source_name' => 'nullable|string|max:255', 'source_url' => 'nullable|url:http,https|max:2048',
            'audience' => 'nullable|string|max:300', 'angle' => 'nullable|string|max:1000',
            'length' => ['required', Rule::in(['short', 'medium', 'long'])],
        ])->validate();
        if ($type === 'news' && trim($input['source_text'] ?? '') === '') {
            throw ValidationException::withMessages(['source_text' => 'Paste source text or editor-verified facts. URLs are not fetched or verified.']);
        }
        if (in_array($input['operation'], ['introduction', 'improve', 'seo', 'category', 'headline'], true)
            && trim($input['existing_content'] ?? '') === '' && trim($input['source_text'] ?? '') === '') {
            throw ValidationException::withMessages(['existing_content' => 'Provide existing article text or verified facts for this operation.']);
        }
        $key = 'ai-editorial:'.auth()->id();
        if (RateLimiter::tooManyAttempts($key, config('ai_editorial.limit_per_minute', 5))) {
            throw ValidationException::withMessages(['topic' => 'Too many AI requests. Try again in a minute.']);
        }
        RateLimiter::hit($key, 60);
        $provider = app(EditorialProvider::class);
        $output = $this->validateOutput($provider->suggest($input + ['content_type' => $type], $this->categories($type)), $type);
        // Attribution is editor-supplied, never model-generated or fetched.
        $output['source_name'] = $input['source_name'] ?? '';
        $output['source_url'] = $input['source_url'] ?? '';
        $output['verification_checklist'] = array_merge([
            'Source URL has NOT been fetched or verified. Open it and confirm provenance.',
            'Check every name, quotation, statistic, date and announcement against original evidence.',
            'Check originality, copyright, neutrality, category and SEO before saving.',
            'Suggestions require editorial review. Publication remains a separate editorial decision.',
        ], array_slice($output['verification_checklist'], 0, 16));
        return $output;
    }

    public function validateOutput(array $output, string $type): array
    {
        $rules = ['title' => 'required|string|max:255', 'body' => 'required|string|max:30000',
            'excerpt' => 'required|string|max:1000', 'seo_title' => 'required|string|max:70',
            'seo_description' => 'required|string|max:170', 'slug' => 'required|string|max:255',
            'category_id' => ['present', 'nullable', 'integer', Rule::in(array_keys($this->categories($type)))],
            'verification_checklist' => 'required|array|min:1|max:20',
            'verification_checklist.*' => 'required|string|max:500'];
        $validator = Validator::make($output, $rules);
        if ($validator->fails()) {
            throw new RuntimeException('AI returned invalid suggestions. Try again; your article is unchanged.');
        }
        $data = $validator->validated();
        foreach (['title', 'body', 'excerpt', 'seo_title', 'seo_description'] as $field) {
            $data[$field] = trim(strip_tags($data[$field]));
            if ($data[$field] === '') {
                throw new RuntimeException('AI returned empty suggestions.');
            }
        }
        $data['slug'] = Str::slug($data['slug']);
        if ($data['slug'] === '') {
            throw new RuntimeException('AI returned an invalid slug.');
        }
        return $data;
    }

    public function fields(string $operation, string $type): array
    {
        $fields = match ($operation) {
            'headline' => ['title', 'slug'], 'seo' => ['seo_title', 'seo_description'],
            'category' => ['category_id'], 'introduction', 'outline', 'improve' => ['body'],
            default => ['title', 'slug', 'body', 'excerpt', 'seo_title', 'seo_description', 'category_id'],
        };
        return $type === 'news' && $operation === 'draft' ? [...$fields, 'source_name', 'source_url'] : $fields;
    }
}
