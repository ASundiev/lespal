import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { clearLibraryCache } from '@/lib/libraryCache';

const AuthContext = createContext({});
const AUTH_BOOTSTRAP_TIMEOUT_MS = 2500;

function withAuthTimeout(promise, label, timeoutMs = AUTH_BOOTSTRAP_TIMEOUT_MS) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshSession = useCallback(async ({ showSpinner = false } = {}) => {
        if (showSpinner) setLoading(true);

        try {
            const { data: { session } } = await withAuthTimeout(
                supabase.auth.getSession(),
                'Restoring session'
            );
            const currentUser = session?.user ?? null;
            setUser(currentUser);
        } catch (e) {
            console.warn('Auth bootstrap failed:', e);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const safeRefreshSession = async (options) => {
            if (!mounted) return;
            await refreshSession(options);
        };

        // Get initial session, but never leave the app on a black spinner if the
        // network/proxy stalls while mobile Safari/Chrome is restoring the page.
        safeRefreshSession({ showSpinner: true });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoading(false);
        });

        const refreshAfterReturn = () => {
            if (document.visibilityState === 'visible') {
                safeRefreshSession({ showSpinner: false });
            }
        };
        const refreshAfterPageShow = () => safeRefreshSession({ showSpinner: false });

        document.addEventListener('visibilitychange', refreshAfterReturn);
        window.addEventListener('pageshow', refreshAfterPageShow);

        return () => {
            mounted = false;
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', refreshAfterReturn);
            window.removeEventListener('pageshow', refreshAfterPageShow);
        };
    }, [refreshSession]);

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        clearLibraryCache();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signIn,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// The context hook intentionally lives beside its provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
