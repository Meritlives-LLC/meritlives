const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest } = require('next/server');
const queries = require('../lib/queries.ts');
const { ApiError } = require('../lib/api.ts');
const { GET } = require('../app/api/editorial-search/route.ts');

afterEach(() => mock.restoreAll());

test('search preserves upstream rate limiting without disclosing its error body', async () => {
  mock.method(queries, 'searchEditorialContent', async () => { throw new ApiError('PRIVATE-UPSTREAM-DETAIL', 429); });
  const response = await GET(new NextRequest('https://example.test/api/editorial-search?q=technology'));
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { message: 'Too many search requests. Try again shortly.' });
});

test('search keeps unexpected upstream failures generic', async () => {
  mock.method(queries, 'searchEditorialContent', async () => { throw new Error('PRIVATE-UPSTREAM-DETAIL'); });
  const response = await GET(new NextRequest('https://example.test/api/editorial-search?q=technology'));
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { message: 'Search is temporarily unavailable.' });
});

test('invalid search bounds never call the upstream API', async () => {
  const fetch = mock.method(queries, 'searchEditorialContent', async () => { throw new Error('Must not call'); });
  for (const query of ['', 'x', 'x'.repeat(101)]) {
    const response = await GET(new NextRequest(`https://example.test/api/editorial-search?q=${query}`));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { news: [], blog: [] } });
  }
  assert.equal(fetch.mock.callCount(), 0);
});
