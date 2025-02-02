import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import api from '@/services/api';

interface User {
    id: number;
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

                // If session exists, get user data from our backend
                if (session.user) {
                    // Fetch user data from our backend which will map Supabase UID to internal ID
                    const response = await api.get('/users/me/');
                    const userData: User = {
                        id: response.data.id,
                        email: response.data.email,
                        full_name: response.data.full_name,
                    };
                    setUser(userData);
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