// Fixed ten-request loopback-only functional check. Never accepts a remote target URL.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { performance } = require('node:perf_hooks');
const port = Number(process.argv[2]);
const root = process.env.TRAFFIC_TEST_ROOT;
assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535);
assert.ok(root && fs.existsSync(root + '/DISPOSABLE-TRAFFIC-ONLY'));
const origin = `http://127.0.0.1:${port}`;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try { if ((await fetch(origin + '/_local/ready', { signal: AbortSignal.timeout(500) })).ok) { ready = true; break; } } catch {}
    await wait(100);
  }
  assert.ok(ready, 'Disposable PHP server did not start');
  const results = [];
  for (let i = 0; i < 10; i++) {
    if (i === 9) fs.writeFileSync(root + '/clock-offset.txt', '61');
    const started = performance.now();
    const response = await fetch(origin + '/api/v1/health', {
      headers: i === 7 ? { 'X-Forwarded-For': '198.51.100.7', 'CF-Connecting-IP': '198.51.100.8' } : {},
      signal: AbortSignal.timeout(5000),
    });
    const body = await response.text();
    assert.match(response.headers.get('content-type') || '', /application\/json/);
    results.push({ status: response.status, retryAfter: response.headers.get('retry-after'), ms: Math.round(performance.now() - started) });
    if (i >= 6 && i <= 8) { assert.equal(response.status, 429); assert.ok(Number(response.headers.get('retry-after')) > 0); }
    else { assert.equal(response.status, 200); assert.equal(JSON.parse(body).data.status, 'ok'); }
    await wait(250);
  }
  const report = { isolation: 'loopback; disposable file cache; SQLite :memory: only; AI disabled; no migrations',
    requests: results.length, concurrency: 1, statuses: results.map(item => item.status),
    clockAdvancedSeconds: 61, results };
  fs.writeFileSync(root + '/results.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
})().catch(error => { console.error(error); process.exitCode = 1; });
