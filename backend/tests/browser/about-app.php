<?php
// Reuse the existing verified disposable browser bootstrap, never normal artisan serve.
$root = getenv('EDITORIAL_BROWSER_ROOT');
if (! $root || ! is_file($root.'/DISPOSABLE-EDITORIAL-ONLY')) throw new RuntimeException('Disposable storage required.');
putenv('FRONTEND_URL=http://127.0.0.1:3188');
$_ENV['FRONTEND_URL'] = $_SERVER['FRONTEND_URL'] = 'http://127.0.0.1:3188';
if (PHP_SAPI === 'cli-server' && str_starts_with(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/storage/')) {
    $base = realpath($root.'/storage/app/public');
    $file = realpath($base.'/'.substr(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), 9));
    if (! $file || ! str_starts_with($file, $base.DIRECTORY_SEPARATOR) || ! is_file($file)) { http_response_code(404); exit; }
    header('Content-Type: '.mime_content_type($file)); header('X-Content-Type-Options: nosniff'); readfile($file); exit;
}
$result = require __DIR__.'/editorial-app.php';
if ($result === false) return false;
if (PHP_SAPI === 'cli' && ($argv[1] ?? '') === 'about-fixtures') {
    $user = App\Models\User::firstOrCreate(['email' => 'about-admin@example.test'], ['name' => 'Disposable About Admin', 'password' => Illuminate\Support\Facades\Hash::make('Disposable-About-Only-483!')]);
    $user->assignRole('admin');
    foreach (config('about.services') as $slug => $name) App\Models\Service::firstOrCreate(['slug' => $slug], ['name' => $name, 'status' => 'published', 'sort_order' => 1]);
    echo 'Disposable About admin and existing-service route fixtures ready. SQLite only.';
}
if (PHP_SAPI === 'cli' && ($argv[1] ?? '') === 'about-inspect') {
    echo json_encode(['driver' => Illuminate\Support\Facades\DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME),
        'database' => Illuminate\Support\Facades\DB::select('PRAGMA database_list'),
        'connections' => array_keys(config('database.connections')), 'storage' => storage_path(),
        'draft_headline' => app(App\Services\AboutPageContent::class)->draft()['hero_title'],
        'published_headline' => app(App\Services\AboutPageContent::class)->read()['hero_title'],
        'published_hero_image' => app(App\Services\AboutPageContent::class)->publicContent()['hero_image']], JSON_PRETTY_PRINT);
}
