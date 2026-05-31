import { createClient } from '@supabase/supabase-js';

const directSupabaseUrl = 'https://odhkokbxpaolreqylvsf.supabase.co';
const proxiedSupabaseUrls = [
    'https://94.72.103.203.nip.io/supabase',
    'https://94-72-103-203.nip.io/supabase',
    'https://94-72-103-203.sslip.io/supabase',
    'https://94.72.103.203.sslip.io/supabase',
];
const proxiedSupabaseUrl = proxiedSupabaseUrls[0];
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaGtva2J4cGFvbHJlcXlsdnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODI5NDMsImV4cCI6MjA4MTU1ODk0M30.1JvfPnzlpMqHgWKdUxLDxVI2y8B3Wya3LongdemA8mA';
const PROXY_FETCH_TIMEOUT_MS = 8000;

// Supabase's *.supabase.co endpoint can be unreachable from some networks.
// Keep the client URL on HTTPS reverse proxies owned by Lespal's VPS; Caddy
// strips /supabase and forwards to directSupabaseUrl so Auth, REST, and RLS
// still behave exactly like the original Supabase project.
const supabaseUrl = proxiedSupabaseUrl;

function rewriteProxyUrl(resource, targetBaseUrl) {
    const primaryBaseUrl = proxiedSupabaseUrls[0];
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

    for (const targetBaseUrl of proxiedSupabaseUrls) {
        const controller = new AbortController();
        const timeoutId = globalThis.setTimeout(() => controller.abort(), PROXY_FETCH_TIMEOUT_MS);

        try {
            const proxiedResource = rewriteProxyUrl(resource, targetBaseUrl);
            const response = await fetch(proxiedResource, { ...init, signal: controller.signal });
            return response;
        } catch (error) {
            lastError = error;
            console.warn(`Supabase proxy failed: ${targetBaseUrl}`, error);
        } finally {
            globalThis.clearTimeout(timeoutId);
        }
    }

    throw lastError;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: fetchWithProxyFallback,
    },
});
export { directSupabaseUrl, proxiedSupabaseUrl, proxiedSupabaseUrls };
