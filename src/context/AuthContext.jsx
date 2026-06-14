import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
    const [userRole, setUserRole] = useState(null); // 'student' or 'teacher'
    const [loading, setLoading] = useState(true);

    // Fetch user profile to get role
    const fetchUserProfile = useCallback(async (userId) => {
        if (!userId) {
            setUserRole(null);
            return;
        }

        try {
            const { data, error } = await withAuthTimeout(
                supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', userId)
                    .single(),
                'Fetching user profile'
            );

            if (error) {
                console.warn('Failed to fetch user profile:', error);
                setUserRole('student'); // Default to student if no profile
            } else {
                setUserRole(data?.role || 'student');
            }
        } catch (e) {
            console.warn('Error fetching profile:', e);
            setUserRole('student');
        }
    }, []);

    const refreshSession = useCallback(async ({ showSpinner = false } = {}) => {
        if (showSpinner) setLoading(true);

        try {
            const { data: { session } } = await withAuthTimeout(
                supabase.auth.getSession(),
                'Restoring session'
            );
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            await fetchUserProfile(currentUser?.id);
        } catch (e) {
            console.warn('Auth bootstrap failed:', e);
            setUser(null);
            setUserRole(null);
        } finally {
            setLoading(false);
        }
    }, [fetchUserProfile]);

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
            fetchUserProfile(currentUser?.id);
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
    }, [fetchUserProfile, refreshSession]);

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        setUserRole(null);
    };

    // Reload profile (e.g., after role change)
    const refreshProfile = () => fetchUserProfile(user?.id);

    return (
        <AuthContext.Provider value={{
            user,
            userRole,
            loading,
            signIn,
            signUp,
            signOut,
            refreshProfile,
            isTeacher: userRole === 'teacher'
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
