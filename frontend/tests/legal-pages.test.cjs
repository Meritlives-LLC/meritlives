const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { legalMetadata } = require('../lib/legal-metadata.ts');
for (const [path, title] of [['privacy', 'Privacy Policy'], ['terms', 'Terms of Service'], ['cookies', 'Cookie Policy']]) {
  test(`${path}: substantive review draft, accessible contents, canonical and no ads or embedded tracking`, () => {
    const route = require(`../app/${path}/page.tsx`);
    const document = new JSDOM(renderToStaticMarkup(React.createElement(route.default))).window.document;
    assert.equal(document.querySelectorAll('main').length, 1);
    assert.equal(document.querySelectorAll('h1').length, 1);
    assert.equal(document.querySelector('h1').textContent, title);
    assert.ok(document.querySelector('[aria-label="Policy review status"]').textContent.includes('No effective date has been assigned'));
    const links = [...document.querySelectorAll('nav[aria-labelledby="legal-contents-title"] a')];
    assert.ok(links.length >= 9);
    const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const link of links) {
      const target = document.querySelector(link.getAttribute('href'));
      assert.ok(target); assert.ok(target.querySelector('h2'));
      assert.equal(target.getAttribute('tabindex'), '-1');
    }
    assert.ok(document.body.textContent.includes('REVIEW REQUIRED'));
    assert.ok(document.body.textContent.length > 5000);
    assert.ok(document.querySelector('a[href="/contact"]'));
    assert.equal(document.querySelectorAll('script, iframe, video, form, ins, img').length, 0);
    assert.equal(route.metadata.title, title);
    assert.equal(new URL(route.metadata.alternates.canonical).pathname, '/' + path);
    assert.equal(route.metadata.openGraph.url, route.metadata.alternates.canonical);
    assert.equal(route.metadata.robots.index, false);
  });
}
test('legal canonical uses a safe HTTPS origin and discards credentials or invalid configuration', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    for (const value of ['http://localhost:3000', 'bad-url', 'javascript:alert(1)', 'https://user:secret@example.test']) {
      process.env.NEXT_PUBLIC_SITE_URL = value;
      assert.equal(legalMetadata('/privacy', 'Privacy', 'Description').alternates.canonical, 'https://meritlives.com/privacy');
    }
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.example.test/base';
    assert.equal(legalMetadata('/cookies', 'Cookies', 'Description').alternates.canonical, 'https://staging.example.test/cookies');
  } finally { if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = previous; }
});
