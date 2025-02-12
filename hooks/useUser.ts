import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { userApi } from '@/services/userApi';

interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string | null;
    user_metadata?: {
        avatar_url?: string;
    };
}

// Cache key for user data
export const userKeys = {
    current: () => ['current_user'],
};

export function useUser() {
    // Use SWR for fetching user data
    const { data, error, isLoading, mutate } = useSWR(
        userKeys.current(),
        async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (!session) {
                    return null;
                }

                if (session.user) {
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('supabase_uid, email, full_name, avatar_url')
                        .eq('supabase_uid', session.user.id)
                        .single();

                    if (userError) throw userError;

                    if (userData) {
                        return {
                            id: userData.supabase_uid,
                            email: userData.email,
                            full_name: userData.full_name,
                            avatar_url: userData.avatar_url,
                            user_metadata: session.user.user_metadata
                        };
                    }
                }
                return null;
            } catch (error) {
                console.error('Error in useUser:', error);
                throw error;
            }
        },
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 5000,
            shouldRetryOnError: false
        }
    );

    // Setup auth state change listener
    useSWR(userKeys.current(), () => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_OUT') {
                // Just revalidate the data when signed out
                await mutate(userKeys.current());
            }
        });
        return () => subscription.unsubscribe();
    });

    return {
        user: data,
        isLoading,
        error: error as Error | null,
    };
}

export function useTeamUsers(teamId?: number) {
    const { data: users = [], error, isLoading } = useSWR(
        teamId ? ['team-users', teamId] : null,
        async () => {
            if (!teamId) return [];
            return userApi.getTeamUsers(teamId);
        },
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 5000,
        }
    );

    return {
        users,
        error,
        isLoading,
    };
}