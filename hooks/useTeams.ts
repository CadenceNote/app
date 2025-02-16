import useSWR, { mutate } from 'swr';
import { teamApi } from '@/services/teamApi';
import { notificationService } from '@/services/notificationService';
import { notificationPreferencesService } from '@/services/notificationPreferencesService';
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
    const createTeam = async (newTeam: CreateTeamInput) => {
        try {
            const team = await teamApi.createTeam(newTeam);
            if (team && user) {
                // Create default notification preferences for the team
                await notificationPreferencesService.createDefaultTeamPreferences(team.id);
            }
            mutate(['teams']);
            return team;
        } catch (error) {
            console.error('Error creating team:', error);
            throw error;
        }
    };

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
    const addTeamMember = async (teamId: number, userId: string, userData: any) => {
        try {
            const result = await teamApi.addTeamMember(teamId, userId);
            if (result) {
                // Create default notification preferences for the new member
                await notificationPreferencesService.createDefaultUserPreferences(userId);

                // Notify team about new member
                await notificationService.notifyTeamMemberJoined(
                    teamId,
                    userId,
                    userData.full_name || userData.email
                );
            }
            mutate(['team-members', teamId]);
            return result;
        } catch (error) {
            console.error('Error adding team member:', error);
            throw error;
        }
    };

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