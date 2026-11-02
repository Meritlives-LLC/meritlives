<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\News;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewsCategoryFilteringTest extends TestCase
{
    use RefreshDatabase;

    public function test_custom_active_news_categories_filter_published_stories(): void
    {
        $category = Category::create(['name' => 'Science & Research', 'slug' => 'research-updates', 'type' => 'news', 'status' => 'active']);
        foreach (['published', 'pending'] as $status) {
            News::create(['title' => $status, 'slug' => $status, 'category_id' => $category->id,
                'source_name' => 'Fixture', 'source_url' => 'https://example.com/'.$status,
                'status' => $status, 'published_at' => now()->subDay()]);
        }
        $this->getJson('/api/v1/news?category=research-updates')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.slug', 'published')
            ->assertJsonPath('data.0.category.name', 'Science & Research');
        $this->getJson('/api/v1/news/published')->assertOk()->assertJsonPath('data.category.slug', 'research-updates');
        $category->update(['status' => 'inactive']);
        $this->getJson('/api/v1/news?category=research-updates')->assertOk()->assertJsonCount(0, 'data');
        $category->update(['status' => 'active', 'type' => 'blog']);
        $this->getJson('/api/v1/news?category=research-updates')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_category_visibility_includes_empty_active_news_categories_only(): void
    {
        foreach (['active', 'inactive', 'draft'] as $status) {
            Category::create(['name' => 'Visibility '.$status, 'slug' => 'visibility-'.$status, 'type' => 'news', 'status' => $status]);
        }
        Category::create(['name' => 'Blog category', 'slug' => 'visibility-blog', 'type' => 'blog', 'status' => 'active']);
        $response = $this->getJson('/api/v1/categories?type=news&per_page=50')->assertOk();
        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertContains('visibility-active', $slugs);
        $this->assertNotContains('visibility-inactive', $slugs);
        $this->assertNotContains('visibility-draft', $slugs);
        $this->assertNotContains('visibility-blog', $slugs);
        $this->getJson('/api/v1/news?category=visibility-active')->assertOk()->assertJsonCount(0, 'data');
    }
}
