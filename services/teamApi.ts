import api from './api';
import { Team, CreateTeamInput, UpdateTeamInput, AddTeamMemberInput, TeamRole } from '@/lib/types/team';

import { supabase } from '@/lib/supabase';

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
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get a specific team's details
    getTeam: async (teamId: number): Promise<Team> => {
        const response = await api.get(`/teams/${teamId}/`);
        return response.data;
    },

    // Create a new team
    createTeam: async (data: CreateTeamInput): Promise<Team> => {
        const response = await api.post('/teams/create/', data);
        return response.data;
    },

    // Update a team
    updateTeam: async (teamId: number, data: UpdateTeamInput): Promise<Team> => {
        const response = await api.put(`/teams/${teamId}/update/`, data);
        return response.data;
    },

    // Delete a team
    deleteTeam: async (teamId: number): Promise<void> => {
        await api.delete(`/teams/${teamId}/delete/`);
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
            .in('id', teamIds || []);

        if (teamsError) {
            throw teamsError;
        }

        const teamNames = teams?.map(team => team.name) || [];

        return { team_names: teamNames };
    }
};