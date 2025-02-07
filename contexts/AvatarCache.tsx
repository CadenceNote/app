'use client';

import { createContext, useContext, useState } from 'react';

interface AvatarCacheContextType {
    getCachedUrl: (url: string) => string | null;
    setCachedUrl: (url: string, dataUrl: string) => void;
}

const AvatarCacheContext = createContext<AvatarCacheContextType | null>(null);

export function AvatarCacheProvider({ children }: { children: React.ReactNode }) {
    const [cache] = useState<Map<string, string>>(new Map());

    return (
        <AvatarCacheContext.Provider value={{
            getCachedUrl: (url: string) => cache.get(url) || null,
            setCachedUrl: (url: string, dataUrl: string) => {
                if (!cache.has(url)) {
                    cache.set(url, dataUrl);
                }
            },
        }}>
            {children}
        </AvatarCacheContext.Provider>
    );
}

export const useAvatarCache = () => {
    const context = useContext(AvatarCacheContext);
    if (!context) {
        throw new Error('useAvatarCache must be used within an AvatarCacheProvider');
    }
    return context;
}; 