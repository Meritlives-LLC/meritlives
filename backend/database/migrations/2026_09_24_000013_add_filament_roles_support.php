<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Filament authentication is intentionally based on the application's
        // existing users table. Role/permission package installation and its
        // migrations are completed by the setup commands in PHASE4.md.
    }

    public function down(): void
    {
        //
    }
};
