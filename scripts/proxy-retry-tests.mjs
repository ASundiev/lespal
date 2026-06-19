import assert from 'node:assert/strict';
import { getRequestMethod, isSafeToRetry, prioritizeProxyUrls } from '../src/lib/proxyRetry.js';

assert.equal(getRequestMethod('https://example.test/data'), 'GET');
assert.equal(getRequestMethod('https://example.test/data', { method: 'post' }), 'POST');
assert.equal(isSafeToRetry('https://example.test/data', { method: 'GET' }), true);
assert.equal(isSafeToRetry('https://example.test/data', { method: 'HEAD' }), true);
assert.equal(isSafeToRetry('https://example.test/data', { method: 'POST' }), false);
assert.equal(isSafeToRetry('https://example.test/data', { method: 'PATCH' }), false);
assert.equal(isSafeToRetry('https://example.test/data', { method: 'DELETE' }), false);
assert.deepEqual(
    prioritizeProxyUrls(['one', 'two', 'three'], 'two'),
    ['two', 'one', 'three']
);

console.log('proxy retry checks passed');
