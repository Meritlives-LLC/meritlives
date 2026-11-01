<?php
// Test-only entry point. Never load through the normal application bootstrap.
if (PHP_SAPI === 'cli-server') {
    $file = realpath(dirname(__DIR__, 2).'/public'.parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
    $public = realpath(dirname(__DIR__, 2).'/public');
    if ($file && str_starts_with($file, $public.DIRECTORY_SEPARATOR) && is_file($file) && pathinfo($file, PATHINFO_EXTENSION) !== 'php') {
        return false;
    }
}
require dirname(__DIR__, 2).'/vendor/autoload.php';
$root = getenv('EDITORIAL_BROWSER_ROOT');
if (! $root || ! is_dir($root) || ! is_file($root.'/DISPOSABLE-EDITORIAL-ONLY')) {
    throw new RuntimeException('An explicitly marked disposable test directory is required.');
}
$root = str_replace('\\', '/', realpath($root));
$database = $root.'/database.sqlite';
foreach (['APP_ENV' => 'testing', 'APP_DEBUG' => 'true', 'APP_URL' => 'http://127.0.0.1:3187',
    'APP_KEY' => 'base64:'.base64_encode(str_repeat('b', 32)), 'DB_CONNECTION' => 'sqlite',
    'DB_DATABASE' => $database, 'DB_URL' => '', 'AI_EDITORIAL_ENABLED' => 'true',
    'AI_EDITORIAL_PROVIDER' => 'mock', 'SESSION_DRIVER' => 'file', 'CACHE_STORE' => 'file',
    'QUEUE_CONNECTION' => 'sync', 'MAIL_MAILER' => 'array'] as $key => $value) {
    putenv($key.'='.$value); $_ENV[$key] = $_SERVER[$key] = $value;
}
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->useStoragePath($root.'/storage');
$app->afterBootstrapping(Illuminate\Foundation\Bootstrap\LoadConfiguration::class, function ($app) use ($database, $root) {
    $config = $app->make('config');
    if ($config->get('database.default') !== 'sqlite' || $config->get('database.connections.sqlite.database') !== $database
        || ! empty($config->get('database.connections.sqlite.url')) || $app->environment() !== 'testing') {
        throw new RuntimeException('Unsafe browser database configuration.');
    }
    $config->set('database.connections', ['sqlite' => $config->get('database.connections.sqlite')]);
    foreach (['mysql', 'mariadb', 'pgsql', 'sqlsrv'] as $driver) {
        $app->bind('db.connector.'.$driver, fn () => throw new RuntimeException('External databases blocked.'));
    }
    $app->bind('db.connector.sqlite', fn () => new class($database) extends Illuminate\Database\Connectors\SQLiteConnector {
        public function __construct(private string $allowed) {}
        public function connect(array $config) {
            if (($config['database'] ?? '') !== $this->allowed || ! empty($config['url'])) {
                throw new RuntimeException('Only the disposable browser database is allowed.');
            }
            return parent::connect($config);
        }
    });
    $config->set('ai_editorial.enabled', true);
    $config->set('ai_editorial.provider', 'mock');
    if (getenv('FEATURE_IMAGE_BROWSER_TEST') === '1') {
        $config->set('ai_image.enabled', true);
        $config->set('ai_image.provider', 'mock');
        $config->set('ai_image.allow_billable', false);
        $scenario = is_file($root.'/image-mock-scenario.txt') ? trim(file_get_contents($root.'/image-mock-scenario.txt')) : 'success';
        $config->set('ai_image.mock_scenario', in_array($scenario, ['success','failure','quota','invalid'], true) ? $scenario : 'success');
        $config->set('ai_image.mock_delay_ms', 500);
    }
    $config->set('ai_studio.enabled', false);
    $config->set('ai_studio.provider', 'none');
    $config->set('ai_studio.api_key', '');
    $config->set('session.driver', 'file');
    $config->set('session.files', $root.'/storage/framework/sessions');
    $config->set('session.cookie', 'editorial_browser_test');
    $config->set('session.domain', null);
    $config->set('session.secure', false);
    $config->set('cache.default', 'file');
    $config->set('cache.stores.file.path', $root.'/storage/framework/cache/data');
    $config->set('view.compiled', $root.'/storage/framework/views');
    $config->set('filesystems.disks.public.root', $root.'/storage/app/public');
    $config->set('filesystems.disks.local.root', $root.'/storage/app/private');
    // Livewire uses this disk name in APP_ENV=testing, including real browser uploads.
    $config->set('filesystems.disks.tmp-for-tests', ['driver' => 'local', 'root' => $root.'/storage/app/private', 'throw' => false]);
});
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
Illuminate\Support\Facades\Http::preventStrayRequests();
if (PHP_SAPI === 'cli' && ($argv[1] ?? '') === 'setup') {
    if (file_exists($database)) { throw new RuntimeException('Refusing to reuse a database.'); }
    touch($database);
    Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => Database\Seeders\RolesAndPermissionsSeeder::class, '--force' => true]);
    $user = App\Models\User::factory()->create(['email' => 'editor@example.test', 'password' => 'Disposable-Editor-Only-483!']);
    $user->assignRole('editor');
    App\Models\News::create(['title' => 'Fictional duplicate-source fixture', 'slug' => 'fictional-duplicate-source-fixture',
        'source_name' => 'Disposable QA fixture', 'source_url' => 'https://example.test/fictional-qa', 'status' => 'pending']);
    echo json_encode(['driver' => Illuminate\Support\Facades\DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME),
        'database' => Illuminate\Support\Facades\DB::select('PRAGMA database_list'),
        'connections' => array_keys(config('database.connections')), 'provider' => config('ai_editorial.provider')], JSON_PRETTY_PRINT);
    exit;
}
if (PHP_SAPI === 'cli' && ($argv[1] ?? '') === 'inspect') {
    echo json_encode(['isolation' => ['driver' => Illuminate\Support\Facades\DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME),
        'database' => Illuminate\Support\Facades\DB::select('PRAGMA database_list'),
        'connections' => array_keys(config('database.connections')), 'provider' => config('ai_editorial.provider'),
        'storage' => storage_path(), 'public_news' => App\Models\News::publiclyEligible()->count(),
        'public_blog' => App\Models\BlogPost::publiclyEligible()->count()],
        'news' => App\Models\News::all()->toArray(), 'blog' => App\Models\BlogPost::all()->toArray()], JSON_PRETTY_PRINT);
    exit;
}
if (PHP_SAPI === 'cli' && ($argv[1] ?? '') === 'users') {
    foreach ([390, 768, 1440] as $width) {
        $user = App\Models\User::factory()->create(['email' => 'editor'.$width.'@example.test', 'password' => 'Disposable-Editor-Only-483!']);
        $user->assignRole('editor');
    }
    echo 'Created three disposable viewport editors.';
    exit;
}
if (PHP_SAPI === 'cli-server') {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $file = realpath(dirname(__DIR__, 2).'/public'.$path);
    $public = realpath(dirname(__DIR__, 2).'/public');
    if ($file && str_starts_with($file, $public.DIRECTORY_SEPARATOR) && is_file($file) && pathinfo($file, PATHINFO_EXTENSION) !== 'php') {
        return false;
    }
    $app->handleRequest(Illuminate\Http\Request::capture());
}
