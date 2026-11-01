const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLFormElement', 'Node', 'FormData', 'MutationObserver', 'Event']) {
  Object.defineProperty(globalThis, name, { value: name === 'window' ? dom.window : dom.window[name], configurable: true, writable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
process.env.NEXT_PUBLIC_API_URL = 'http://mock-api.invalid/api/v1';
process.env.NEXT_PUBLIC_API_TIMEOUT_MS = '80';
const React = require('react');
const { render, screen, fireEvent, waitFor, cleanup, act } = require('@testing-library/react');
const ContactForm = require('../components/ContactForm.tsx').default;
const NewsletterForm = require('../components/NewsletterForm.tsx').default;
const { ProjectEnquiryModal } = require('../components/WebDevelopmentPage.tsx');
const { ApiError, apiFetch } = require('../lib/api.ts');

let calls;
beforeEach(() => {
  calls = [];
  globalThis.fetch = async () => { throw new Error('All HTTP must be mocked'); };
});
afterEach(() => { cleanup(); window.sessionStorage.clear(); });
function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); }
function receipt(kind) { return { data: { id: 42, status: kind === 'newsletter' ? 'subscribed' : 'received' }, message: kind === 'newsletter' ? 'Subscription received.' : 'Your message has been received.' }; }
function mockFetch(handler) { globalThis.fetch = async (url, options) => { calls.push({ url, options }); return handler(url, options); }; }
function fill(container) {
  for (const input of container.querySelectorAll('input, textarea')) {
    fireEvent.change(input, { target: { value: input.name === 'email' ? 'person@example.test' : input.name === 'phone' ? '+123456789' : input.name === 'subject' ? input.defaultValue || 'A project' : 'Details for ' + input.name } });
  }
}
const variants = [
  ['contact', () => React.createElement(ContactForm)],
  ['newsletter', () => React.createElement(NewsletterForm)],
  ['project', () => React.createElement(ProjectEnquiryModal, { onClose() {} })],
];
for (const [kind, element] of variants) {
  test(kind + ': confirmed response resets safely, announces success and blocks duplicate pending submissions', async () => {
    let resolve;
    mockFetch(() => new Promise(r => { resolve = r; }));
    const view = render(element()); fill(view.container);
    const form = view.container.querySelector('form');
    const email = form.elements.namedItem('email');
    const button = form.querySelector('[type=submit]');
    fireEvent.submit(form); fireEvent.submit(form);
    assert.equal(calls.length, 1);
    assert.equal(button.disabled, true);
    assert.equal(form.getAttribute('aria-busy'), 'true');
    assert.equal(email.value, 'person@example.test');
    assert.equal(screen.queryByText(receipt(kind).message), null);
    await act(async () => { resolve(response(201, receipt(kind))); });
    await waitFor(() => assert.ok(screen.getByText(receipt(kind).message)));
    assert.equal(email.value, '');
    assert.equal(screen.queryByRole('alert'), null);
    assert.equal(document.activeElement.getAttribute('role'), 'status');
    assert.ok(calls[0].url.endsWith(kind === 'newsletter' ? '/newsletter' : '/contact'));
    assert.equal(JSON.parse(calls[0].options.body).email, 'person@example.test');
  });

  test(kind + ': 422 messages are linked to fields, input survives, and a corrected retry succeeds', async () => {
    mockFetch(() => response(422, { message: 'Validation failed.', errors: { email: ['Use a valid work email.', 'Check the domain.'], name: ['Please check your name.'] } }));
    const view = render(element()); fill(view.container);
    const form = view.container.querySelector('form');
    fireEvent.submit(form);
    await waitFor(() => assert.ok(screen.getByRole('alert')));
    for (const name of ['name', 'email']) {
      const input = form.elements.namedItem(name);
      assert.equal(input.getAttribute('aria-invalid'), 'true');
      const message = document.getElementById(input.getAttribute('aria-describedby'));
      assert.ok(message.textContent.length > 0);
      assert.ok(document.querySelector(`label[for="${input.id}"]`));
    }
    assert.equal(form.elements.namedItem('email').value, 'person@example.test');
    assert.equal(document.activeElement, screen.getByRole('alert'));
    mockFetch(() => response(201, receipt(kind)));
    fireEvent.submit(form);
    await waitFor(() => assert.ok(screen.getByText(receipt(kind).message)));
    assert.equal(screen.queryByText('Use a valid work email. Check the domain.'), null);
    assert.equal(calls.length, 2);
  });

  for (const failure of ['network', '500', '429', 'malformed-json', 'unconfirmed', 'html-error']) {
    test(kind + ': preserves values and never announces success for ' + failure, async () => {
      mockFetch(() => {
        if (failure === 'network') throw new TypeError('Offline');
        if (failure === 'malformed-json') return new Response('not json', { status: 201 });
        if (failure === 'unconfirmed') return response(200, { message: 'ok' });
        if (failure === 'html-error') return new Response('<html>Error</html>', { status: 502 });
        return response(Number(failure), { message: 'Backend error' });
      });
      const view = render(element()); fill(view.container);
      const form = view.container.querySelector('form');
      const original = Object.fromEntries(new FormData(form).entries());
      fireEvent.submit(form);
      await waitFor(() => assert.ok(screen.getByRole('alert')));
      assert.deepEqual(Object.fromEntries(new FormData(form).entries()), original);
      assert.equal(form.querySelector('[type=submit]').disabled, false);
      assert.equal(screen.queryByText(receipt(kind).message), null);
      if (failure === '429') assert.match(screen.getByRole('alert').textContent, /Please wait/);
      assert.equal(calls.length, 1);
    });
  }
}

test('timeout retains details and does not retry automatically', async () => {
  mockFetch((url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  const view = render(React.createElement(ContactForm)); fill(view.container);
  fireEvent.submit(view.container.querySelector('form'));
  await waitFor(() => assert.ok(screen.getByRole('alert')));
  assert.equal(view.container.querySelector('[name=email]').value, 'person@example.test');
  assert.equal(calls.length, 1);
});

test('API failures retain status and normalize only string validation messages', async () => {
  mockFetch(() => response(422, { message: 'Invalid.', errors: { email: ['Bad email', 42, ''], name: 'invalid shape' } }));
  await assert.rejects(apiFetch('/contact'), error => {
    assert.ok(error instanceof ApiError); assert.equal(error.status, 422);
    assert.deepEqual(error.errors, { email: ['Bad email'] }); return true;
  });
});

test('pending modal cannot be dismissed through Escape, backdrop or close button', async () => {
  let resolve, closed = 0;
  mockFetch(() => new Promise(r => { resolve = r; }));
  const view = render(React.createElement(ProjectEnquiryModal, { onClose() { closed++; } })); fill(view.container);
  fireEvent.submit(view.container.querySelector('form'));
  fireEvent.keyDown(window, { key: 'Escape' });
  fireEvent.mouseDown(screen.getByRole('dialog').parentElement);
  fireEvent.click(screen.getByRole('button', { name: 'Close enquiry form' }));
  assert.equal(closed, 0);
  await act(async () => { resolve(response(429, {})); });
  fireEvent.keyDown(window, { key: 'Escape' }); assert.equal(closed, 1);
});

for (const [file, subject] of [
  ['WebDevelopmentPage', 'Web Development Project Enquiry'],
  ['FintechServicePage', 'Fintech Project Enquiry'],
  ['EdTechServicePage', 'EdTech Project Enquiry'],
  ['EducationServicePage', 'Education & Portal Management Project Enquiry'],
  ['BusinessAutomationServicePage', 'Business Automation Project Enquiry'],
  ['RealEstateServicePage', 'Real Estate Technology Project Enquiry'],
]) {
  test(file + ': actual service CTA uses shared validation and confirms its enquiry', async () => {
    const Page = require('../components/' + file + '.tsx').default;
    const view = render(React.createElement(Page, { service: { id: 1, slug: 'web-development', name: 'Web Development' } }));
    fireEvent.click(view.container.querySelector('button'));
    const form = screen.getByRole('form', { name: 'Project enquiry' });
    assert.equal(form.elements.namedItem('subject').value, subject);
    mockFetch(() => response(422, { errors: { email: ['Please check your email.'] } }));
    fill(form); fireEvent.submit(form);
    await waitFor(() => assert.equal(form.elements.namedItem('email').getAttribute('aria-invalid'), 'true'));
    assert.equal(form.elements.namedItem('subject').value, subject);
    mockFetch(() => response(201, receipt('project')));
    fireEvent.submit(form);
    await waitFor(() => assert.ok(screen.getByText('Enquiry received')));
    assert.equal(JSON.parse(calls[1].options.body).subject, subject);
    assert.equal(calls.length, 2);
  });
}


test('modal labels are unique across instances and focus returns to the opener', () => {
  const opener = document.createElement('button'); opener.textContent = 'Open enquiry';
  document.body.append(opener); opener.focus();
  const view = render(React.createElement(ProjectEnquiryModal, { onClose() {} }));
  const name = screen.getByLabelText('Your name', { exact: true });
  assert.equal(document.activeElement, name);
  const close = screen.getByRole('button', { name: 'Close enquiry form' });
  close.focus(); fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
  assert.equal(document.activeElement, view.container.querySelector('[type=submit]'));
  view.unmount(); assert.equal(document.activeElement, opener); opener.remove();
  const pair = render(React.createElement(React.Fragment, null,
    React.createElement(ContactForm), React.createElement(NewsletterForm)));
  const ids = [...pair.container.querySelectorAll('input[id], textarea[id]')].map(el => el.id);
  assert.equal(ids.length, new Set(ids).size);
});
