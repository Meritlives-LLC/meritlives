const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { createRequestGate, editorialSearchGate, serverFetchGate } = require('../lib/request-gate.ts');
const { NextRequest } = require('next/server');
const queries = require('../lib/queries.ts');
const { ApiError, apiFetch } = require('../lib/api.ts');
const { GET } = require('../app/api/editorial-search/route.ts');
afterEach(() => mock.restoreAll());

test('bounded gate releases capacity once and rate budget resets after retry', () => {
  let now = 0;
  const gate = createRequestGate(1, 2, () => now);
  const first = gate.enter();
  assert.deepEqual(gate.enter(), { retryAfter: 1 });
  first.release(); first.release();
  const second = gate.enter(); second.release();
  assert.deepEqual(gate.enter(), { retryAfter: 60 });
  now = 61000;
  const retry = gate.enter(); assert.equal(typeof retry.release, 'function'); retry.release();
});

test('spoofed headers cannot bypass the process search circuit breaker; blocked work never fetches', async () => {
  mock.method(editorialSearchGate, 'enter', () => ({ retryAfter: 17 }));
  const upstream = mock.method(queries, 'searchEditorialContent', async () => assert.fail('Must not fetch'));
  const response = await GET(new NextRequest('https://example.test/api/editorial-search?q=business', {
    headers: { 'X-Forwarded-For': '198.51.100.42', 'CF-Connecting-IP': '198.51.100.43' },
  }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '17');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(upstream.mock.callCount(), 0);
});

test('search propagates bounded upstream retry metadata', async () => {
  mock.method(queries, 'searchEditorialContent', async () => { throw new ApiError('private', 429, {}, 24); });
  const response = await GET(new NextRequest('https://example.test/api/editorial-search?q=business'));
  assert.equal(response.status, 429); assert.equal(response.headers.get('Retry-After'), '24');
  assert.ok(!(await response.text()).includes('private'));
});

test('server-side API concurrency fails fast without issuing a fetch', async () => {
  process.env.NEXT_PUBLIC_API_URL = 'http://mock-api.invalid/api/v1';
  // Reload only the API module so its public URL is set before module evaluation.
  delete require.cache[require.resolve('../lib/api.ts')];
  const { apiFetch: call } = require('../lib/api.ts');
  mock.method(serverFetchGate, 'enter', () => ({ retryAfter: 1 }));
  const fetch = mock.method(globalThis, 'fetch', async () => assert.fail('Must not fetch'));
  await assert.rejects(call('/health'), error => error.status === 503 && error.retryAfter === 1);
  assert.equal(fetch.mock.callCount(), 0);
});

test('oversized API JSON is bounded even when Content-Length lies; capacity is released', async () => {
  process.env.NEXT_PUBLIC_API_URL = 'http://mock-api.invalid/api/v1';
  delete require.cache[require.resolve('../lib/api.ts')];
  const { apiFetch: call } = require('../lib/api.ts');
  let cancelled = false;
  mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(2 * 1024 * 1024 + 1)); },
    cancel() { cancelled = true; },
  }), { headers: { 'Content-Length': '1' } }));
  await assert.rejects(call('/health'), error => error.status === 502 && error.message.includes('size limit'));
  assert.equal(cancelled, true);
  mock.restoreAll();
  mock.method(globalThis, 'fetch', async () => new Response('{"data":"ok"}'));
  assert.deepEqual(await call('/health'), { data: 'ok' });
});

test('image optimization accepts only the quality used by the application', async () => {
  const { default: config } = await import('../next.config.mjs');
  assert.deepEqual(config.images.qualities, [75]);
});
