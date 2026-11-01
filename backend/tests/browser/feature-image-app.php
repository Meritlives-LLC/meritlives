<?php
// A test-only extension of the verified, marked disposable SQLite harness.
putenv('FEATURE_IMAGE_BROWSER_TEST=1');
$result = require __DIR__.'/about-app.php';
if ($result === false) return false;
if (PHP_SAPI === 'cli' && ($argv[1] ?? '') === 'image-fixtures') {
    if (config('database.default') !== 'sqlite' || array_keys(config('database.connections')) !== ['sqlite']) throw new RuntimeException('SQLite isolation required.');
    Illuminate\Support\Facades\Artisan::call('migrate', ['--path' => 'database/migrations/2026_10_31_000001_add_ai_metadata_to_media.php', '--force' => true]);
    foreach ([390,768,1440] as $width) foreach (['image','image-errors'] as $prefix) {
        $suffix = getenv('IMAGE_TEST_RUN') ?: '';
        $email = $prefix.$width.($suffix ? '-'.$suffix : '').'@example.test';
        $user = App\Models\User::where('email', $email)->first() ?? App\Models\User::factory()->create(['email' => $email, 'name' => 'Disposable Image QA', 'password' => Illuminate\Support\Facades\Hash::make('Disposable-Image-Only-483!')]);
        $user->assignRole('editor');
    }
    file_put_contents($root.'/image-user-suffix.txt', getenv('IMAGE_TEST_RUN') ?: '');
    echo json_encode(['driver' => Illuminate\Support\Facades\DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME), 'database' => Illuminate\Support\Facades\DB::select('PRAGMA database_list'),
        'connections' => array_keys(config('database.connections')), 'image_provider' => config('ai_image.provider'), 'billable' => config('ai_image.allow_billable')], JSON_PRETTY_PRINT);
}
if (PHP_SAPI === 'cli' && ($argv[1] ?? '') === 'image-inspect') {
    echo json_encode(['driver' => Illuminate\Support\Facades\DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME),
        'database' => Illuminate\Support\Facades\DB::select('PRAGMA database_list'), 'connections' => array_keys(config('database.connections')),
        'image_provider' => config('ai_image.provider'), 'writing_provider' => config('ai_editorial.provider'), 'billable' => config('ai_image.allow_billable'),
        'public_news' => App\Models\News::publiclyEligible()->count(), 'public_blog' => App\Models\BlogPost::publiclyEligible()->count(),
        'jobs' => App\Models\AiGenerationJob::where('type', 'feature_image')->get(['id','requested_by','status','preview_path','approved_image_path','result_metadata']),
        'media' => App\Models\Media::whereNotNull('metadata')->get(),
        'news' => App\Models\News::where('slug', 'like', 'image-browser-%')->get(), 'blog' => App\Models\BlogPost::where('slug', 'like', 'image-browser-%')->get()], JSON_PRETTY_PRINT);
}
