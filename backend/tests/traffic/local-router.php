<?php

// Disposable loopback-only test router. Never use as a deployment entrypoint.
$root = getenv('TRAFFIC_TEST_ROOT');
if (PHP_SAPI !== 'cli-server' || ($_SERVER['REMOTE_ADDR'] ?? '') !== '127.0.0.1'
    || ! $root || ! is_file($root.'/DISPOSABLE-TRAFFIC-ONLY')) {
    http_response_code(403); exit;
}
if (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) === '/_local/ready') { echo 'ready'; exit; }
foreach (['storage/framework/views', 'storage/framework/sessions', 'storage/framework/cache/data', 'storage/logs'] as $directory) {
    if (! is_dir($root.'/'.$directory)) mkdir($root.'/'.$directory, 0700, true);
}
require dirname(__DIR__, 2).'/vendor/autoload.php';
foreach (['APP_ENV' => 'testing', 'APP_DEBUG' => 'false', 'APP_KEY' => 'base64:'.base64_encode(str_repeat('c', 32)),
    'DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => ':memory:', 'DB_URL' => '', 'CACHE_STORE' => 'file',
    'SESSION_DRIVER' => 'array', 'QUEUE_CONNECTION' => 'sync', 'MAIL_MAILER' => 'array',
    'APP_CONFIG_CACHE' => $root.'/no-config.php', 'APP_ROUTES_CACHE' => $root.'/no-routes.php'] as $key => $value) {
    putenv($key.'='.$value); $_ENV[$key] = $_SERVER[$key] = $value;
}
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->useStoragePath($root.'/storage');
$app->afterBootstrapping(\Illuminate\Foundation\Bootstrap\LoadConfiguration::class, function ($app) use ($root) {
    $config = $app->make('config');
    if ($app->environment() !== 'testing' || $config->get('database.default') !== 'sqlite'
        || $config->get('database.connections.sqlite.database') !== ':memory:'
        || $config->get('database.connections.sqlite.url')) throw new RuntimeException('Unsafe traffic test database.');
    $config->set('database.connections', ['sqlite' => $config->get('database.connections.sqlite')]);
    foreach (['mysql','mariadb','pgsql','sqlsrv'] as $driver) {
        $app->bind('db.connector.'.$driver, fn () => throw new RuntimeException('Non-test databases blocked.'));
    }
    $config->set('cache.stores.file.path', $root.'/cache');
    $config->set('cache.stores.file.lock_path', $root.'/cache');
    $config->set('security.trusted_proxies', []);
    $config->set('traffic.api_per_minute', 6); // Low-volume verification, not a production threshold.
    $config->set('ai_studio.enabled', false);
    $config->set('ai_editorial.enabled', false);
    $config->set('ai_image.enabled', false);
});
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$request = \Illuminate\Http\Request::capture();
$app->instance('request', $request);
$kernel->bootstrap();
\Illuminate\Support\Facades\Http::preventStrayRequests();
// Advance the clock without waiting a real minute or increasing the request count.
$offset = is_file($root.'/clock-offset.txt') ? (int) file_get_contents($root.'/clock-offset.txt') : 0;
if ($offset) \Illuminate\Support\Carbon::setTestNow(\Illuminate\Support\Carbon::now()->addSeconds($offset));
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
