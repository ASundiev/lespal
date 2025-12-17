import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'student' or 'teacher'
    const [loading, setLoading] = useState(true);

    // Fetch user profile to get role
    const fetchUserProfile = async (userId) => {
        if (!userId) {
            setUserRole(null);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', userId)
                .single();

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
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            fetchUserProfile(currentUser?.id);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            fetchUserProfile(currentUser?.id);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
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
