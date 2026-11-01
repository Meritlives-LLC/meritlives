<?php

namespace Tests\Feature;

use App\Console\Commands\ImportNewsImagesFromBackup;
use App\Console\Commands\ImportWordPressNews;
use App\Console\Commands\RehostBlogImages;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use ReflectionMethod;
use Tests\TestCase;

class RemoteImageCommandSecurityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'wordpress_import.site_url' => 'https://meritlives.com',
            'wordpress_import.image_allowed_hosts' => ['meritlives.com'],
        ]);
    }

    public function test_wordpress_importer_rejects_unapproved_hosts_and_does_not_follow_redirects(): void
    {
        Http::fake();

        $command = new ImportWordPressNews;
        self::assertNull($this->invoke($command, 'downloadImage', 'http://127.0.0.1/admin'));
        self::assertNull($this->invoke($command, 'downloadImage', 'https://meritlives.com@127.0.0.1/image.png'));
        Http::assertNothingSent();

        Http::fake(fn (Request $request) => Http::response('', 302, ['Location' => 'http://127.0.0.1/admin']));
        self::assertNull($this->invoke($command, 'downloadImage', 'https://meritlives.com/uploads/image.png'));
        Http::assertSentCount(1);
    }

    public function test_wordpress_importer_validates_image_content_and_uses_mime_extension(): void
    {
        Storage::fake('public');
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/c8sAAAAASUVORK5CYII=', true);
        self::assertIsString($png);
        Http::fake(fn (Request $request) => Http::response($png, 200, ['Content-Type' => 'image/png']));

        $command = new ImportWordPressNews;
        $url = $this->invoke($command, 'downloadImage', 'https://meritlives.com/uploads/avatar.php');

        self::assertIsString($url);
        self::assertStringEndsWith('.png', $url);
        self::assertCount(1, Storage::disk('public')->allFiles('news-images'));
    }

    public function test_wordpress_importer_follows_only_allowlisted_redirects(): void
    {
        Storage::fake('public');
        config(['wordpress_import.image_allowed_hosts' => ['meritlives.com', 'www.meritlives.com']]);
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/c8sAAAAASUVORK5CYII=', true);
        self::assertIsString($png);
        Http::fake(function (Request $request) use ($png) {
            if (parse_url($request->url(), PHP_URL_HOST) === 'meritlives.com') {
                return Http::response('', 302, ['Location' => 'https://www.meritlives.com/cdn/image.png']);
            }

            return Http::response($png, 200, ['Content-Type' => 'application/octet-stream']);
        });

        $url = $this->invoke(new ImportWordPressNews, 'downloadImage', 'https://meritlives.com/uploads/image.png');

        self::assertIsString($url);
        self::assertStringEndsWith('.png', $url);
        Http::assertSentCount(2);
    }

    public function test_wordpress_importer_rejects_oversized_responses_before_reading_the_body(): void
    {
        Http::fake(fn (Request $request) => Http::response('', 200, [
            'Content-Type' => 'image/png',
            'Content-Length' => (string) (10 * 1024 * 1024 + 1),
        ]));

        $command = new ImportWordPressNews;
        self::assertNull($this->invoke($command, 'downloadImage', 'https://meritlives.com/uploads/large.png'));
        Http::assertSentCount(1);
    }

    public function test_blog_rehosting_allows_only_the_exact_approved_https_hosts(): void
    {
        $command = new RehostBlogImages;

        self::assertTrue($this->invoke($command, 'isAllowedImageUrl', 'https://meritlives.com/storage/blogs/image.png'));
        self::assertFalse($this->invoke($command, 'isAllowedImageUrl', 'http://meritlives.com/image.png'));
        self::assertFalse($this->invoke($command, 'isAllowedImageUrl', 'https://meritlives.com.attacker.example/image.png'));
        self::assertFalse($this->invoke($command, 'isAllowedImageUrl', 'https://user@meritlives.com/image.png'));
        self::assertFalse($this->invoke($command, 'isAllowedImageUrl', 'https://meritlives.com:444/image.png'));
    }

    public function test_wordpress_importer_rejects_local_hosts_even_if_they_are_misconfigured_as_allowed(): void
    {
        config(['wordpress_import.image_allowed_hosts' => ['127.0.0.1', 'localhost', 'images.local']]);

        $command = new ImportWordPressNews;

        self::assertFalse($this->invoke($command, 'isAllowedImageUrl', 'https://127.0.0.1/admin'));
        self::assertFalse($this->invoke($command, 'isAllowedImageUrl', 'https://localhost/admin'));
        self::assertFalse($this->invoke($command, 'isAllowedImageUrl', 'https://images.local/photo.png'));
    }

    public function test_backup_import_rejects_traversal_and_replaces_untrusted_extensions(): void
    {
        $command = new ImportNewsImagesFromBackup;

        self::assertNull($this->invoke($command, 'relativeUploadPath', 'https://meritlives.com/wp-content/uploads/%2e%2e/private.php'));
        self::assertSame('2026/photo.png', $this->invoke($command, 'withImageExtension', '2026/photo.php', 'png'));
    }

    private function invoke(object $target, string $method, mixed ...$arguments): mixed
    {
        return (new ReflectionMethod($target, $method))->invoke($target, ...$arguments);
    }
}
