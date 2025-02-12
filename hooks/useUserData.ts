import useSWR, { mutate } from 'swr';
import { userApi } from '@/services/userApi';

// Cache key for user data
export const userDataKeys = {
    user: (userId?: string) => ['user_data', userId],
    all: () => ['user_data']
};

// Function to revalidate user data
export const revalidateUserData = async (userId?: string) => {
    // Clear localStorage cache first
    userApi.clearUserCache(userId);

    // Then revalidate SWR cache
    if (userId) {
        await mutate(userDataKeys.user(userId));
    }
    // Also revalidate all user data
    await mutate(userDataKeys.all());

    // Force revalidate team users cache
    await mutate((key: any) => Array.isArray(key) && key[0] === 'team-users');
};

export function useUserData(userId: string | undefined) {
    const { data: userData, isLoading, error } = useSWR(
        userId ? userDataKeys.user(userId) : null,
        async () => {
            if (!userId) return null;

            try {
                const data = await userApi.getUserData(userId);
                return data ? {
                    id: data.id,
                    email: data.email,
                    full_name: data.full_name || '',  // Ensure full_name is always a string
                    avatar_url: data.avatar_url
                } : null;
            } catch (error) {
                console.error('Error loading user data:', error);
                throw error;
            }
        },
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 5000,
            shouldRetryOnError: false,
        }
    );

    return {
        userData,
        isLoading,
        error,
        revalidate: () => revalidateUserData(userId)
    };
} 