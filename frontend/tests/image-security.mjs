import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { hasRemoteMatch } = require('next/dist/shared/lib/match-remote-pattern');
process.env.NODE_ENV = 'production';
process.env.NEXT_PUBLIC_API_URL = 'https://api.meritlives.com/api/v1';
const { default: config } = await import('../next.config.mjs?security-production');
const allowed = (url) => hasRemoteMatch([], config.images.remotePatterns, new URL(url));
for (const url of ['http://localhost:8000/storage/a.png', 'http://127.0.0.1/storage/a.png', 'http://[::1]/storage/a.png', 'https://example.test/a.png', 'ftp://api.meritlives.com/storage/a.png', 'https://api.meritlives.com:8443/storage/a.png', 'https://api.meritlives.com/admin/a.png', 'https://api.meritlives.com/storage/a.png?redirect=1', 'http://i.ytimg.com/vi/abcdefghijk/default.jpg']) {
  assert.equal(allowed(url), false, url);
}
for (const url of ['https://api.meritlives.com/storage/blogs/a.png', 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg', 'https://img.youtube.com/vi/abcdefghijk/0.jpg']) {
  assert.equal(allowed(url), true, url);
}
assert.equal(config.images.dangerouslyAllowSVG, false);
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api/v1';
const { default: loopbackConfig } = await import('../next.config.mjs?security-loopback');
assert.equal(loopbackConfig.images.remotePatterns.some(p => p.hostname === 'localhost'), false);
console.log('Image allowlist: approved host/path cases and unsafe URL rejection passed; no network requests made.');

const { ImageOptimizerCache, imageOptimizer } = require('next/dist/server/image-optimizer');
const { imageConfigDefault } = require('next/dist/shared/lib/image-config');
const optimizerConfig = { ...config, images: { ...imageConfigDefault, ...config.images } };
const validate = (url) => ImageOptimizerCache.validateParams({ headers: { accept: 'image/webp' } }, { url, w: '640', q: '75' }, optimizerConfig, false);
for (const url of ['http://localhost:8000/storage/a.png', 'http://127.0.0.1/storage/a.png', 'http://[::1]/storage/a.png', 'https://example.test/a.png', 'ftp://api.meritlives.com/storage/a.png', 'https://api.meritlives.com:8443/storage/a.png']) {
  assert.ok(validate(url).errorMessage, url);
}
const params = validate('https://api.meritlives.com/storage/general/test.png');
assert.equal(params.errorMessage, undefined);
const sharp = require('sharp');
const source = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#cc1111' } }).png().toBuffer();
const optimized = await imageOptimizer({ buffer: source, etag: 'security-fixture', cacheControl: 'max-age=60' }, params, optimizerConfig, { isDev: false, silent: true });
assert.equal(optimized.contentType, 'image/webp');
assert.ok(optimized.buffer.length > 0);
console.log('Optimizer parameter rejection and disposable raster optimization passed with sharp ' + sharp.versions.sharp);
const headers = (await config.headers())[0].headers;
assert.equal(headers.find(h => h.key === 'X-Content-Type-Options').value, 'nosniff');
