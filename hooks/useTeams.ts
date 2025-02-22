import useSWR, { mutate } from 'swr';
import { teamApi } from '@/services/teamApi';
import { notificationService } from '@/services/notificationService';
import { notificationPreferencesService } from '@/services/notificationPreferencesService';
import { Team, CreateTeamInput, UpdateTeamInput, AddTeamMemberInput } from '@/lib/types/team';
import { useUser } from './useUser';
import { supabase } from '@/lib/supabase';

// Simplified cache keys
export const teamKeys = {
    all: () => ['teams'],
    userTeams: (userId?: string) => [...teamKeys.all(), 'user', userId],
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
            if (!userId) return [];
            const { data: teamMemberships, error: membershipError } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (membershipError) throw membershipError;
            if (!teamMemberships?.length) return [];

            const teamIds = teamMemberships.map(tm => tm.team_id);

            const { data: teams, error } = await supabase
                .from('teams')
                .select(`
                    *,
                    members:team_members(
                        id,
                        team_id,
                        user_id,
                        role,
                        created_at,
                        users(
                            supabase_uid,
                            email,
                            full_name
                        )
                    )
                `)
                .in('id', teamIds)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform the data to match our interface
            return teams.map(team => ({
                ...team,
                members: team.members.map((member: any) => ({
                    id: member.id,
                    team_id: member.team_id,
                    user_id: member.user_id,
                    role: member.role,
                    created_at: member.created_at,
                    user: {
                        id: member.users.supabase_uid,
                        email: member.users.email,
                        full_name: member.users.full_name
                    }
                }))
            }));
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