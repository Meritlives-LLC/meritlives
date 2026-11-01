// Run against the isolated fixture build only. Never pass a production URL.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('@playwright/test');
require('./forms-register.cjs');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const NewsletterForm = require('../components/NewsletterForm.tsx').default;
const origin = 'http://127.0.0.1:3138';
const apiOrigin = 'http://127.0.0.1:3139';
const subjects = [
  ['web-development', 'Web Development Project Enquiry'], ['fintech', 'Fintech Project Enquiry'],
  ['edtech', 'EdTech Project Enquiry'], ['education', 'Education & Portal Management Project Enquiry'],
  ['business-automation', 'Business Automation Project Enquiry'], ['real-estate', 'Real Estate Technology Project Enquiry'],
];
(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'meritlives-forms-browser-'));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  let checks = 0;
  try {
    for (const width of [320, 390, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
      let mode = 'validation', posts = 0;
      const unexpected = [];
      await context.route('**/*', async route => {
        const request = route.request(); const url = new URL(request.url());
        if (![origin, apiOrigin].includes(url.origin)) { unexpected.push(url.origin); return route.abort(); }
        if (request.method() === 'POST') {
          if (url.origin !== apiOrigin || url.pathname !== '/api/v1/contact') throw new Error('Unexpected POST was blocked: ' + url.pathname);
          posts++;
          return route.fulfill({ status: mode === 'validation' ? 422 : 201, contentType: 'application/json',
            headers: { 'Access-Control-Allow-Origin': origin }, body: JSON.stringify(mode === 'validation'
              ? { message: 'Invalid.', errors: { email: ['Please use a valid email.'] } }
              : { data: { id: 42, status: 'received' }, message: 'Your message has been received.' }) });
        }
        if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'content-type' } });
        return route.continue();
      });
      const page = await context.newPage();
      await page.goto(origin + '/contact');
      const contactHtml = await page.content();
      const stylesheetLinks = [...contactHtml.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"[^>]*>/g)].map(m => `<link rel="stylesheet" href="${m[1]}">`).join('');
      const form = page.getByRole('form', { name: 'Contact us' });
      await form.getByLabel('Name', { exact: true }).fill('Test Person');
      await form.getByLabel('Email', { exact: true }).fill('person@example.test');
      await form.getByLabel('Subject', { exact: true }).fill('Disposable test');
      await form.getByLabel('How can we help?').fill('Only a mocked enquiry.');
      await form.getByRole('button', { name: 'Send Message' }).click();
      await form.getByRole('alert').waitFor();
      assert.equal(await form.getByLabel('Email', { exact: true }).inputValue(), 'person@example.test');
      assert.equal(await form.getByLabel('Email', { exact: true }).getAttribute('aria-invalid'), 'true');
      assert.ok(await form.evaluate(el => el.scrollWidth <= el.clientWidth));
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ fullPage: true, path: path.join(directory, `contact-${width}.png`) });
      mode = 'success';
      await form.getByRole('button', { name: 'Send Message' }).click();
      await form.getByText('Your message has been received.', { exact: true }).waitFor();
      assert.equal(await form.getByLabel('Email', { exact: true }).inputValue(), '');
      assert.equal(posts, 2); checks++;

      // Static newsletter preview reuses the compiled production styles; behavior is covered by DOM tests.
      await page.route(origin + '/__newsletter_preview', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head>${stylesheetLinks}</head><body><div class="ml-public-content"><main style="max-width:900px;margin:auto;padding:24px">${renderToStaticMarkup(React.createElement(NewsletterForm))}</main></div></body></html>` }));
      await page.goto(origin + '/__newsletter_preview');
      const newsletter = page.getByRole('form', { name: 'Newsletter subscription' });
      assert.ok(await newsletter.evaluate(el => el.scrollWidth <= el.clientWidth));
      await newsletter.screenshot({ path: path.join(directory, `newsletter-${width}.png`) }); checks++;

      if (width === 390 || width === 1440) for (const [slug, subject] of subjects) {
        mode = 'validation';
        await page.goto(origin + '/services/' + slug);
        await page.locator('main button').first().click();
        const dialog = page.getByRole('dialog'); await dialog.waitFor();
        const box = await dialog.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
        const name = dialog.getByLabel('Your name', { exact: true });
        const email = dialog.getByLabel('Work email', { exact: true });
        const nameBox = await name.boundingBox(); const emailBox = await email.boundingBox();
        if (width === 390) assert.ok(emailBox.y > nameBox.y);
        else assert.ok(emailBox.x > nameBox.x);
        await name.fill('Test Person'); await email.fill('person@example.test');
        await dialog.getByLabel('A little about the project').fill('Only a mocked enquiry.');
        assert.equal(await dialog.getByLabel('What do you need?').inputValue(), subject);
        await dialog.getByRole('button', { name: 'Send project enquiry' }).click();
        await dialog.getByRole('alert').waitFor();
        assert.equal(await email.inputValue(), 'person@example.test');
        assert.equal(await email.getAttribute('aria-invalid'), 'true');
        assert.ok(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth));
        if (slug === 'fintech') { await dialog.evaluate(el => { el.scrollTop = 0; }); await dialog.screenshot({ path: path.join(directory, `enquiry-${width}.png`) }); }
        mode = 'success';
        await dialog.getByRole('button', { name: 'Send project enquiry' }).click();
        await dialog.getByText('Enquiry received', { exact: true }).waitFor();
        await dialog.getByRole('button', { name: 'Done', exact: true }).click();
        await dialog.waitFor({ state: 'hidden' }); checks++;
      }
      assert.deepEqual(unexpected, [], 'No third-party network access is allowed');
      await context.close();
    }
    console.log(`Passed ${checks} responsive browser scenarios (320, 390, 768, 1440px; all six service modals at mobile/desktop).`);
    console.log('All enquiry POSTs intercepted; no writes reached the fixture API or any database.');
    console.log('Screenshots: ' + directory);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
