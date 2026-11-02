const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const origin = process.env.NAVIGATION_TEST_ORIGIN || 'http://127.0.0.1:3142';
const serviceSlugs = ['web-development', 'Fintech', 'EdTech', 'Education', 'real-estate', 'business-automation', 'security'];
const blogs = [
  ['Company Updates', 'company-updates'], ['Projects & Operations', 'projects-operations'],
  ['Industry Insights & Thought Leadership', 'industry-insights-thought-leadership'],
  ['Team & Culture', 'team-culture'], ['Knowledge Base', 'knowledge-base'], ['Policies & Procedures', 'policies-procedures'],
];
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--explicitly-allowed-ports=9'] });
  try {
    for (const width of [1440, 1024, 768, 375]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const news = [
        { name: 'Science & Research', slug: 'research-updates', type: 'news', status: 'active' },
        { name: 'Technology', slug: 'technology', type: 'news', status: 'active' },
        { name: 'Hidden', slug: 'hidden', type: 'news', status: 'inactive' },
      ];
      await page.route('http://127.0.0.1:9/api/v1/categories?**', route => {
        const isNews = new URL(route.request().url()).searchParams.get('type') === 'news';
        return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }, contentType: 'application/json', body: JSON.stringify({ data: isNews ? news : blogs.map(([name, slug]) => ({ name, slug, type: 'blog', status: 'active' })) }) });
      });
      assert.equal((await page.goto(origin + '/services', { waitUntil: 'domcontentloaded' })).status(), 200);
      await page.locator('#menu-news a[href="/news?category=research-updates"]').waitFor({ state: 'attached' });
      const desktop = width >= 1024;
      if (!desktop) await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      const header = page.locator('header.ml-site-header');
      const open = async label => {
        if (desktop) await header.getByRole('button', { name: label, exact: true }).click();
        else await header.locator('summary').filter({ hasText: new RegExp('^' + label + '$') }).click();
      };
      await open('Services');
      for (const slug of serviceSlugs) await header.locator(`a[href="/services/${slug}"]`).filter({ visible: true }).waitFor();
      assert.equal(await page.locator('a[href="/services/ongoing-maintenance"]').count(), 0);
      await open('News');
      const newsPanel = desktop ? page.locator('#menu-news') : header.locator('details').filter({ has: page.locator('summary', { hasText: /^News$/ }) });
      await newsPanel.locator('a[href="/news?category=research-updates"]').waitFor();
      assert.equal(await newsPanel.locator('a').first().textContent(), 'All News');
      assert.equal(await newsPanel.locator('a[href="/news?category=hidden"]').count(), 0);
      await open('Blog');
      const blogPanel = desktop ? page.locator('#menu-blog') : header.locator('details').filter({ has: page.locator('summary', { hasText: /^Blog$/ }) });
      assert.equal(await blogPanel.locator('a').first().textContent(), 'All Blog Posts');
      for (const [, slug] of blogs) await blogPanel.locator(`a[href="/blog?category=${slug}"]`).waitFor();
      await page.keyboard.press('Escape');
      if (desktop) assert.equal(await header.getByRole('button', { name: 'Blog', exact: true }).getAttribute('aria-expanded'), 'false');
      else {
        await page.getByRole('button', { name: 'Open menu', exact: true }).waitFor();
        assert.equal(await page.evaluate(() => document.body.style.overflow), '');
        await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      }
      await open('Services');
      await header.locator('a[href="/services/web-development"]').filter({ visible: true }).click();
      await page.waitForURL(origin + '/services/web-development');
      await page.getByRole('heading', { name: 'We Build Digital Experiences That Move Businesses Forward.', exact: true }).waitFor();
      if (!desktop) await page.getByRole('button', { name: 'Open menu', exact: true }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: service links, maintenance removal, News and Blog categories, Escape, Web Development navigation, no overflow or runtime errors.`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
