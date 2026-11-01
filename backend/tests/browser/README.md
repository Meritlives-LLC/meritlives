# Isolated editorial browser acceptance

This harness uses a new disposable SQLite file, never the normal application database. It removes other database connections, guards the SQLite path, forces the mock editorial provider, blocks stray Laravel HTTP requests, and stores sessions/cache/views/uploads/logs in the marked temporary directory. It retains normal login, CSRF, resource permissions and approval rules.

From `backend`, create a fresh run directory in PowerShell:

```powershell
$runRoot = Join-Path $env:TEMP ('meritlives-editorial-browser-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $runRoot | Out-Null
New-Item -ItemType File -Path (Join-Path $runRoot 'DISPOSABLE-EDITORIAL-ONLY') | Out-Null
foreach ($part in @('storage/framework/sessions','storage/framework/cache/data','storage/framework/views','storage/logs','storage/app/public','storage/app/private')) {
    New-Item -ItemType Directory -Path (Join-Path $runRoot $part) -Force | Out-Null
}
$env:EDITORIAL_BROWSER_ROOT = $runRoot
Set-Content tests/browser/run-root.txt $runRoot
php -d extension=pdo_sqlite -d extension=sqlite3 tests/browser/editorial-app.php setup
php -d extension=pdo_sqlite -d extension=sqlite3 tests/browser/editorial-app.php users
php -d extension=pdo_sqlite -d extension=sqlite3 -d max_execution_time=180 -S 127.0.0.1:3187 -t public tests/browser/editorial-app.php
```

Setup refuses to reuse an existing database. Inspect its printed SQLite path and single configured connection before starting browser tests. The credentials in the scripts are disposable factory credentials, valid only in this isolated fixture database.

In a second terminal, from `frontend`:

```powershell
node tests/editorial-browser.cjs
# Optional focused keyboard checks, without generating or saving records:
node tests/editorial-browser.cjs --focus
```

Evidence is written to `backend/tests/browser/evidence`. The script exits nonzero on failed checks. Browser requests outside `http://127.0.0.1:3187` are blocked. Fonts and external avatars therefore use fallback/missing-image rendering. Full-page images include content below the viewport behind fixed modal overlays; they are not stitched modal scroll captures.

Stop the PHP server with Ctrl+C. To inspect the disposable records afterward, use the same `EDITORIAL_BROWSER_ROOT` and run:

```powershell
php -d extension=pdo_sqlite -d extension=sqlite3 tests/browser/editorial-app.php inspect
```

Do not use the normal `artisan serve` or remove the harness guards. No existing `.env` file needs editing. Retain or discard only the marked run directory; never clean unrelated storage.
