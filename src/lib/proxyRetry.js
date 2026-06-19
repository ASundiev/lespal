const SAFE_RETRY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function getRequestMethod(resource, init) {
    if (init?.method) return String(init.method).toUpperCase();
    if (typeof Request !== 'undefined' && resource instanceof Request) {
        return resource.method.toUpperCase();
    }
    return 'GET';
}

export function isSafeToRetry(resource, init) {
    return SAFE_RETRY_METHODS.has(getRequestMethod(resource, init));
}

export function prioritizeProxyUrls(urls, preferredUrl) {
    return preferredUrl
        ? [preferredUrl, ...urls.filter(url => url !== preferredUrl)]
        : [...urls];
}
