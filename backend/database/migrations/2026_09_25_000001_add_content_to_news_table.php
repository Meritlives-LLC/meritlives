<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Added when importing WordPress content: the original news table only
// stored `excerpt` (it was designed for short curated blurbs pointing at an
// external source_url). Importing full WordPress articles needs somewhere
// to put the full body, so this adds a `content` column without touching
// the existing columns or data.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('news', function (Blueprint $table) {
            $table->longText('content')->nullable()->after('excerpt');
        });
    }

    public function down(): void
    {
        Schema::table('news', function (Blueprint $table) {
            $table->dropColumn('content');
        });
    }
};
