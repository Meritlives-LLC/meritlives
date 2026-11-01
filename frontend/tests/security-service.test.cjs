const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'FormData', 'MutationObserver']) {
  Object.defineProperty(globalThis, name, { value: name === 'window' ? dom.window : dom.window[name], writable: true, configurable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
process.env.NEXT_PUBLIC_API_URL = 'http://mock-api.invalid/api/v1';
process.env.NEXT_PUBLIC_SECURITY_SHOWCASE_VIDEO_URL = '';
process.env.NEXT_PUBLIC_SECURITY_SHOWCASE_CAPTIONS_URL = '';
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { render, screen, fireEvent, waitFor, cleanup } = require('@testing-library/react');
const Security = require('../components/SecurityServicePage.tsx').default;
const Route = require('../app/services/security/page.tsx');
const List = require('../components/ServicesList.tsx').default;
const { approvedSecurityMediaUrl, securityServiceUrl } = require('../lib/security-service.ts');
afterEach(cleanup);

test('explicit route renders all required sections without fetching a CMS record', () => {
  globalThis.fetch = () => { throw new Error('No API lookup is allowed'); };
  const html = renderToStaticMarkup(React.createElement(Route.default));
  const page = new JSDOM(html).window.document;
  assert.equal(page.querySelectorAll('h1').length, 1);
  for (const title of ['Comprehensive Security for Modern Digital Systems', 'A Structured Approach to Stronger Security', 'Security That Supports Business Growth']) {
    assert.ok([...page.querySelectorAll('h2')].some(h => h.textContent === title));
  }
  assert.equal(page.querySelectorAll('#security-approach ol > li').length, 6);
  assert.equal(page.querySelectorAll('details').length, 6);
  assert.equal(page.querySelectorAll('video').length, 0);
  assert.equal(page.querySelectorAll('iframe').length, 0);
  for (const image of page.querySelectorAll('img')) {
    assert.ok(fs.existsSync('public' + image.getAttribute('src')));
    assert.ok(image.getAttribute('alt').length > 20);
  }
  const structured = JSON.parse(page.querySelector('script[type="application/ld+json"]').textContent);
  assert.equal(structured['@type'], 'Service');
  assert.equal(structured.provider.name, 'MERITLIVES LLC');
  assert.equal(structured.offers, undefined);
});

test('metadata has safe canonical and Open Graph values', () => {
  const saved = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.example.test/base';
    const metadata = Route.generateMetadata();
    assert.equal(metadata.alternates.canonical, 'https://staging.example.test/services/security');
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.ok(metadata.title.includes('Security'));
    for (const origin of ['http://localhost:3000', 'javascript:alert(1)', 'bad-url', 'https://user:password@example.test']) {
      process.env.NEXT_PUBLIC_SITE_URL = origin;
      assert.equal(securityServiceUrl(), 'https://meritlives.com/services/security');
    }
  } finally { if (saved === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = saved; }
});

test('source-managed catalogue card appears with no CMS data and deduplicates published security records', () => {
  const empty = new JSDOM(renderToStaticMarkup(React.createElement(List, { services: [] }))).window.document;
  assert.equal(empty.querySelectorAll('a[href="/services/security"]').length, 1);
  const populated = new JSDOM(renderToStaticMarkup(React.createElement(List, { services: [
    { id: 1, name: 'CMS Security', slug: 'security', status: 'published', short_description: 'Published copy' },
    { id: 2, name: 'Other published service', slug: 'other', status: 'published' },
  ] }))).window.document;
  assert.equal(populated.querySelectorAll('a[href="/services/security"]').length, 1);
  assert.ok(populated.body.textContent.includes('Other published service'));
});

test('catalogue keeps source-managed discovery when its API is unavailable', async () => {
  const queries = require('../lib/queries.ts'); const original = queries.getServices;
  queries.getServices = async () => { throw new Error('Fixture API unavailable'); };
  try {
    const Services = require('../app/services/page.tsx').default;
    const html = renderToStaticMarkup(await Services());
    assert.ok(html.includes('href="/services/security"'));
    assert.ok(html.includes('Additional services are temporarily unavailable'));
  } finally { queries.getServices = original; }
});

test('optional media accepts approved HTTPS/local paths and rejects unsupported inputs', () => {
  for (const value of [undefined, '', 'javascript:alert(1)', 'http://example.test/video.mp4', '//example.test/video.mp4', '/\\example.test/video.mp4', 'https://user:secret@example.test/video.mp4']) {
    assert.equal(approvedSecurityMediaUrl(value), undefined);
  }
  assert.equal(approvedSecurityMediaUrl('/approved/video.mp4'), '/approved/video.mp4');
  assert.equal(approvedSecurityMediaUrl('https://media.example.test/video.mp4'), 'https://media.example.test/video.mp4');
});

test('all security CTAs share the validated contact workflow and service subject', async () => {
  const view = render(React.createElement(Security));
  const ctas = screen.getAllByRole('button').filter(button => /Request a Security Audit|Talk to a Security Specialist/.test(button.textContent));
  assert.equal(ctas.length, 3);
  for (const button of ctas) {
    fireEvent.click(button);
    const form = screen.getByRole('form', { name: 'Project enquiry' });
    assert.equal(form.elements.namedItem('subject').value, 'Security Audit & Hardening');
    for (const [name, value] of Object.entries({ name: 'Test Person', email: 'person@example.test', message: 'Mocked security enquiry.' })) {
      fireEvent.change(form.elements.namedItem(name), { target: { value } });
    }
    let posts = 0;
    globalThis.fetch = async (url, options) => {
      posts++; assert.ok(url.endsWith('/contact')); assert.equal(JSON.parse(options.body).subject, 'Security Audit & Hardening');
      return new Response(JSON.stringify({ errors: { email: ['Please check your email.'] } }), { status: 422 });
    };
    fireEvent.submit(form);
    await waitFor(() => assert.equal(form.elements.namedItem('email').getAttribute('aria-invalid'), 'true'));
    assert.equal(posts, 1); assert.equal(form.elements.namedItem('email').value, 'person@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Close enquiry form' }));
  }
  assert.ok(view.container.querySelector('a[href="#security-approach"]'));
});
