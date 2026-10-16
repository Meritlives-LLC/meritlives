<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('news', 'created_by')) {
            Schema::table('news', function (Blueprint $table): void {
                $table->foreignId('created_by')->nullable()->after('author_name')
                    ->constrained('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('news', 'created_by')) {
            Schema::table('news', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('created_by');
            });
        }
    }
};
