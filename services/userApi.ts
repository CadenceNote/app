import { supabase } from '@/lib/supabase';

export interface User {
    id: string;  // supabase_uid
    email: string;
    full_name?: string;
    avatar_url?: string;
}

const AVATAR_CACHE_PREFIX = 'user_avatar_';

export const userApi = {
    // Get user data with caching
    getUserData: async (userId: string): Promise<User | null> => {
        try {
            // Check local storage cache first
            const cachedData = localStorage.getItem(`${AVATAR_CACHE_PREFIX}${userId}`);
            if (cachedData) {
                return JSON.parse(cachedData);
            }

            // If not in cache, fetch from database
            const { data: userData, error } = await supabase
                .from('users')
                .select('supabase_uid, email, full_name, avatar_url')
                .eq('supabase_uid', userId)
                .single();

            if (error) throw error;

            if (userData) {
                const user = {
                    id: userData.supabase_uid,
                    email: userData.email,
                    full_name: userData.full_name,
                    avatar_url: userData.avatar_url
                };

                // Cache the result
                localStorage.setItem(
                    `${AVATAR_CACHE_PREFIX}${userId}`,
                    JSON.stringify(user)
                );

                return user;
            }

            return null;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    },

    // Get multiple users' data at once
    getUsersData: async (userIds: string[]): Promise<Record<string, User>> => {
        try {
            // Check cache first
            const result: Record<string, User> = {};
            const uncachedIds: string[] = [];

            userIds.forEach(id => {
                const cachedData = localStorage.getItem(`${AVATAR_CACHE_PREFIX}${id}`);
                if (cachedData) {
                    result[id] = JSON.parse(cachedData);
                } else {
                    uncachedIds.push(id);
                }
            });

            if (uncachedIds.length > 0) {
                const { data: usersData, error } = await supabase
                    .from('users')
                    .select('supabase_uid, email, full_name, avatar_url')
                    .in('supabase_uid', uncachedIds);

                if (error) throw error;

                usersData?.forEach(userData => {
                    const user = {
                        id: userData.supabase_uid,
                        email: userData.email,
                        full_name: userData.full_name,
                        avatar_url: userData.avatar_url
                    };

                    result[user.id] = user;

                    // Cache individual results
                    localStorage.setItem(
                        `${AVATAR_CACHE_PREFIX}${user.id}`,
                        JSON.stringify(user)
                    );
                });
            }

            return result;
        } catch (error) {
            console.error('Error fetching users data:', error);
            return {};
        }
    },

    // Clear user cache
    clearUserCache: (userId?: string) => {
        if (userId) {
            localStorage.removeItem(`${AVATAR_CACHE_PREFIX}${userId}`);
        } else {
            // Clear all user caches
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(AVATAR_CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            }
        }
    },

    getTeamUsers: async (teamId: number): Promise<User[]> => {
        const { data: teamMembers, error } = await supabase
            .from('team_members')
            .select(`
                user_id,
                users:user_id (
                    supabase_uid,
                    email,
                    full_name,
                    avatar_url
                )
            `)
            .eq('team_id', teamId);

        if (error) {
            console.error('Error fetching team users:', error);
            throw error;
        }

        return teamMembers.map(member => ({
            id: member.users.supabase_uid,
            email: member.users.email,
            full_name: member.users.full_name,
            avatar_url: member.users.avatar_url
        }));
    },

    getCurrentUser: async (): Promise<User | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('users')
            .select('supabase_uid, email, full_name, avatar_url')
            .eq('supabase_uid', user.id)
            .single();

        if (error || !data) return null;

        return {
            id: data.supabase_uid,
            email: data.email,
            full_name: data.full_name,
            avatar_url: data.avatar_url
        };
    }
}; 