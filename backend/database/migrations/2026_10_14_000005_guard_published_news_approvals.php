<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::unprepared("CREATE TRIGGER IF NOT EXISTS news_published_approval_insert
                BEFORE INSERT ON news
                FOR EACH ROW
                WHEN NEW.status = 'published'
                    AND (COALESCE(NEW.editorial_status, 'draft') <> 'approved'
                        OR COALESCE(NEW.image_review_status, 'pending') <> 'approved'
                        OR NEW.article_reviewed_at IS NULL
                        OR NEW.image_reviewed_at IS NULL)
                BEGIN
                    SELECT RAISE(ABORT, 'Publishing requires approved article and image reviews.');
                END");

            DB::unprepared("CREATE TRIGGER IF NOT EXISTS news_published_approval_update
                BEFORE UPDATE ON news
                FOR EACH ROW
                WHEN NEW.status = 'published'
                    AND (COALESCE(NEW.editorial_status, 'draft') <> 'approved'
                        OR COALESCE(NEW.image_review_status, 'pending') <> 'approved'
                        OR NEW.article_reviewed_at IS NULL
                        OR NEW.image_reviewed_at IS NULL)
                BEGIN
                    SELECT RAISE(ABORT, 'Publishing requires approved article and image reviews.');
                END");

            return;
        }

        if ($driver === 'mysql') {
            DB::unprepared("CREATE TRIGGER news_published_approval_insert
                BEFORE INSERT ON news FOR EACH ROW
                BEGIN
                    IF NEW.status = 'published'
                        AND (COALESCE(NEW.editorial_status, 'draft') <> 'approved'
                            OR COALESCE(NEW.image_review_status, 'pending') <> 'approved'
                            OR NEW.article_reviewed_at IS NULL
                            OR NEW.image_reviewed_at IS NULL)
                    THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Publishing requires approved article and image reviews.';
                    END IF;
                END");

            DB::unprepared("CREATE TRIGGER news_published_approval_update
                BEFORE UPDATE ON news FOR EACH ROW
                BEGIN
                    IF NEW.status = 'published'
                        AND (COALESCE(NEW.editorial_status, 'draft') <> 'approved'
                            OR COALESCE(NEW.image_review_status, 'pending') <> 'approved'
                            OR NEW.article_reviewed_at IS NULL
                            OR NEW.image_reviewed_at IS NULL)
                    THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Publishing requires approved article and image reviews.';
                    END IF;
                END");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();
        if (in_array($driver, ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS news_published_approval_insert');
            DB::unprepared('DROP TRIGGER IF EXISTS news_published_approval_update');
        }
    }
};
