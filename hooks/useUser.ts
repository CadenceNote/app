import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string | null;
}

interface UserState {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
}

const CACHED_USER_KEY = 'cached_user';

export function useUser() {
    const [state, setState] = useState<UserState>({
        user: null,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        // Sanitize cached data before using
        const getCachedUser = () => {
            try {
                const cached = localStorage.getItem(CACHED_USER_KEY);
                if (!cached) return null;
                const parsed = JSON.parse(cached);
                // Validate required fields
                if (!parsed.id || !parsed.email || !parsed.full_name) {
                    throw new Error('Invalid cached user data');
                }
                return parsed;
            } catch {
                localStorage.removeItem(CACHED_USER_KEY);
                return null;
            }
        };

        const cachedUser = getCachedUser();
        if (cachedUser) {
            setState(prev => ({ ...prev, user: cachedUser, isLoading: false }));
        }

        const loadUser = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (!session) {
                    setState({ user: null, isLoading: false, error: null });
                    localStorage.removeItem(CACHED_USER_KEY);
                    return;
                }

                if (session.user) {
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('supabase_uid, email, full_name, avatar_url')
                        .eq('supabase_uid', session.user.id)
                        .single();

                    if (userError) throw userError;

                    if (userData) {
                        const userObject = {
                            id: userData.supabase_uid,
                            email: userData.email,
                            full_name: userData.full_name,
                            avatar_url: userData.avatar_url,
                        };

                        setState({ user: userObject, isLoading: false, error: null });
                        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(userObject));
                    }
                }
            } catch (error) {
                setState(prev => ({
                    ...prev,
                    error: error instanceof Error ? error : new Error('Unknown error'),
                    isLoading: false
                }));
            }
        };

        if (!cachedUser) {
            loadUser();
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_OUT') {
                setState({ user: null, isLoading: false, error: null });
                localStorage.removeItem(CACHED_USER_KEY);
            } else if (event === 'SIGNED_IN') {
                await loadUser();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return state;
}