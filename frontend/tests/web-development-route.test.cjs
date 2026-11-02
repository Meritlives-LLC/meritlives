const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const load = Module._load;
Module._load = function(name, parent, main) {
  if (name === 'next/navigation') return { notFound() { throw Error('NOT_FOUND'); } };
  return load.call(this, name, parent, main);
};
const queries = require('../lib/queries.ts');
const Page = require('../app/services/[slug]/page.tsx').default;
const WebDevelopment = require('../components/WebDevelopmentPage.tsx').default;
test('Web Development opens its existing page when the CMS is unavailable', async () => {
  queries.getService = async slug => { assert.equal(slug, 'web-development'); throw Error('CMS unavailable'); };
  for (const slug of ['web-development', 'Web-Development']) {
    const page = await Page({ params: Promise.resolve({ slug }) });
    assert.equal(page.type, WebDevelopment);
    assert.equal(page.props.service, undefined);
    const html = require('react-dom/server').renderToStaticMarkup(page);
    const document = new (require('jsdom').JSDOM)(html).window.document;
    assert.equal(document.querySelector('h1').textContent, 'We Build Digital Experiences That Move Businesses Forward.');
    assert.ok(document.querySelector('img[src="/web-development-hero.png"]'));
    for (const title of ['Business websites', 'Custom web applications', 'E-commerce', 'Portals & learning platforms', 'CRM & ERP solutions', 'Maintenance & support']) {
      assert.ok([...document.querySelectorAll('h3')].some(heading => heading.textContent === title));
    }
    assert.ok([...document.querySelectorAll('button')].some(button => button.textContent.includes('Start a Project')));
  }
});
test('Web Development retains CMS copy when available', async () => {
  const service = { short_description: 'Existing CMS copy' };
  queries.getService = async () => ({ data: service });
  const page = await Page({ params: Promise.resolve({ slug: 'web-development' }) });
  assert.equal(page.props.service, service);
});
test('unknown service routes still return not found', async () => {
  queries.getService = async () => { throw Error('Missing service'); };
  await assert.rejects(Page({ params: Promise.resolve({ slug: 'missing-service' }) }), /NOT_FOUND/);
});
