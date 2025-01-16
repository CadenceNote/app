import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

                // Try to get cached user data
                const cachedUser = sessionStorage.getItem('currentUser');
                if (cachedUser) {
                    setUser(JSON.parse(cachedUser));
                    setIsLoading(false);
                    return;
                }

                // If no cached data, get user data from session
                if (session.user) {
                    const userData: User = {
                        id: parseInt(session.user.id),
                        email: session.user.email || '',
                        full_name: session.user.user_metadata.full_name || ''
                    };
                    setUser(userData);
                    sessionStorage.setItem('currentUser', JSON.stringify(userData));
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
                sessionStorage.removeItem('currentUser');
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