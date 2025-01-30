"use client"

import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { User } from '@/lib/types/auth';
import { supabase } from '@/lib/supabase';
import { teamApi } from '@/services/teamApi';

export interface Team {
    id: number;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string | null;
    is_active?: boolean;
}

interface DashboardContextType {
    user: User | null;
    teams: Team[];
    isLoading: boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user?.id) {
                    const userTeams = await teamApi.getUserTeams();
                    if (userTeams && Array.isArray(userTeams)) {
                        setTeams(userTeams);
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                fetchData();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setTeams([]);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        user,
        teams,
        isLoading
    }), [user, teams, isLoading]);

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}; 