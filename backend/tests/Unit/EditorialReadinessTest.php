<?php

namespace Tests\Unit;

use App\Models\News;
use App\Services\EditorialReadiness;
use Tests\TestCase;

class EditorialReadinessTest extends TestCase
{
    public function test_article_without_source_or_category_is_not_ready(): void
    {
        $news = new News([
            'title' => 'A sufficiently long editorial headline',
            'content' => str_repeat('This is a substantive test article sentence. ', 80),
            'source_url' => '',
            'category_id' => null,
        ]);

        $result = (new EditorialReadiness())->inspectArticle($news);

        $this->assertFalse($result['ready']);
        $this->assertFalse($result['checks']['source_url']['passed']);
        $this->assertFalse($result['checks']['category']['passed']);
    }

    public function test_article_with_required_fields_and_content_passes_readiness(): void
    {
        $news = new News([
            'title' => 'A sufficiently long editorial headline',
            'content' => str_repeat('This is a substantive test article sentence. ', 80),
            'source_url' => 'https://example.com/article',
            'category_id' => 1,
        ]);

        $result = (new EditorialReadiness())->inspectArticle($news);

        $this->assertTrue($result['ready']);
        $this->assertGreaterThanOrEqual(300, $result['word_count']);
    }

    public function test_non_http_source_url_is_rejected(): void
    {
        $news = new News([
            'title' => 'A sufficiently long editorial headline',
            'content' => str_repeat('This is a substantive test article sentence. ', 80),
            'source_url' => 'javascript:alert(1)',
            'category_id' => 1,
        ]);

        $result = (new EditorialReadiness())->inspectArticle($news);

        $this->assertFalse($result['ready']);
        $this->assertFalse($result['checks']['source_url']['passed']);
    }
}
