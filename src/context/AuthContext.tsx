import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    profile: any | null;
    loading: boolean;
    login: (identifier: string, password: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function fetchProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*, stores(*)')
            .eq('id', userId)
            .single();

        if (!error) setProfile(data);
        setLoading(false);
    }

    const login = async (identifier: string, password: string) => {
        let email = identifier.trim();
        if (!email.includes('@')) {
            if (email.toLowerCase() === 'admin') {
                email = 'admin@system.local';
            } else {
                // Map other usernames (e.g., 'cozinha_esquina') to virtual emails
                email = `${email.toLowerCase()}@system.local`;
            }
        }

        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) return { error: authError };

        // Fetch profile to get store_id and role
        const { data: profileData } = await supabase
            .from('profiles')
            .select('store_id, role')
            .eq('id', user?.id)
            .single();

        return { user, profile: profileData };
    };

    const signUp = async (email: string, password: string, username?: string, role: string = 'waiter', storeId?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    role,
                    store_id: storeId
                }
            }
        });
        return { data, error };
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, signUp, logout }}>
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
