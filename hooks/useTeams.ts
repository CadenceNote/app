import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '@/services/teamApi';
import { Team, CreateTeamInput, UpdateTeamInput, AddTeamMemberInput } from '@/lib/types/team';
import { useUser } from './useUser';

// Query keys
export const teamKeys = {
    all: ['teams'] as const,
    lists: () => [...teamKeys.all, 'list'] as const,
    list: (userId: number) => [...teamKeys.lists(), { userId }] as const,
    details: () => [...teamKeys.all, 'detail'] as const,
    detail: (id: number) => [...teamKeys.details(), id] as const,
};

export function useTeams() {
    const queryClient = useQueryClient();
    const { user } = useUser();


    // Pre-fetch check of cached data
    const cachedData = queryClient.getQueryData(teamKeys.list(user?.id as number));

    // Fetch teams query
    const {
        data: teams = [],
        isLoading,
        error,
        isFetching,
        isRefetching,
    } = useQuery({
        queryKey: teamKeys.list(user?.id as number),
        queryFn: async () => {
            const result = await teamApi.getUserTeams(user?.id as number);
            return result;
        },
        enabled: !!user?.id,
        staleTime: Infinity, // Never consider data stale automatically
        gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        placeholderData: keepPreviousData => {
            return keepPreviousData ?? [];
        },
    });


    // Create team mutation
    const createTeam = useMutation({
        mutationFn: (newTeam: CreateTeamInput) => teamApi.createTeam(newTeam),
        onSuccess: async () => {
            // Invalidate and refetch teams list
            await queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
            // Force an immediate refetch
            await queryClient.refetchQueries({ queryKey: teamKeys.lists() });
        },
    });

    // Update team mutation
    const updateTeam = useMutation({
        mutationFn: ({ teamId, data }: { teamId: number; data: UpdateTeamInput }) =>
            teamApi.updateTeam(teamId, data),
        onSuccess: (_, { teamId }) => {
            queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
            queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
        },
    });

    // Delete team mutation
    const deleteTeam = useMutation({
        mutationFn: (teamId: number) => teamApi.deleteTeam(teamId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
        },
    });

    // Add team member mutation
    const addTeamMember = useMutation({
        mutationFn: ({ teamId, data }: { teamId: number; data: AddTeamMemberInput }) =>
            teamApi.addTeamMember(teamId, data),
        onSuccess: (_, { teamId }) => {
            queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
            queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
        },
    });

    return {
        teams,
        isLoading,
        isFetching,
        error,
        createTeam,
        updateTeam,
        deleteTeam,
        addTeamMember,
    };
}