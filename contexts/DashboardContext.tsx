"use client"

import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { User } from '@/lib/types/auth';
import { supabase } from '@/lib/supabase';
import { teamApi } from '@/services/teamApi';
import { Building2 } from 'lucide-react';

// Interfaces
export interface Team {
    id: number;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string | null;
    is_active?: boolean;
}

export interface ProcessedTeamItem {
    title: string;
    url: string;
    icon: typeof Building2;
}

// State interface
interface DashboardState {
    user: User | null;
    teams: Team[];
    processedTeams: ProcessedTeamItem[];
    sidebarState: {
        isCollapsed: boolean;
        lastTeamId: number | null;
    };
}

// Action interface
type DashboardAction =
    | { type: 'SET_USER'; payload: User | null }
    | { type: 'SET_TEAMS'; payload: Team[] }
    | { type: 'SET_SIDEBAR_STATE'; payload: { isCollapsed: boolean; lastTeamId: number | null } }
    | { type: 'INITIALIZE'; payload: { user: User | null; teams: Team[]; sidebarState?: { isCollapsed: boolean; lastTeamId: number | null } } };

// Initial state with default collapsed sidebar for SSR
const defaultSidebarState = { isCollapsed: false, lastTeamId: null };

// Get initial sidebar state, defaulting to expanded for SSR
const getInitialSidebarState = () => {
    if (typeof window === 'undefined') return defaultSidebarState;

    try {
        const saved = localStorage.getItem('dashboard_sidebar_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                isCollapsed: parsed.isCollapsed ?? false,
                lastTeamId: parsed.lastTeamId ?? null
            };
        }
        return defaultSidebarState;
    } catch (e) {
        console.error('Error reading sidebar state from localStorage:', e);
        return defaultSidebarState;
    }
};

// Initial state
const initialState: DashboardState = {
    user: null,
    teams: [],
    processedTeams: [],
    sidebarState: defaultSidebarState // Always start with collapsed for SSR
};

// Create context
const DashboardContext = createContext<{
    state: DashboardState;
    dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

// Reducer function
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload };
        case 'SET_TEAMS':
            return {
                ...state,
                teams: action.payload,
                processedTeams: action.payload.map(team => ({
                    title: team.name,
                    url: `/dashboard/${team.id}`,
                    icon: Building2,
                }))
            };
        case 'SET_SIDEBAR_STATE':
            if (typeof window !== 'undefined') {
                localStorage.setItem('dashboard_sidebar_state', JSON.stringify(action.payload));
            }
            return {
                ...state,
                sidebarState: action.payload
            };
        case 'INITIALIZE':
            return {
                ...state,
                user: action.payload.user,
                teams: action.payload.teams,
                processedTeams: action.payload.teams.map(team => ({
                    title: team.name,
                    url: `/dashboard/${team.id}`,
                    icon: Building2,
                })),
                sidebarState: action.payload.sidebarState || state.sidebarState
            };
        default:
            return state;
    }
}

// Provider component
export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(dashboardReducer, initialState);

    // Initialize data and handle client-side state
    useEffect(() => {
        const initializeData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const teams = await teamApi.getUserTeams();
                const savedState = getInitialSidebarState(); // Get saved state only on client
                dispatch({
                    type: 'INITIALIZE',
                    payload: {
                        user,
                        teams,
                        sidebarState: savedState
                    }
                });
            }
        };

        initializeData();

        // Auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const teams = await teamApi.getUserTeams();
                dispatch({
                    type: 'INITIALIZE',
                    payload: {
                        user: session.user,
                        teams,
                        sidebarState: state.sidebarState
                    }
                });
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const value = useMemo(() => ({ state, dispatch }), [state]);

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

// Custom hook
export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within DashboardProvider');
    }

    return {
        ...context.state,
        updateTeams: async () => {
            const teams = await teamApi.getUserTeams();
            context.dispatch({ type: 'SET_TEAMS', payload: teams });
        },
        setSidebarState: (state: { isCollapsed: boolean; lastTeamId: number | null }) => {
            context.dispatch({ type: 'SET_SIDEBAR_STATE', payload: state });
        }
    };
} 