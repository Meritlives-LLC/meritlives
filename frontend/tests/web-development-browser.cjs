const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const origin = process.env.NAVIGATION_TEST_ORIGIN || 'http://127.0.0.1:3142';
    await page.goto(origin + '/services', { waitUntil: 'domcontentloaded', timeout: 120000 });
    const nav = page.getByRole('navigation', { name: 'Main', exact: true });
    const servicesButton = nav.getByRole('button', { name: 'Services', exact: true });
    await expect(async () => {
      await servicesButton.click();
      await expect(servicesButton).toHaveAttribute('aria-expanded', 'true');
    }).toPass({ timeout: 15000 });
    const link = nav.getByRole('menuitem', { name: 'Custom Web & SaaS Development', exact: true });
    assert.equal(await link.getAttribute('href'), '/services/web-development');
    await link.click();
    await page.waitForURL(origin + '/services/web-development', { timeout: 120000 });
    await page.getByRole('heading', { name: 'We Build Digital Experiences That Move Businesses Forward.', exact: true }).waitFor({ timeout: 120000 });
    assert.equal(await page.getByText('This page could not be found.').count(), 0);
    const response = await page.request.get(origin + '/services/web-development');
    assert.equal(response.status(), 200);
    assert.equal((await response.text()).includes('NEXT_HTTP_ERROR_FALLBACK;404'), false);
    console.log('PASS: Services dropdown link opens Web Development content; direct request returns HTTP 200 with no streamed 404.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
