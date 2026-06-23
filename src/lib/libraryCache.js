export const LIBRARY_CACHE_PREFIX = 'lespal_library_v3:';

function getBrowserStorage(name) {
    try {
        return globalThis?.[name] || null;
    } catch {
        return null;
    }
}

function isValidLibraryCache(value) {
    return Boolean(
        value
        && Array.isArray(value.songs)
        && Array.isArray(value.lessons)
    );
}

export function readLibraryCache(workspaceId, storage) {
    if (!storage) return null;
    try {
        const cached = JSON.parse(storage.getItem(`${LIBRARY_CACHE_PREFIX}${workspaceId}`));
        return isValidLibraryCache(cached) ? cached : null;
    } catch {
        return null;
    }
}

export function readBestLibraryCache(workspaceId, storages = [
    getBrowserStorage('localStorage'),
    getBrowserStorage('sessionStorage'),
]) {
    for (const storage of storages) {
        const cached = readLibraryCache(workspaceId, storage);
        if (cached) return cached;
    }
    return null;
}

export function writeLibraryCache(workspaceId, songs, lessons, storage = getBrowserStorage('localStorage')) {
    if (!storage || !Array.isArray(songs) || !Array.isArray(lessons)) return false;
    if (songs.length === 0 && lessons.length === 0) return false;

    try {
        storage.setItem(`${LIBRARY_CACHE_PREFIX}${workspaceId}`, JSON.stringify({
            cachedAt: new Date().toISOString(),
            songs,
            lessons,
        }));
        return true;
    } catch {
        return false;
    }
}

export function clearLibraryCache(storages = [
    getBrowserStorage('localStorage'),
    getBrowserStorage('sessionStorage'),
]) {
    for (const storage of storages) {
        if (!storage) continue;
        try {
            Array.from({ length: storage.length }, (_, index) => storage.key(index))
                .filter(Boolean)
                .filter(key => key.startsWith(LIBRARY_CACHE_PREFIX))
                .forEach(key => storage.removeItem(key));
        } catch {
            // Cache cleanup is best-effort. Signing out must not fail because
            // private browsing storage is unavailable.
        }
    }
}
