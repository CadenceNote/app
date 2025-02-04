import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
    id: string;  // Changed to string for UUID
    email: string;
    full_name: string;
}

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                // If session exists, get user data directly from Supabase
                if (session.user) {
                    const { data: userData, error } = await supabase
                        .from('users')
                        .select('supabase_uid, email, full_name')
                        .eq('supabase_uid', session.user.id)
                        .single();

                    if (error) throw error;

                    if (userData) {
                        setUser({
                            id: userData.supabase_uid,
                            email: userData.email,
                            full_name: userData.full_name,
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to load user:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
            } else if (event === 'SIGNED_IN') {
                loadUser();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { user, isLoading };
} 