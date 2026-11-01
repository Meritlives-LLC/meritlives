<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EditorialIsolationTest extends TestCase
{
    public function test_acceptance_process_is_memory_only_and_mysql_is_unavailable(): void
    {
        if (getenv('EDITORIAL_MEMORY_ONLY') !== '1') {
            $this->markTestSkipped('Run with EDITORIAL_MEMORY_ONLY=1 to exercise the acceptance database guard.');
        }
        $this->assertSame('1', getenv('EDITORIAL_MEMORY_ONLY'));
        $this->assertSame('testing', app()->environment());
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
        $this->assertEmpty(config('database.connections.sqlite.url'));
        $this->assertSame(['sqlite'], array_keys(config('database.connections')));
        $this->assertSame('sqlite', DB::connection()->getPdo()->getAttribute(\PDO::ATTR_DRIVER_NAME));
        $this->assertSame('', DB::select('PRAGMA database_list')[0]->file);
        foreach (['mysql', 'wordpress', 'mariadb', 'pgsql', 'sqlsrv'] as $name) {
            try {
                DB::connection($name);
                $this->fail('A non-memory connection was available.');
            } catch (\InvalidArgumentException $e) {
                $this->assertStringContainsString('not configured', $e->getMessage());
            }
        }
        $connector = app('db.connector.sqlite');
        $this->expectExceptionMessage('Persistent SQLite connections are blocked');
        $connector->connect(['database' => '/never-open-this.sqlite']);
    }
}
