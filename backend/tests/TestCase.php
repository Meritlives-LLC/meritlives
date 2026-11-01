<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        if (getenv('EDITORIAL_MEMORY_ONLY') !== '1') {
            return parent::createApplication();
        }

        $app = require dirname(__DIR__).'/bootstrap/app.php';
        $this->traitsUsedByTest = class_uses_recursive(static::class);
        $app->afterBootstrapping(\Illuminate\Foundation\Bootstrap\LoadConfiguration::class, function ($app): void {
            $config = $app->make('config');
            if ($app->environment() !== 'testing'
                || $config->get('database.default') !== 'sqlite'
                || $config->get('database.connections.sqlite.database') !== ':memory:'
                || ! empty($config->get('database.connections.sqlite.url'))) {
                throw new \RuntimeException('Acceptance testing requires testing / sqlite / :memory: / no DB_URL.');
            }
            $sqlite = $config->get('database.connections.sqlite');
            $config->set('database.connections', ['sqlite' => $sqlite]);
            foreach (['mysql', 'mariadb', 'pgsql', 'sqlsrv'] as $driver) {
                $app->bind('db.connector.'.$driver, fn () => throw new \RuntimeException('Non-SQLite connections are blocked during acceptance testing.'));
            }
            $app->bind('db.connector.sqlite', fn () => new class extends \Illuminate\Database\Connectors\SQLiteConnector {
                public function connect(array $config)
                {
                    if (($config['database'] ?? null) !== ':memory:' || ! empty($config['url'])) {
                        throw new \RuntimeException('Persistent SQLite connections are blocked during acceptance testing.');
                    }
                    return parent::connect($config);
                }
            });
        });
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
        \Illuminate\Support\Facades\Http::preventStrayRequests();

        return $app;
    }
}
