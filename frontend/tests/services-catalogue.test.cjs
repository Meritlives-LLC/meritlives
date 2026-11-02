const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'FormData', 'MutationObserver']) Object.defineProperty(globalThis, name, { value: name === 'window' ? dom.window : dom.window[name], writable: true, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { render, screen, fireEvent, waitFor, cleanup } = require('@testing-library/react');
const { featuredServices, otherServices, additionalPublishedServices } = require('../lib/service-catalogue.ts');
const List = require('../components/ServicesList.tsx').default;
const Additional = require('../components/AdditionalServices.tsx').default;
const queries = require('../lib/queries.ts');
const original = queries.getServices;
afterEach(() => { cleanup(); queries.getServices = original; });
const service = (slug, status = 'published') => ({ id: 1, slug, status, name: slug, short_description: 'Approved fixture copy' });

test('seven curated links survive absent CMS records and use existing distinct featured photos', () => {
  const document = new JSDOM(renderToStaticMarkup(React.createElement(List, { services: [] }))).window.document;
  assert.equal(featuredServices.length, 4); assert.equal(otherServices.length, 3);
  assert.equal(new Set(featuredServices.map(s => s.image)).size, 4);
  for (const item of [...featuredServices, ...otherServices]) {
    assert.equal(document.querySelectorAll(`a[href="${item.href}"]`).length, 1);
    assert.ok(fs.existsSync('public' + item.image)); assert.ok(item.imageAlt.length > 30);
  }
  for (const item of featuredServices) assert.equal(document.querySelectorAll(`[data-service="${item.slug}"] li`).length, 3);
});

test('CMS filtering excludes drafts and curated or repeated slugs across pages and case variants', () => {
  const first = additionalPublishedServices([service('security'), service('ongoing-maintenance'), service('EdTech'), service('draft', 'draft'), service(''), service('extra'), service('EXTRA')]);
  assert.deepEqual(first.map(s => s.slug), ['extra']);
  assert.deepEqual(additionalPublishedServices([service('extra'), service('another')], first).map(s => s.slug), ['extra', 'another']);
});

test('API failure retains all seven core links and the established contact destination', async () => {
  queries.getServices = async query => { assert.equal(query, '?per_page=50&page=1'); throw Error('Fixture outage'); };
  const Page = require('../app/services/page.tsx').default;
  const document = new JSDOM(renderToStaticMarkup(await Page())).window.document;
  assert.equal(document.querySelectorAll('[data-service]').length, 7);
  assert.ok(document.querySelector('a[href="/contact"]'));
  assert.ok(document.body.textContent.includes('Additional services are temporarily unavailable'));
});

test('pagination guards duplicate requests, retains entries on failure and retries the bounded page', async () => {
  let resolve; const calls = [];
  queries.getServices = query => { calls.push(query); return new Promise(r => { resolve = r; }); };
  render(React.createElement(Additional, { services: [service('first')], pagination: { current_page: 1, last_page: 2 } }));
  const button = screen.getByRole('button', { name: 'Load more services' });
  fireEvent.click(button); fireEvent.click(button); assert.equal(calls.length, 1); assert.ok(button.disabled);
  resolve({ data: [service('first'), service('new'), service('security'), service('hidden', 'draft')], meta: { current_page: 2, last_page: 3 } });
  await screen.findByRole('heading', { name: 'new' });
  assert.equal(screen.queryByRole('heading', { name: 'hidden' }), null);
  queries.getServices = async query => { calls.push(query); throw Error('Fixture failure'); };
  fireEvent.click(screen.getByRole('button', { name: 'Load more services' }));
  await screen.findByRole('button', { name: 'Try again' });
  assert.ok(screen.getByRole('heading', { name: 'first' })); assert.ok(screen.getByRole('heading', { name: 'new' }));
  queries.getServices = async query => { calls.push(query); return { data: [service('last')], meta: { current_page: 3, last_page: 3 } }; };
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByRole('heading', { name: 'last' });
  assert.deepEqual(calls, ['?per_page=50&page=2', '?per_page=50&page=3', '?per_page=50&page=3']);
  assert.equal(screen.queryByRole('button'), null);
});
