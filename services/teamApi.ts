import api from './api';
import { Team, CreateTeamInput, UpdateTeamInput, AddTeamMemberInput } from '@/lib/types/team';

export const teamApi = {
    // Get all teams for the current user
    getUserTeams: async (): Promise<Team[]> => {
        const response = await api.get('/teams/');
        return response.data.teams;
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
    }
};