import { createClient } from '@supabase/supabase-js';
import { isSafeToRetry, prioritizeProxyUrls } from './proxyRetry';

const directSupabaseUrl = 'https://odhkokbxpaolreqylvsf.supabase.co';
const configuredProxyUrl = import.meta.env.VITE_SUPABASE_PROXY_URL?.replace(/\/$/, '');
const legacyProxyEndpoints = [
    'https://94.72.103.203.nip.io/supabase',
    'https://94-72-103-203.nip.io/supabase',
    'https://94-72-103-203.sslip.io/supabase',
    'https://94.72.103.203.sslip.io/supabase',
];
const supabaseEndpoints = [
    ...(configuredProxyUrl ? [configuredProxyUrl] : []),
    ...legacyProxyEndpoints,
    directSupabaseUrl,
];
const proxiedSupabaseUrl = supabaseEndpoints[0];
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaGtva2J4cGFvbHJlcXlsdnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODI5NDMsImV4cCI6MjA4MTU1ODk0M30.1JvfPnzlpMqHgWKdUxLDxVI2y8B3Wya3LongdemA8mA';
const PROXY_FETCH_TIMEOUT_MS = 4000;
const RETRYABLE_GATEWAY_STATUSES = new Set([502, 503, 504]);
let preferredProxyUrl = proxiedSupabaseUrl;

// Supabase's *.supabase.co endpoint can be unreachable from some networks.
// Keep the client URL on HTTPS reverse proxies owned by Lespal's VPS; Caddy
// strips /supabase and forwards to directSupabaseUrl so Auth, REST, and RLS
// still behave exactly like the original Supabase project.
const supabaseUrl = proxiedSupabaseUrl;

function rewriteProxyUrl(resource, targetBaseUrl) {
    const primaryBaseUrl = supabaseEndpoints[0];
    if (typeof resource === 'string') {
        return resource.replace(primaryBaseUrl, targetBaseUrl);
    }
    if (resource instanceof URL) {
        return new URL(resource.toString().replace(primaryBaseUrl, targetBaseUrl));
    }
    if (resource instanceof Request) {
        return new Request(resource.url.replace(primaryBaseUrl, targetBaseUrl), resource);
    }
    return resource;
}

async function fetchWithProxyFallback(resource, init) {
    let lastError;
    let lastResponse;
    const safeToRetry = isSafeToRetry(resource, init);
    const orderedProxyUrls = prioritizeProxyUrls(supabaseEndpoints, preferredProxyUrl);
    // Mutations must be sent exactly once. A lost response does not prove that
    // the database write failed, so retrying it could create duplicate rows.
    const targetProxyUrls = safeToRetry ? orderedProxyUrls : [preferredProxyUrl];

    for (const targetBaseUrl of targetProxyUrls) {
        const controller = new AbortController();
        const timeoutId = globalThis.setTimeout(() => controller.abort(), PROXY_FETCH_TIMEOUT_MS);

        try {
            const proxiedResource = rewriteProxyUrl(resource, targetBaseUrl);
            const signals = [controller.signal, init?.signal].filter(Boolean);
            const signal = signals.length > 1 && globalThis.AbortSignal?.any
                ? globalThis.AbortSignal.any(signals)
                : controller.signal;
            const response = await fetch(proxiedResource, { ...init, signal });
            preferredProxyUrl = targetBaseUrl;
            if (safeToRetry && RETRYABLE_GATEWAY_STATUSES.has(response.status)) {
                lastResponse = response;
                continue;
            }
            return response;
        } catch (error) {
            lastError = error;
            console.warn(`Supabase proxy failed: ${targetBaseUrl}`, error);
        } finally {
            globalThis.clearTimeout(timeoutId);
        }
    }

    if (lastResponse) return lastResponse;
    throw lastError;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: fetchWithProxyFallback,
    },
});
