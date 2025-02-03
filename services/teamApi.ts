import api from './api';
import { Team, CreateTeamInput, UpdateTeamInput, AddTeamMemberInput, TeamRole } from '@/lib/types/team';

import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
interface TeamMemberFromDB {
    id: string;
    team_id: number;
    user_id: string;
    role: string;
    created_at: string;
    users: {
        id: string;
        email: string;
        full_name: string;
    };
}

export const teamApi = {
    // Get all teams for the current user
    getUserTeams: async (userId: number): Promise<Team[]> => {

        if (!userId) return [];

        const { data: teamMemberships, error: membershipError } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (membershipError) {
            throw membershipError;
        }

        if (!teamMemberships?.length) return [];

        const teamIds = teamMemberships.map(tm => tm.team_id);

        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .in('id', teamIds)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get a specific team's details
    getTeam: async (teamId: number): Promise<Team> => {
        const { data, error } = await supabase
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
                        id,
                        email,
                        full_name
                    )
                )
            `)
            .eq('id', teamId)
            .single();

        if (error) throw error;

        // Transform the data to match our interface
        const transformedData = {
            ...data,
            members: data.members.map((member: TeamMemberFromDB) => ({
                id: member.id,
                team_id: member.team_id,
                user_id: member.user_id,
                role: member.role,
                created_at: member.created_at,
                user: {
                    id: member.users.id,
                    email: member.users.email,
                    full_name: member.users.full_name
                }
            }))
        };

        return transformedData;
    },

    // Create a new team
    createTeam: async (data: CreateTeamInput & { userId: string }): Promise<Team> => {
        const { data: newTeam, error } = await supabase
            .from('teams')
            .insert({
                name: data.name,
                description: data.description,
                is_active: true,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Add the creator as an admin member
        const { error: memberError } = await supabase
            .from('team_members')
            .insert({
                team_id: newTeam.id,
                user_id: data.userId,
                role: 'ADMIN'
            });

        if (memberError) throw memberError;

        return newTeam;
    },

    // Update a team
    updateTeam: async (teamId: number, data: UpdateTeamInput): Promise<Team> => {
        const response = await api.put(`/teams/${teamId}/update/`, data);
        return response.data;
    },

    // Delete a team
    deleteTeam: async (teamId: number): Promise<void> => {
        await supabase.from('teams').update({ is_active: false }).eq('id', teamId);
    },

    // Add a member to a team
    addTeamMember: async (teamId: number, data: AddTeamMemberInput): Promise<Team> => {
        // Format the role to uppercase for the backend enum
        const formattedData = {
            ...data,
            role: data.role?.toUpperCase() || 'MEMBER'
        };
        const response = await api.post(`/teams/${teamId}/members/`, formattedData);
        return response.data;
    },

    // Get team member role
    getTeamMemberRole: async (teamId: number): Promise<{ role: TeamRole }> => {
        const response = await api.get(`/teams/${teamId}/member-role/`);
        return response.data;
    },
    getTeamNames: async (): Promise<{ team_names: string[] }> => {
        const { data: teamMemberships, error: membershipError } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (membershipError) {
            throw membershipError;
        }

        const teamIds = teamMemberships?.map(tm => tm.team_id);

        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('name')
            .in('id', teamIds || [])
            .eq('is_active', true);

        if (teamsError) {
            throw teamsError;
        }

        const teamNames = teams?.map(team => team.name) || [];

        return { team_names: teamNames };
    },

    async inviteMember(teamId: number, email: string, role: 'ADMIN' | 'MEETING_MANAGER' | 'MEMBER') {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (userError || !userData) {
            throw new Error('User not found');
        }

        const { error } = await supabase
            .from('team_members')
            .insert({
                team_id: teamId,
                user_id: userData.id,
                role: role
            });

        if (error) throw error;
    },

    async removeMember(teamId: number, memberId: string) {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', memberId)
            .eq('team_id', teamId);

        if (error) throw error;
    },

    async updateMemberRole(teamId: number, memberId: string, role: 'ADMIN' | 'MEETING_MANAGER' | 'MEMBER') {
        const { error } = await supabase
            .from('team_members')
            .update({ role })
            .eq('id', memberId)
            .eq('team_id', teamId);

        if (error) throw error;
    }
};