'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, AuthError, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const SUPER_ADMIN_ID = '4d1db31b-9aa5-4e98-9a6d-6cd2f7b5473d';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    adminLoading: boolean;
    isSuperAdmin: boolean;
    signUp: (email: string, password: string, username: string) => Promise<{ user: User | null; error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
    verifyOtp: (email: string, token: string) => Promise<{ user: User | null; error: AuthError | null }>;
    resendOtp: (email: string) => Promise<{ error: AuthError | null }>;
    logOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    deleteUser: (userId: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminLoading, setAdminLoading] = useState(true);

    const checkAdminStatus = useCallback(async (userId: string | undefined) => {
        if (!userId) {
            setIsAdmin(false);
            setAdminLoading(false);
            return;
        }
        try {
            setAdminLoading(true);
            const { data, error } = await supabase
                .from('admins')
                .select('id')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('Admin check query error:', error);
                setIsAdmin(false);
            } else {
                setIsAdmin(!!data);
            }
        } catch (err) {
            console.error('Admin check failed:', err);
            setIsAdmin(false);
        } finally {
            setAdminLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setLoading(false);
                await checkAdminStatus(currentUser?.id);
            } catch (err) {
                console.error('Session init failed:', err);
                setLoading(false);
                setAdminLoading(false);
            }
        };

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event: AuthChangeEvent, session: Session | null) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setLoading(false);
                checkAdminStatus(currentUser?.id);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [checkAdminStatus]);

    const isSuperAdmin = user?.id === SUPER_ADMIN_ID;

    const signUp = async (email: string, password: string, username: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });
        return { user: data.user, error };
    };

    const verifyOtp = async (email: string, token: string) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });
        return { user: data.user, error };
    };

    const resendOtp = async (email: string) => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });
        return { error };
    };

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { user: data.user, error };
    };

    const logOut = async () => {
        await supabase.auth.signOut();
    };

    const deleteUser = async (userId: string) => {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        return { error };
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password-confirm`,
        });
        return { error };
    };

    const value = {
        user,
        loading,
        isAdmin,
        adminLoading,
        isSuperAdmin,
        signUp,
        signIn,
        verifyOtp,
        resendOtp,
        logOut,
        resetPassword,
        deleteUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}