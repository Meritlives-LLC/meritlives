const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const os = require('node:os');
const { chromium } = require('@playwright/test');
const origin = 'http://127.0.0.1:3138';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'meritlives-legal-browser-'));
  try {
    for (const width of [375, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const unexpected = [], errors = [];
      await context.route('**/*', route => {
        const request = route.request(); const url = new URL(request.url());
        if (!['http://127.0.0.1:3138', 'http://127.0.0.1:3139'].includes(url.origin) || !['GET', 'HEAD'].includes(request.method())) { unexpected.push(request.method() + ' ' + url.origin); return route.abort(); }
        return route.continue();
      });
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      for (const [slug, title] of [['privacy', 'Privacy Policy'], ['terms', 'Terms of Service'], ['cookies', 'Cookie Policy']]) {
        const response = await page.goto(origin + '/' + slug);
        assert.equal(response.status(), 200);
        assert.equal(await page.locator('main h1').textContent(), title);
        assert.equal(await page.title(), title + ' | MERITLIVES LLC');
        assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://meritlives.com/' + slug);
        assert.ok((await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
        assert.equal(await page.locator('main iframe, main video, main ins, main form').count(), 0);
        assert.equal(await page.locator('script[src*="googlesyndication"], script[src*="googletagmanager"], .adsbygoogle').count(), 0);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.ok(await page.locator('main h1, main h2, main p, main code').evaluateAll(elements => elements.every(e => e.scrollWidth <= e.clientWidth + 1)));
        const toc = page.getByRole('navigation', { name: 'On this page' });
        const first = toc.locator('a').first(); await first.focus();
        assert.ok(await first.evaluate(e => e.matches(':focus-visible') && getComputedStyle(e).outlineStyle !== 'none'));
        const last = toc.locator('a').last(); const href = await last.getAttribute('href'); await last.click();
        await page.waitForFunction(hash => location.hash === hash && document.activeElement.id === hash.slice(1), href);
        assert.ok(await page.locator(href).evaluate(e => e.getBoundingClientRect().top >= 70), 'Anchor target is below fixed navigation');
        for (const legal of ['privacy', 'terms', 'cookies']) assert.equal(await page.locator(`footer a[href="/${legal}"]`).count(), 1);
        // Follow the existing footer link; no mocked successful form submissions.
        await page.locator(`footer a[href="/${slug}"]`).click();
        await page.waitForURL(origin + '/' + slug);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: path.join(directory, `${slug}-${width}.png`), fullPage: true });
        console.log(`PASS /${slug} at ${width}px: title/canonical, draft status, anchors/focus, footer, no ads or overflow`);
      }
      assert.deepEqual(unexpected, []); assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('Screenshots: ' + directory);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
