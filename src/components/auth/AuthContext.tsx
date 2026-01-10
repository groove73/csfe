'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isGuest: boolean;
    guestId: string | null;
    guestToken: string | null;
    loginWithGoogle: () => Promise<void>;
    continueAsGuest: (email: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);
    const [guestId, setGuestId] = useState<string | null>(null);
    const [guestToken, setGuestToken] = useState<string | null>(null);

    useEffect(() => {
        // Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setIsGuest(false);
                setGuestToken(null);
            }
        });

        // Check guest mode from localStorage
        const savedGuestToken = localStorage.getItem('guest_token');
        const guestModeActive = localStorage.getItem('guest_mode_active') === 'true';
        if (guestModeActive && savedGuestToken) {
            setGuestToken(savedGuestToken);
            setIsGuest(true);
        }

        return () => subscription.unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const continueAsGuest = async (email: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/guest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!res.ok) throw new Error('Failed to login as guest');

            const data = await res.json();
            const token = data.token;

            localStorage.setItem('guest_token', token);
            localStorage.setItem('guest_mode_active', 'true');
            // Set cookie for middleware
            document.cookie = `guest_mode_active=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days

            setGuestToken(token);
            setIsGuest(true);
            setUser(null);
        } catch (error) {
            console.error('Guest login failed:', error);
            alert('Failed to login as guest: ' + error);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('guest_mode_active');
        document.cookie = 'guest_mode_active=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        setIsGuest(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isGuest, guestId, guestToken, loginWithGoogle, continueAsGuest, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
