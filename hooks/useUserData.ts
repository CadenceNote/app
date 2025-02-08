import { useState, useEffect } from 'react';
import { userApi } from '@/services/userApi';
import { useAvatarCache } from '@/contexts/AvatarCache';

export function useUserData(userId: string | undefined) {
    const [userData, setUserData] = useState<{
        id: string;
        email: string;
        full_name: string;
        avatar_url: string | null;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { getCachedUrl, setCachedUrl } = useAvatarCache();

    useEffect(() => {
        const loadUserData = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            try {
                const data = await userApi.getUserData(userId);
                if (data?.avatar_url) {
                    // Check avatar cache
                    const cachedUrl = getCachedUrl(data.avatar_url);
                    if (!cachedUrl) {
                        setCachedUrl(data.avatar_url, data.avatar_url);
                    }
                }
                setUserData(data);
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [userId, getCachedUrl, setCachedUrl]);

    return { userData, isLoading };
} 