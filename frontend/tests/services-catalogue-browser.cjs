const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const origin = 'http://127.0.0.1:3138';
const hrefs = ['/services/web-development', '/services/fintech', '/services/EdTech', '/services/business-automation', '/services/Education', '/services/real-estate', '/services/security', '/services/ongoing-maintenance'];
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'meritlives-services-'));
  try {
    for (const width of [375, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
      await context.route('**/*', route => {
        const request = route.request(); const url = new URL(request.url());
        if (!['http://127.0.0.1:3138', 'http://127.0.0.1:3139'].includes(url.origin) || !['GET', 'HEAD'].includes(request.method())) return route.abort();
        return route.continue();
      });
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      assert.equal((await page.goto(origin + '/services')).status(), 200);
      assert.ok((await page.title()).includes('Technology Services'));
      assert.equal(await page.locator('main h1').textContent(), 'Technology services built around your ambitions.');
      for (const href of hrefs) assert.equal(await page.locator(`main a[href="${href}"]`).count(), 1);
      assert.equal(await page.locator('main a[href="/contact"]').count(), 1);
      await page.locator('main img').evaluateAll(images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); })));
      assert.ok(await page.locator('main img').evaluateAll(images => images.length === 8 && images.every(image => image.naturalWidth > 0)));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}`);
      const sections = page.locator('section[data-service]');
      for (let index = 0; index < 4; index++) {
        const section = sections.nth(index);
        const image = await section.locator('img').boundingBox(); const text = await section.locator('h2').boundingBox();
        if (width < 768) assert.ok(image.y + image.height <= text.y, 'Mobile image above text');
        else assert.ok(index % 2 ? image.x > text.x : image.x < text.x, 'Alternating editorial layout');
        assert.ok(Math.abs(image.width / image.height - 4 / 3) < 0.02, 'Consistent photo aspect ratio');
      }
      const columns = await page.locator('#other-services-title + div').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
      assert.equal(columns, width === 375 ? 1 : width === 768 ? 2 : 4);
      const link = page.locator('main a').first(); await link.focus();
      assert.ok(await link.evaluate(element => element.matches(':focus-visible') && getComputedStyle(element).outlineStyle !== 'none'));
      assert.equal(await link.evaluate(element => getComputedStyle(element).color), 'rgb(255, 255, 255)');
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.deepEqual(errors, []);
      await page.screenshot({ path: path.join(directory, `services-${width}.png`), fullPage: true });
      console.log(`PASS ${width}px: eight links, images, layout, grid, focus, no overflow or browser errors`);
      await context.close();
    }
    for (const href of hrefs) {
      const response = await fetch(origin + href);
      const missing = href === '/services/ongoing-maintenance';
      const body = await response.text();
      const expected = 200; // Next.js may stream a not-found boundary after HTTP headers.
      assert.equal(response.status, expected, href);
      assert.equal(body.includes('NEXT_HTTP_ERROR_FALLBACK;404'), missing, href);
      if (missing) assert.ok(body.includes('noindex'));
      console.log(`Fixture route ${href}: ${response.status}${missing ? ' (CMS record absent: streamed not-found boundary verified)' : ''}`);
    }
    console.log('Screenshots: ' + directory);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
