import useSWR, { mutate } from 'swr';
import { teamApi } from '@/services/teamApi';
import { Team, CreateTeamInput, UpdateTeamInput, AddTeamMemberInput } from '@/lib/types/team';
import { useUser } from './useUser';

// Simplified cache keys
export const teamKeys = {
    all: () => ['teams'],
    userTeams: (userId?: number) => [...teamKeys.all(), 'user', userId],
    teamDetail: (teamId?: number) => [...teamKeys.all(), 'detail', teamId],
};

export function useTeams() {
    const { user } = useUser();
    const userId = user?.id;

    // Main teams query with proper typing
    const {
        data: teams = [],
        isLoading,
        error: teamsError,
        mutate: mutateTeams
    } = useSWR<Team[]>(
        teamKeys.userTeams(userId),
        async () => {
            const teams = await teamApi.getUserTeams(userId);
            return teams;
        },
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 0,
            shouldRetryOnError: false,
            revalidateIfStale: true,
            revalidateOnMount: true
        }
    );

    // Unified mutation handler
    const handleMutation = async <T>({
        operation,
        teamId,
        data,
        optimisticUpdate,
    }: {
        operation: () => Promise<T>;
        teamId?: number;
        data?: any;
        optimisticUpdate?: (current: Team[]) => Team[];
    }) => {
        if (!userId) return;

        try {
            // Optimistic update
            if (optimisticUpdate) {
                await mutateTeams(optimisticUpdate, false);
            }

            // Perform operation
            const result = await operation();

            // Revalidate relevant queries
            const revalidation = [];
            if (teamId) revalidation.push(mutate(teamKeys.teamDetail(teamId)));
            revalidation.push(mutateTeams());

            await Promise.all(revalidation);
            return result;
        } catch (error) {
            // Rollback on error
            await mutateTeams();
            throw error;
        }
    };

    // Create team
    const createTeam = (newTeam: CreateTeamInput) =>
        handleMutation({
            operation: () => teamApi.createTeam(newTeam),
            optimisticUpdate: (current) => [
                ...current,
                { ...newTeam, id: Date.now(), members: [] } as Team // Temporary ID
            ],
        });

    // Update team
    const updateTeam = (teamId: number, data: UpdateTeamInput) =>
        handleMutation({
            teamId,
            operation: () => teamApi.updateTeam(teamId, data),
            optimisticUpdate: (current) =>
                current.map(team =>
                    team.id === teamId ? { ...team, ...data } : team
                ),
        });

    // Delete team
    const deleteTeam = (teamId: number) =>
        handleMutation({
            teamId,
            operation: () => teamApi.deleteTeam(teamId),
            optimisticUpdate: (current) =>
                current.filter(team => team.id !== teamId),
        });

    // Add team member
    const addTeamMember = (teamId: number, data: AddTeamMemberInput) =>
        handleMutation({
            teamId,
            operation: () => teamApi.addTeamMember(teamId, data),
            optimisticUpdate: (current) =>
                current.map(team =>
                    team.id === teamId ? {
                        ...team,
                        members: [...(team.members || []), data]
                    } : team
                ),
        });

    return {
        teams,
        teamsError,
        isLoading,
        createTeam,
        updateTeam,
        deleteTeam,
        addTeamMember,
        mutateTeams
    };
}