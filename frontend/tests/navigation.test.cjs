const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body></body></html>', { url: 'http://localhost/' });
for (const name of ['window','document','navigator','HTMLElement','Node','MutationObserver']) Object.defineProperty(globalThis, name, { value: name === 'window' ? dom.window : dom.window[name], configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const Module = require('node:module');
const load = Module._load;
Module._load = function(name, parent, main) {
  if (name === 'next/navigation') return { usePathname: () => '/' };
  return load.call(this, name, parent, main);
};
const React = require('react');
const { render, screen, fireEvent, act, cleanup } = require('@testing-library/react');
const queries = require('../lib/queries.ts');
queries.getBlogCategories = queries.getNewsCategories = async () => { throw Error('API unavailable'); };
const Header = require('../components/SiteHeader.tsx').default;
test('header keeps All News during API outage and existing service links on desktop and mobile', async () => {
  await act(async () => { render(React.createElement(Header)); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'News' })); });
  assert.equal(document.querySelectorAll("#menu-news a").length, 1);
  fireEvent.click(screen.getByRole('menuitem', { name: 'All News' }));
  assert.equal(screen.getByRole('button', { name: 'News' }).getAttribute('aria-expanded'), 'false');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Open menu' })); });
  for (const slug of ['web-development','Fintech','EdTech','Education','real-estate','business-automation','security']) assert.equal(document.querySelectorAll(`a[href="/services/${slug}"]`).length, 2);
  assert.equal(document.querySelectorAll('a[href="/services/ongoing-maintenance"]').length, 0);
  assert.equal(document.body.textContent.includes('Ongoing Maintenance & Feature Development'), false);
});


test('News dropdown uses active CMS categories without requiring predefined names or slugs', async () => {
  cleanup();
  queries.getNewsCategories = async () => ({ data: [
    { name: 'Technology News', slug: 'technology', type: 'news', status: 'active' },
    { name: 'Science & Research', slug: 'science-research', type: 'news', status: 'active' },
    { name: 'Hidden', slug: 'hidden', type: 'news', status: 'inactive' },
    { name: 'Unpublished', slug: 'unpublished', type: 'news', status: 'draft' },
    { name: 'Blog only', slug: 'blog-only', type: 'blog', status: 'active' },
  ] });
  await act(async () => { render(React.createElement(Header)); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'News' })); });
  assert.equal(document.querySelector('#menu-news a').textContent, 'All News');
  assert.equal(screen.getByRole('menuitem', { name: 'Technology News' }).getAttribute('href'), '/news?category=technology');
  assert.equal(screen.getByRole('menuitem', { name: 'Science & Research' }).getAttribute('href'), '/news?category=science-research');
  assert.equal(document.querySelector('a[href="/news?category=hidden"]'), null);
  assert.equal(document.querySelector('a[href="/news?category=unpublished"]'), null);
  assert.equal(document.querySelector('a[href="/news?category=blog-only"]'), null);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Open menu' })); });
  assert.equal(document.querySelectorAll('a[href="/news?category=science-research"]').length, 2);
});

test('custom News category links select the same slug on initial render and pagination', async () => {
  cleanup();
  const category = { name: 'Science & Research', slug: 'research-updates', type: 'news', status: 'active' };
  queries.getNewsCategories = async () => ({ data: [category] });
  const calls = [];
  queries.getNews = async query => { calls.push(query); return { data: [], meta: { current_page: 1, last_page: 2 } }; };
  const Page = require('../app/news/page.tsx').default;
  const element = await Page({ searchParams: Promise.resolve({ category: category.slug }) });
  await act(async () => { render(element); });
  assert.equal(calls[0], '?page=1&per_page=6&category=research-updates');
  assert.equal(screen.getByRole('button', { name: category.name }).getAttribute('aria-pressed'), 'true');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Load more' })); });
  assert.equal(calls[1], '?page=2&per_page=6&category=research-updates');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'All News' })); });
  assert.equal(calls[2], '?page=1&per_page=6');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: category.name })); });
  assert.equal(calls[3], '?page=1&per_page=6&category=research-updates');
});


test('new CMS categories appear when News is reopened without remounting the header', async () => {
  cleanup();
  let categories = [{ name: 'Technology', slug: 'technology', type: 'news', status: 'active' }];
  queries.getNewsCategories = async () => ({ data: categories });
  await act(async () => { render(React.createElement(Header)); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'News' })); });
  fireEvent.keyDown(document, { key: 'Escape' });
  categories = [...categories, { name: 'New CMS Category', slug: 'new-cms-category', type: 'news', status: 'active' }];
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'News' })); });
  assert.equal(screen.getByRole('menuitem', { name: 'New CMS Category' }).getAttribute('href'), '/news?category=new-cms-category');
});

test('Blog navigation preserves its categories, order and destinations independently of News', async () => {
  cleanup();
  const categories = [
    ['Company Updates', 'company-updates'],
    ['Projects & Operations', 'projects-operations'],
    ['Industry Insights & Thought Leadership', 'industry-insights-thought-leadership'],
    ['Team & Culture', 'team-culture'],
    ['Knowledge Base', 'knowledge-base'],
    ['Policies & Procedures', 'policies-procedures'],
  ];
  let blogRequests = 0;
  queries.getBlogCategories = async () => {
    blogRequests++;
    return { data: [
      ...categories.slice().reverse().map(([name, slug]) => ({ name, slug, type: 'blog', status: 'active' })),
      { name: 'Technology', slug: 'technology', type: 'news', status: 'active' },
      { name: 'Legacy', slug: 'legacy', type: 'blog', status: 'active' },
    ] };
  };
  queries.getNewsCategories = async () => { throw Error('News unavailable'); };
  await act(async () => { render(React.createElement(Header)); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Blog', exact: true })); });
  const expected = [['All Blog Posts', '/blog'], ...categories.map(([name, slug]) => [name, `/blog?category=${slug}`])];
  assert.deepEqual([...document.querySelectorAll('#menu-blog a')].map(link => [link.textContent, link.getAttribute('href')]), expected);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Open menu' })); });
  const mobileBlog = [...document.querySelectorAll('details')].find(details => details.querySelector('summary').textContent.trim() === 'Blog');
  assert.deepEqual([...mobileBlog.querySelectorAll('a')].map(link => [link.textContent, link.getAttribute('href')]), expected);
  assert.equal(blogRequests, 1);
});
