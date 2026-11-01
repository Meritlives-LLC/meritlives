// Local-only browser validation. All writes are intercepted; fixture API is GET-only.
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const origin = 'http://127.0.0.1:3138';
const apiOrigin = 'http://127.0.0.1:3139';
const preferenceKey = 'meritlives-newsletter';
const dist = path.resolve(__dirname, '../.next.newsletter-check');
let checks = 0;
const check = name => { checks++; console.log('PASS ' + name); };

async function instrument(page) {
  // Must precede navigation: application timers and performance.now share this clock.
  await page.clock.install();
  await page.addInitScript(() => {
    const state = window.__newsletterDiagnostic = { listeners: [], interactions: [], ticks: 0, lastTick: null };
    const add = window.addEventListener.bind(window);
    window.addEventListener = (type, ...args) => {
      state.listeners.push({ type, at: performance.now() });
      return add(type, ...args);
    };
    for (const type of ['pointerdown', 'scroll', 'keydown']) {
      add(type, () => state.interactions.push({ type, at: performance.now() }));
    }
    const interval = window.setInterval.bind(window);
    window.setInterval = (callback, delay, ...args) => interval(() => {
      if (delay === 1000) { state.ticks++; state.lastTick = performance.now(); }
      callback(...args);
    }, delay);
  });
}
async function snapshot(page) {
  return page.evaluate(() => ({
    route: location.pathname,
    desktop: matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches,
    visibility: document.visibilityState,
    preference: localStorage.getItem('meritlives-newsletter'),
    focus: document.activeElement?.outerHTML.slice(0, 180),
    blockingModal: !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]'),
    busyForm: !!document.querySelector('form[aria-busy="true"]'),
    activeForm: !!document.activeElement?.closest('form, input, textarea, select, [contenteditable="true"]'),
    dialogs: [...document.querySelectorAll('dialog')].map(el => ({ open: el.open, name: el.getAttribute('aria-labelledby') })),
    diagnostic: window.__newsletterDiagnostic,
  }));
}
async function ready(page, route, suppressed = false) {
  await page.goto(origin + route);
  await page.getByRole('heading', { level: 1 }).waitFor();
  if (!suppressed) {
    // SSR headings alone are not evidence that useEffect has attached the trigger listeners.
    await page.waitForFunction(() => window.__newsletterDiagnostic?.listeners.some(item => item.type === 'scroll'));
  }
}
async function engage(page) {
  await page.locator('h1').evaluate(el => { el.tabIndex = -1; el.focus({ preventScroll: true }); });
  await page.keyboard.press('Shift');
}
async function expectPopup(page, label) {
  try { await page.getByRole('dialog', { name: 'Great ideas deserve to be shared.' }).waitFor({ timeout: 8000 }); }
  catch (error) { console.error('POPUP DIAGNOSTIC ' + label, JSON.stringify(await snapshot(page))); throw error; }
}
async function noPopup(page) { assert.equal(await page.locator('dialog[open]').count(), 0); }

(async () => {
  const buildId = fs.readFileSync(path.join(dist, 'BUILD_ID'), 'utf8').trim();
  const builtAt = fs.statSync(path.join(dist, 'BUILD_ID')).mtimeMs;
  for (const source of ['components/EditorialNewsletterExperience.tsx', 'components/EditorialNewsletterPopup.tsx', 'components/NewsletterForm.tsx', 'lib/newsletter-preferences.ts', 'app/news/layout.tsx', 'app/blog/layout.tsx']) {
    assert.ok(fs.statSync(path.resolve(__dirname, '..', source)).mtimeMs <= builtAt, 'Stale build: ' + source);
  }
  console.log('BUILD ' + buildId);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'meritlives-newsletter-'));
  let activePage;
  async function fixture(width = 1440) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const state = { posts: 0, mode: 'success', errors: [] };
    await context.route('**/*', async route => {
      const request = route.request(); const url = new URL(request.url());
      if (![origin, apiOrigin].includes(url.origin)) return route.abort();
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Accept' } });
      if (!['GET', 'HEAD'].includes(request.method())) {
        assert.equal(request.method(), 'POST'); assert.equal(url.origin, apiOrigin); assert.equal(url.pathname, '/api/v1/newsletter');
        state.posts++;
        return route.fulfill({ status: state.mode === 'validation' ? 422 : 201, headers: { 'Access-Control-Allow-Origin': origin }, contentType: 'application/json', body: JSON.stringify(state.mode === 'validation' ? { errors: { email: ['Check the email address.'] } } : { data: { id: 42, status: 'subscribed' }, message: 'Subscription received.' }) });
      }
      return route.continue();
    });
    const page = activePage = await context.newPage();
    page.on('pageerror', error => state.errors.push(error.message));
    await instrument(page);
    return { context, page, state };
  }
  async function finish(f) { assert.deepEqual(f.state.errors, []); await f.context.close(); activePage = null; }
  try {
    // Repeat the former timeout with diagnostics, after explicit hydration readiness.
    {
      const f = await fixture(); const { page } = f;
      await ready(page, '/news');
      const script = await page.locator('script[src*="/_next/static/chunks/"]').first().getAttribute('src');
      const served = await page.request.get(origin + script);
      const digest = value => crypto.createHash('sha256').update(value).digest('hex');
      assert.equal(digest(await served.body()), digest(fs.readFileSync(path.join(dist, new URL(script, origin).pathname.replace('/_next/', '')))));
      check('fresh build and served JavaScript match');
      console.log('TRIGGER READY ' + JSON.stringify(await snapshot(page)));
      await engage(page); await page.clock.runFor(44000); await noPopup(page);
      await page.clock.runFor(1100); await expectPopup(page, '45-second timer');
      console.log('TRIGGER OPEN ' + JSON.stringify(await snapshot(page)));
      check('45-second eligible engagement, with no early popup');
      const dialog = page.getByRole('dialog'); const close = dialog.getByRole('button', { name: 'Close newsletter' });
      assert.equal(await close.evaluate(el => el === document.activeElement), true);
      const privacy = dialog.getByRole('link', { name: 'Privacy Policy' });
      await privacy.focus(); await page.keyboard.press('Tab');
      assert.equal(await close.evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Shift+Tab'); assert.equal(await privacy.evaluate(el => el === document.activeElement), true);
      for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true); }
      check('initial focus and forward/backward keyboard containment');
      await dialog.screenshot({ path: path.join(directory, 'popup-1440.png') });
      const dismissedAt = await page.evaluate(() => Date.now());
      await page.keyboard.press('Escape'); await noPopup(page);
      assert.equal(await page.locator('h1').evaluate(el => el === document.activeElement), true);
      check('Escape closes and restores previous focus');
      const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), preferenceKey);
      assert.ok(Math.abs(saved.dismissedUntil - dismissedAt - 30 * 86400000) < 100);
      await ready(page, '/blog', true); await engage(page); await page.clock.runFor(60000); await noPopup(page);
      check('dismissal survives full navigation with a 30-day expiry');
      await page.clock.setSystemTime(new Date(await page.evaluate(() => Date.now()) + 29 * 86400000)); await ready(page, '/news', true); await engage(page); await page.clock.runFor(46000); await noPopup(page);
      await page.clock.setSystemTime(new Date(await page.evaluate(() => Date.now()) + 2 * 86400000)); await ready(page, '/blog'); await engage(page); await page.clock.runFor(45100); await expectPopup(page, 'dismissal expired');
      check('dismissal suppresses at day 29 and expires after day 30');
      await finish(f);
    }
    for (const width of [320, 390, 768, 1440]) {
      const f = await fixture(width); const { page, state } = f;
      for (const route of ['/news', '/blog', '/news/newsletter-fixture', '/blog/newsletter-fixture']) {
        await ready(page, route);
        const section = page.getByRole('region', { name: 'The MERITLIVES Brief' });
        await section.waitFor();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.ok(await section.evaluate(el => el.scrollWidth <= el.clientWidth));
        const colors = await section.locator('button[type="submit"]').evaluate(el => {
          const style = getComputedStyle(el); return { foreground: style.color, background: style.backgroundColor };
        });
        assert.equal(colors.foreground, 'rgb(255, 255, 255)', 'Subscribe text must retain its intended white contrast inside main');
        assert.equal(colors.background, 'rgb(215, 25, 32)');
        await section.screenshot({ path: path.join(directory, `${route.split('/')[1]}-${route.endsWith('fixture') ? 'article' : 'listing'}-${width}.png`) });
        check(route + ' inline/banner layout at ' + width);
      }
      if (width < 1024) {
        await ready(page, '/news/newsletter-fixture'); await engage(page); await page.clock.runFor(60000);
        await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await page.clock.runFor(5000); await noPopup(page);
        check('mobile/tablet excludes timer and scroll popup at ' + width);
      }
      // Fresh navigation ensures screenshot scrolling cannot accidentally affect the form test.
      await ready(page, '/blog');
      const form = page.getByRole('form', { name: 'Newsletter subscription' });
      const email = form.getByLabel('Email address'); state.mode = 'validation';
      await email.fill('mock@example.test'); await form.getByRole('button', { name: 'Subscribe', exact: true }).click();
      await form.getByText('Check the email address.').waitFor(); assert.equal(await email.inputValue(), 'mock@example.test');
      assert.equal(await email.getAttribute('aria-invalid'), 'true');
      state.mode = 'success'; await form.getByRole('button', { name: 'Subscribe', exact: true }).click(); await form.getByText('Subscription received.').waitFor();
      assert.equal(state.posts, 2); assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), preferenceKey), { subscribed: true });
      // Client-side navigation must also retain suppression in module memory.
      await page.evaluate(() => { document.activeElement.blur(); history.pushState(null, '', '/blog?newsletter-check=1'); });
      await engage(page); await page.clock.runFor(60000); await noPopup(page);
      await ready(page, '/news/newsletter-fixture', true); await engage(page); await page.clock.runFor(60000); await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await page.clock.runFor(5000); await noPopup(page);
      check('inline validation, retained email, mocked success and session/reload suppression at ' + width);
      await finish(f);
    }
    {
      const f = await fixture(); const { page } = f;
      await ready(page, '/blog/newsletter-fixture');
      await page.evaluate(() => { const rect = document.querySelector('main article').getBoundingClientRect(); scrollTo(0, scrollY + rect.top + rect.height * 0.59 - innerHeight); });
      await page.clock.runFor(5000); await noPopup(page);
      await page.evaluate(() => scrollBy(0, document.querySelector('main article').getBoundingClientRect().height * 0.03));
      await page.clock.runFor(1100); await expectPopup(page, '60% scroll independent of timer');
      check('59% does not trigger; 62% triggers independently in under 7 seconds');
      const form = page.getByRole('dialog').getByRole('form');
      await form.getByLabel('Email address').fill('popup@example.test'); await form.getByRole('button', { name: 'Get the latest insights' }).click();
      await form.getByText('Subscription received.').waitFor(); await page.keyboard.press('Escape');
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), preferenceKey), { subscribed: true });
      await ready(page, '/news', true); await engage(page); await page.clock.runFor(60000); await noPopup(page);
      check('popup success remains subscribed after closing and suppresses future popups');
      await finish(f);
    }
    {
      const f = await fixture(); const { page } = f;
      await ready(page, '/news');
      // Explicitly emulate the browser visibility signal in headless Chrome.
      await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
      await engage(page); await page.clock.runFor(60000); await noPopup(page);
      await page.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
      await engage(page); await page.clock.runFor(44000); await noPopup(page); await page.clock.runFor(1100); await expectPopup(page, 'visible after hidden');
      check('hidden visibility signal prevents engagement accumulation and opening');
      await finish(f);
    }
    {
      const f = await fixture(); const { page } = f;
      await ready(page, '/news');
      await page.getByLabel('Email address').focus(); await page.keyboard.press('Shift'); await page.clock.runFor(60000); await noPopup(page);
      check('active form interaction defers popup');
      await page.evaluate(() => {
        document.activeElement.blur();
        const section = document.createElement('section'); section.id = 'enquiry-guard-fixture'; section.className = 'ml-enquiry-modal'; section.setAttribute('role', 'dialog'); section.setAttribute('aria-modal', 'true'); section.setAttribute('aria-label', 'Project enquiry'); document.body.append(section);
      });
      await engage(page); await page.clock.runFor(60000); await noPopup(page);
      assert.equal(await page.getByRole('dialog', { name: 'Project enquiry' }).count(), 1);
      await page.locator('#enquiry-guard-fixture').evaluate(el => el.remove());
      await engage(page); await page.clock.runFor(44000); await noPopup(page); await page.clock.runFor(1100); await expectPopup(page, 'existing modal removed');
      check('existing project enquiry dialog semantics prevent newsletter interruption');
      await finish(f);
    }
    console.log(JSON.stringify({ checks, buildId, screenshots: directory, writes: 'All newsletter POSTs mocked; no subscriber records created.' }));
  } catch (error) {
    if (activePage && !activePage.isClosed()) console.error('FAILURE STATE ' + JSON.stringify(await snapshot(activePage)));
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
