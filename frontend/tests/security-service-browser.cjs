const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const origin = process.env.SECURITY_PAGE_TEST_ORIGIN || 'http://127.0.0.1:3138';
assert.ok(['http://127.0.0.1:3138', 'http://localhost:3000'].includes(origin), 'Only the isolated fixture server or requested local development URL may be tested');
const api = 'http://127.0.0.1:3139';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'meritlives-security-page-'));
  let scenarios = 0;
  try {
    for (const width of [320, 390, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
      let posts = 0, mode = 'validation';
      const unexpected = [];
      await context.route('**/*', async route => {
        const request = route.request(); const url = new URL(request.url());
        if (origin === 'http://localhost:3000' && url.pathname === '/api/v1/categories') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin }, body: JSON.stringify({ data: [] }) });
        if (origin === 'http://localhost:3000' && url.pathname === '/api/v1/contact' && request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'content-type' } });
        const mockedContact = origin === 'http://localhost:3000' && url.pathname === '/api/v1/contact' && request.method() === 'POST';
        if (!mockedContact && ![origin, api].includes(url.origin)) { unexpected.push(url.origin); return route.abort(); }
        if (url.origin === api && url.pathname === '/api/v1/services/security') throw new Error('Security page must not require a CMS service record');
        if (request.method() === 'POST' && url.pathname !== '/api/v1/contact') return route.abort();
        if (request.method() === 'POST') {
          if (!mockedContact) assert.equal(url.origin, api); assert.equal(url.pathname, '/api/v1/contact');
          assert.equal(request.postDataJSON().subject, 'Security Audit & Hardening'); posts++;
          return route.fulfill({ status: mode === 'validation' ? 422 : 201, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin }, body: JSON.stringify(mode === 'validation' ? { errors: { email: ['Please check your email.'] } } : { data: { id: 42, status: 'received' }, message: 'Your message has been received.' }) });
        }
        if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'content-type' } });
        return route.continue();
      });
      const page = await context.newPage();
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(origin + '/services/security');
      assert.equal(response.status(), 200);
      await page.getByRole('heading', { level: 1 }).waitFor();
      assert.equal(await page.title(), 'Security Audit & Hardening | MERITLIVES LLC');
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://meritlives.com/services/security');
      assert.equal(await page.locator('main details').count(), 6);
      assert.equal(await page.locator('main video').count(), 0);
      assert.equal(await page.locator('main iframe').count(), 0);
      await page.locator('main img').evaluateAll(async images => {
        await Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); }));
      });
      assert.ok(await page.locator('main img').evaluateAll(images => images.every(image => image.naturalWidth > 0)));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      assert.ok(await page.locator('main h1, main h2, main h3').evaluateAll(headings => headings.every(heading => heading.scrollWidth <= heading.clientWidth + 1)), 'Headings must not be clipped');
      await page.getByRole('link', { name: 'Explore Our Approach' }).click();
      assert.ok(page.url().endsWith('#security-approach'));
      const faq = page.locator('main details').first();
      await faq.locator('summary').focus(); await page.keyboard.press('Enter');
      assert.equal(await faq.getAttribute('open'), '');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(directory, `security-${width}.png`), fullPage: true });
      const main = page.locator('main');
      for (const locator of [main.getByRole('button', { name: 'Request a Security Audit' }).first(), main.getByRole('button', { name: 'Talk to a Security Specialist' })]) {
        await locator.click(); const dialog = page.getByRole('dialog'); await dialog.waitFor();
        const form = dialog.getByRole('form', { name: 'Project enquiry' });
        assert.equal(await form.getByLabel('What do you need?').inputValue(), 'Security Audit & Hardening');
        await form.getByLabel('Your name', { exact: true }).fill('Test Person');
        await form.getByLabel('Work email', { exact: true }).fill('person@example.test');
        await form.getByLabel('A little about the project').fill('Only a mocked enquiry.');
        mode = 'validation'; await form.getByRole('button', { name: 'Send project enquiry' }).click();
        await form.getByRole('alert').waitFor();
        assert.equal(await form.getByLabel('Work email', { exact: true }).inputValue(), 'person@example.test');
        assert.equal(await form.getByLabel('Work email', { exact: true }).getAttribute('aria-invalid'), 'true');
        mode = 'success'; await form.getByRole('button', { name: 'Send project enquiry' }).click();
        await dialog.getByText('Enquiry received', { exact: true }).waitFor();
        await dialog.getByRole('button', { name: 'Done', exact: true }).click();
        await dialog.waitFor({ state: 'hidden' });
      }
      assert.equal(posts, 4); assert.deepEqual(unexpected, []); assert.deepEqual(errors, []);
      if (origin !== 'http://localhost:3000') {
        await page.goto(origin + '/services');
        assert.equal(await page.locator('main a[href="/services/security"]').count(), 1);
      }
      scenarios++; await context.close();
    }
    console.log(`Passed ${scenarios} security-page browser scenarios at 320/390/768/1440px: HTTP 200, SEO, assets, FAQ keyboard controls, anchor, catalogue link and mocked enquiry validation/success.`);
    console.log('Screenshots: ' + directory);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
