'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthError, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
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

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        getInitialSession();

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event: AuthChangeEvent, session: Session | null) => {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

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