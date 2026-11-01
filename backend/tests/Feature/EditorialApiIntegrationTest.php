<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\News;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EditorialApiIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_news_blog_and_search_endpoints_return_published_editorial_content(): void
    {
        News::query()->create([
            'title' => 'Integration News Story',
            'slug' => 'integration-news-story',
            'excerpt' => 'A local API integration fixture.',
            'content' => '<p>Searchable integration content.</p><script>alert(1)</script><img src="x" onerror="alert(2)">',
            'author_name' => 'Editorial Team',
            'source_name' => 'MERITLIVES',
            'source_url' => 'https://example.test/news/integration-news-story',
            'status' => 'published',
            'is_public_approved' => true,
            'featured' => true,
            'published_at' => now(),
        ]);

        BlogPost::query()->create([
            'title' => 'Integration Blog Story',
            'slug' => 'integration-blog-story',
            'excerpt' => 'A local API integration fixture.',
            'content' => '<p>Searchable integration content.</p><script>alert(1)</script><img src="x" onerror="alert(2)">',
            'status' => 'published',
            'is_public_approved' => true,
            'featured' => true,
            'published_at' => now(),
            'featured_image' => 'blogs/integration.jpg',
        ]);

        News::query()->create([
            'title' => 'Integration Pending News',
            'slug' => 'integration-pending-news',
            'excerpt' => 'This item requires review.',
            'author_name' => 'Editorial Team',
            'source_name' => 'MERITLIVES',
            'source_url' => 'https://example.test/news/integration-pending-news',
            'status' => 'pending',
            'featured' => true,
            'published_at' => now(),
        ]);

        BlogPost::query()->create([
            'title' => 'Integration Draft Blog',
            'slug' => 'integration-draft-blog',
            'excerpt' => 'This draft must remain private.',
            'status' => 'draft',
            'featured' => true,
            'published_at' => now(),
        ]);

        BlogPost::query()->create([
            'title' => 'Integration Unapproved Blog',
            'slug' => 'integration-unapproved-blog',
            'excerpt' => 'Published but not approved for public release.',
            'status' => 'published',
            'is_public_approved' => false,
            'featured' => true,
            'published_at' => now(),
        ]);

        BlogPost::query()->create([
            'title' => 'Integration Approved Draft Blog',
            'slug' => 'integration-approved-draft-blog',
            'excerpt' => 'Approval does not publish a draft.',
            'status' => 'draft',
            'is_public_approved' => true,
            'featured' => true,
            'published_at' => now(),
        ]);

        $this->getJson('/api/v1/news?featured=1&per_page=5')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'integration-news-story')
            ->assertJsonPath('data.0.source.name', 'MERITLIVES')
            ->assertJsonMissing(['slug' => 'integration-pending-news']);

        $blogResponse = $this->getJson('/api/v1/blog?featured=1&per_page=5');
        $this->assertTrue($blogResponse->headers->hasCacheControlDirective('private'));
        $this->assertTrue($blogResponse->headers->hasCacheControlDirective('no-store'));
        $this->assertSame('0', $blogResponse->headers->getCacheControlDirective('max-age'));
        $blogResponse->assertOk()
            ->assertJsonPath('data.0.slug', 'integration-blog-story')
            ->assertJsonPath('data.0.featured_image', fn ($url) => str_ends_with($url, '/storage/blogs/integration.jpg'))
            ->assertJsonMissing(['slug' => 'integration-draft-blog'])
            ->assertJsonMissing(['slug' => 'integration-unapproved-blog'])
            ->assertJsonMissing(['slug' => 'integration-approved-draft-blog']);

        $this->getJson('/api/v1/search?q=Integration')
            ->assertOk()
            ->assertJsonPath('data.news.0.slug', 'integration-news-story')
            ->assertJsonPath('data.blog.0.slug', 'integration-blog-story')
            ->assertJsonMissing(['slug' => 'integration-pending-news'])
            ->assertJsonMissing(['slug' => 'integration-draft-blog'])
            ->assertJsonMissing(['slug' => 'integration-unapproved-blog'])
            ->assertJsonMissing(['slug' => 'integration-approved-draft-blog'])
            ->assertJsonStructure(['data' => ['news', 'blog', 'products', 'services'], 'meta' => ['query']]);

        foreach (['/api/v1/news/integration-news-story', '/api/v1/blog/integration-blog-story'] as $endpoint) {
            $this->getJson($endpoint)
                ->assertOk()
                ->assertJsonPath('data.content', fn (string $content) => str_contains($content, '<p>')
                    && ! str_contains(strtolower($content), '<script')
                    && ! str_contains(strtolower($content), 'onerror'));
        }

        $this->getJson('/api/v1/blog/integration-unapproved-blog')->assertNotFound();
        $this->getJson('/api/v1/blog/integration-approved-draft-blog')->assertNotFound();
    }

    public function test_revoking_public_approval_removes_blog_from_public_listing_and_detail_immediately(): void
    {
        $post = BlogPost::query()->create([
            'title' => 'Revocable Public Blog',
            'slug' => 'revocable-public-blog',
            'status' => 'published',
            'is_public_approved' => true,
            'featured' => true,
            'published_at' => now()->subMinute(),
        ]);

        $this->getJson('/api/v1/blog?featured=1')->assertOk()->assertJsonFragment(['slug' => $post->slug]);
        $this->getJson('/api/v1/blog/'.$post->slug)->assertOk();

        $post->update(['is_public_approved' => false]);

        $this->getJson('/api/v1/blog?featured=1')->assertOk()->assertJsonMissing(['slug' => $post->slug]);
        $this->getJson('/api/v1/blog/'.$post->slug)->assertNotFound();
    }

    public function test_blog_public_endpoints_return_no_posts_when_no_eligible_posts_exist(): void
    {
        BlogPost::query()->create([
            'title' => 'Future Public Blog',
            'slug' => 'future-public-blog',
            'status' => 'published',
            'is_public_approved' => true,
            'featured' => true,
            'published_at' => now()->addDay(),
        ]);

        $this->getJson('/api/v1/blog?featured=1')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
