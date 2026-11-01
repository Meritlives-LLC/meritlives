<?php

namespace Tests\Feature;

use App\Filament\Resources\BlogPostResource;
use App\Models\BlogPost;
use App\Models\User;
use App\Support\RasterUpload;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class SecurityRemediationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Never run repository migrations/seeders or connect to a real database.
        $this->assertSame('testing', app()->environment());
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
        $this->assertEmpty(config('database.connections.sqlite.url'));
        config(['cache.default' => 'array', 'session.driver' => 'array', 'security.trusted_proxies' => []]);
        DB::purge('sqlite');
        foreach (['news', 'blog_posts', 'watch_videos', 'categories', 'users', 'tags', 'blog_post_tag', 'products', 'services', 'watch_sources'] as $table) {
            Schema::create($table, function (Blueprint $t) use ($table) {
                $t->id();
                foreach (['title', 'slug', 'status', 'name', 'type', 'content', 'excerpt', 'youtube_video_id', 'thumbnail_url', 'video_url', 'description', 'source_name', 'source_url', 'author_name'] as $column) {
                    $t->text($column)->nullable();
                }
                foreach (['category_id', 'user_id', 'watch_source_id', 'blog_post_id', 'tag_id', 'sort_order'] as $column) {
                    $t->integer($column)->nullable();
                }
                $t->boolean('featured')->default(false);
                $t->boolean('is_featured')->default(false);
                $t->boolean('is_public_approved')->default(false);
                $t->timestamp('published_at')->nullable();
                $t->timestamps();
            });
        }
    }

    private function user(bool $reviewer = false, bool $admin = false): void
    {
        $user = \Mockery::mock(User::class)->makePartial();
        $user->id = 7;
        $user->shouldReceive('can')->andReturnUsing(fn ($permission) => $permission === 'review_blog' ? $reviewer : true);
        $user->shouldReceive('hasAnyRole')->andReturn($admin);
        $this->actingAs($user);
    }

    public function test_author_ownership_and_protected_create_edit_data(): void
    {
        $this->user();
        $own = new BlogPost(['user_id' => 7]);
        $other = new BlogPost(['user_id' => 8]);
        $this->assertTrue(BlogPostResource::canEdit($own));
        DB::table('blog_posts')->insert([['id' => 1, 'user_id' => 7], ['id' => 2, 'user_id' => 8]]);
        $this->assertNotNull(BlogPostResource::resolveRecordRouteBinding(1));
        $this->assertNull(BlogPostResource::resolveRecordRouteBinding(2));
        foreach (['canView', 'canEdit', 'canDelete', 'canForceDelete', 'canReplicate'] as $action) {
            $this->assertFalse(BlogPostResource::$action($other));
        }
        $data = ['title' => 'Author copy', 'user_id' => 8, 'status' => 'published', 'published_at' => now(), 'featured' => true, 'is_public_approved' => true];
        $this->assertSame(['title' => 'Author copy'], BlogPostResource::authoringData($data));
        $create = BlogPostResource::authoringData($data, true);
        $this->assertSame(7, $create['user_id']);
        $this->assertSame('draft', $create['status']);
        $this->assertFalse($create['is_public_approved']);
        $this->assertNull($create['published_at']);
        $this->assertStringContainsString('user_id', BlogPostResource::getEloquentQuery()->toSql());
    }

    public function test_reviewer_and_administrator_keep_authorized_access(): void
    {
        foreach ([[true, false], [false, true]] as [$review, $admin]) {
            $this->user($review, $admin);
            $this->assertTrue(BlogPostResource::canEdit(new BlogPost(['user_id' => 8])));
            $this->assertTrue(BlogPostResource::authoringData(['is_public_approved' => true])['is_public_approved']);
        }
    }

    public function test_publication_rules_across_listing_featured_detail_and_search(): void
    {
        foreach ([['past', now()->subMinute(), 'published'], ['future', now()->addDay(), 'published'], ['missing', null, 'published'], ['draft', now()->subDay(), 'draft']] as [$slug, $date, $status]) {
            DB::table('news')->insert(['title' => 'Security '.$slug, 'slug' => $slug, 'status' => $status, 'published_at' => $date, 'featured' => true]);
            DB::table('blog_posts')->insert(['title' => 'Security '.$slug, 'slug' => $slug, 'status' => $status, 'published_at' => $date, 'is_public_approved' => true]);
            DB::table('watch_videos')->insert(['title' => 'Security '.$slug, 'slug' => $slug, 'status' => $status === 'published' ? 'active' : 'inactive', 'published_at' => $date, 'youtube_video_id' => 'abcdefghijk', 'thumbnail_url' => 'https://i.ytimg.com/vi/abcdefghijk/default.jpg', 'video_url' => 'https://www.youtube.com/watch?v=abcdefghijk']);
        }
        DB::table('blog_posts')->insert(['title' => 'Security unapproved', 'slug' => 'unapproved', 'status' => 'published', 'published_at' => now()->subDay(), 'is_public_approved' => false]);
        foreach (['news', 'blog', 'watch'] as $endpoint) {
            $this->getJson('/api/v1/'.$endpoint)->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.slug', 'past');
            $this->getJson('/api/v1/'.$endpoint.'/past')->assertOk();
            foreach (['future', 'missing', 'draft'] as $slug) {
                $this->getJson('/api/v1/'.$endpoint.'/'.$slug)->assertNotFound();
            }
        }
        $this->getJson('/api/v1/blog/unapproved')->assertNotFound();
        $this->getJson('/api/v1/news?featured=1')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/search?q=Security')->assertOk()->assertJsonCount(1, 'data.news')->assertJsonCount(1, 'data.blog');
    }

    public function test_pagination_validation_precedes_queries_and_metadata_is_preserved(): void
    {
        foreach (['blog', 'news', 'categories', 'products', 'services', 'watch'] as $endpoint) {
            foreach (['0', '-1', '51', 'abc', '1.5', '1&per_page[]=2'] as $value) {
                $this->getJson('/api/v1/'.$endpoint.'?per_page='.$value)->assertUnprocessable();
            }
            $this->getJson('/api/v1/'.$endpoint.'?per_page=5')->assertOk()->assertJsonPath('meta.per_page', 5);
            $this->getJson('/api/v1/'.$endpoint.'?page=10001')->assertUnprocessable();
        }
    }

    public function test_named_rate_limits_without_a_request_flood(): void
    {
        foreach (['public-read' => 120, 'public-search' => 30] as $name => $expected) {
            $limit = (RateLimiter::limiter($name))(request());
            $this->assertSame($expected, $limit->maxAttempts);
        }
        // Replace the local limiter with one request, then prove middleware returns 429.
        RateLimiter::for('public-search', fn ($r) => \Illuminate\Cache\RateLimiting\Limit::perMinute(1)->by('security-test'));
        $this->getJson('/api/v1/search?q=Security')->assertOk();
        $this->getJson('/api/v1/search?q=Security')->assertStatus(429)->assertHeader('Retry-After');
    }

    public function test_raster_upload_validation_and_generated_filename(): void
    {
        $field = RasterUpload::field('path', 'general');
        $this->assertSame(RasterUpload::MIME_TYPES, $field->getAcceptedFileTypes());
        $this->assertSame('public', $field->getDiskName());
        Storage::fake('public');
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/jXcAAAAASUVORK5CYII=');
        $file = UploadedFile::fake()->createWithContent('photo.png', $png);
        $path = RasterUpload::store($file, 'general');
        $this->assertMatchesRegularExpression('~^general/[a-f0-9-]{36}\.png$~', $path);
        Storage::disk('public')->assertExists($path);
        foreach ([['photo.png', '<?php echo 1;'], ['photo.svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>'], ['photo.php', $png], ['large.png', $png.str_repeat('x', 5120 * 1024)]] as [$name, $bytes]) {
            try {
                RasterUpload::store(UploadedFile::fake()->createWithContent($name, $bytes), 'general');
                $this->fail('Invalid upload accepted: '.$name);
            } catch (ValidationException) {
                $this->assertTrue(true);
            }
        }
    }

    public function test_explicit_trusted_proxy_scheme_and_ip(): void
    {
        config(['security.trusted_proxies' => ['127.0.0.1']]);
        \Illuminate\Support\Facades\Route::get('/security-test/proxy', fn (\Illuminate\Http\Request $r) => ['secure' => $r->isSecure(), 'ip' => $r->ip(), 'host' => $r->getHost()]);
        $this->withHeaders(['X-Forwarded-For' => '198.51.100.9', 'X-Forwarded-Proto' => 'https', 'X-Forwarded-Host' => 'example.test'])
            ->getJson('http://localhost/security-test/proxy')->assertOk()->assertJsonPath('secure', true)->assertJsonPath('ip', '198.51.100.9')->assertJsonPath('host', 'localhost');
    }

    public function test_hsts_requires_production_https_and_explicit_opt_in(): void
    {
        $middleware = new \App\Http\Middleware\SecurityHeaders;
        $request = \Illuminate\Http\Request::create('https://localhost/');
        $next = fn () => response('ok');
        app()->instance('env', 'production');
        config(['security.hsts_enabled' => false]);
        $this->assertFalse($middleware->handle($request, $next)->headers->has('Strict-Transport-Security'));
        config(['security.hsts_enabled' => true]);
        $this->assertSame('max-age=31536000', $middleware->handle($request, $next)->headers->get('Strict-Transport-Security'));
        $this->assertFalse($middleware->handle(\Illuminate\Http\Request::create('http://localhost/'), $next)->headers->has('Strict-Transport-Security'));
        app()->instance('env', 'testing');
    }

    public function test_security_headers_and_untrusted_forwarded_headers(): void
    {
        $this->withHeaders(['X-Forwarded-For' => '198.51.100.9', 'X-Forwarded-Proto' => 'https']);
        \Illuminate\Support\Facades\Route::get('/security-test/request', fn (\Illuminate\Http\Request $r) => ['secure' => $r->isSecure(), 'ip' => $r->ip()]);
        $this->getJson('/security-test/request')->assertOk()->assertJsonPath('secure', false)->assertJsonPath('ip', '127.0.0.1')
            ->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('X-Frame-Options', 'SAMEORIGIN')->assertHeaderMissing('Strict-Transport-Security');
    }
}
