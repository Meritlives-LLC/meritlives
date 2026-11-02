const { test } = require('node:test');
const assert = require('node:assert/strict');
const api = require('../lib/api.ts');
const queries = require('../lib/queries.ts');
test('News category retrieval includes every API page and bypasses caching', async () => {
  const calls = [];
  api.apiFetch = async (url, options) => {
    calls.push(url);
    assert.equal(options.cache, 'no-store');
    return calls.length === 1
      ? { data: [{ slug: 'first' }], meta: { current_page: 1, last_page: 3 } }
      : { data: [{ slug: calls.length === 2 ? 'second' : 'third' }] };
  };
  const result = await queries.getNewsCategories();
  assert.deepEqual(result.data.map(category => category.slug), ['first', 'second', 'third']);
  assert.deepEqual(calls, ['/categories?type=news&per_page=50', '/categories?type=news&per_page=50&page=2', '/categories?type=news&per_page=50&page=3']);
});
