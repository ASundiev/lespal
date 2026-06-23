import assert from 'node:assert/strict';
import {
    clearLibraryCache,
    LIBRARY_CACHE_PREFIX,
    readBestLibraryCache,
    readLibraryCache,
    writeLibraryCache,
} from '../src/lib/libraryCache.js';

function createStorage() {
    const data = new Map();
    return {
        get length() { return data.size; },
        key(index) { return Array.from(data.keys())[index] || null; },
        getItem(key) { return data.has(key) ? data.get(key) : null; },
        setItem(key, value) { data.set(key, String(value)); },
        removeItem(key) { data.delete(key); },
        [Symbol.iterator]() { return data[Symbol.iterator](); },
    };
}

const workspaceId = 'shared-workspace';
const storage = createStorage();

assert.equal(readLibraryCache(workspaceId, storage), null);
assert.equal(writeLibraryCache(workspaceId, [], [], storage), false);
assert.equal(readLibraryCache(workspaceId, storage), null);

assert.equal(writeLibraryCache(workspaceId, [{ id: 'song-1' }], [{ id: 'lesson-1' }], storage), true);
const cached = readLibraryCache(workspaceId, storage);
assert.equal(cached.songs.length, 1);
assert.equal(cached.lessons.length, 1);
assert.ok(cached.cachedAt);

const fallback = createStorage();
fallback.setItem(`${LIBRARY_CACHE_PREFIX}${workspaceId}`, JSON.stringify({ songs: [{ id: 'fallback' }], lessons: [] }));
assert.equal(readBestLibraryCache(workspaceId, [createStorage(), fallback]).songs[0].id, 'fallback');

clearLibraryCache([storage, fallback]);
assert.equal(readLibraryCache(workspaceId, storage), null);
assert.equal(readLibraryCache(workspaceId, fallback), null);

console.log('library cache checks passed');
