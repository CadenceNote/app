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
        supabase_uid: string;
        email: string;
        full_name: string;
    };
}

export const teamApi = {
    // Get all teams for the current user
    getUserTeams: async (): Promise<Team[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: teamMemberships, error: membershipError } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
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
                        supabase_uid,
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
                    id: member.users.supabase_uid,
                    email: member.users.email,
                    full_name: member.users.full_name
                }
            }))
        };

        return transformedData;
    },

    // Create a new team
    createTeam: async (data: CreateTeamInput): Promise<Team> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

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
                user_id: user.id,
                role: 'ADMIN'
            });

        if (memberError) throw memberError;

        return newTeam;
    },

    // Update a team
    updateTeam: async (teamId: number, data: UpdateTeamInput): Promise<Team> => {
        const { data: updated, error } = await supabase
            .from('teams')
            .update({
                name: data.name,
                description: data.description,
                updated_at: new Date().toISOString()
            })
            .eq('id', teamId)
            .select()
            .single();

        if (error) throw error;
        return updated;
    },

    // Delete a team (soft delete)
    deleteTeam: async (teamId: number): Promise<void> => {
        const { error } = await supabase
            .from('teams')
            .update({ is_active: false })
            .eq('id', teamId);

        if (error) throw error;
    },

    // Add a member to a team
    addTeamMember: async (teamId: number, data: AddTeamMemberInput): Promise<void> => {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('supabase_uid')
            .eq('email', data.email)
            .single();

        if (userError || !userData) {
            throw new Error('User not found');
        }

        const { error } = await supabase
            .from('team_members')
            .insert({
                team_id: teamId,
                user_id: userData.supabase_uid,
                role: data.role?.toUpperCase() || 'MEMBER'
            });

        if (error) throw error;
    },

    // Get team member role
    getTeamMemberRole: async (teamId: number): Promise<{ role: TeamRole }> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: teamMember, error } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', user.id)
            .single();

        if (error) throw error;
        return { role: teamMember.role as TeamRole };
    },

    getTeamNames: async (): Promise<{ team_names: string[] }> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { team_names: [] };

        const { data: teamMemberships, error: membershipError } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id);

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

    async inviteMember(teamId: number, email: string, role: TeamRole): Promise<void> {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('supabase_uid')
            .eq('email', email)
            .single();

        if (userError || !userData) {
            throw new Error('User not found');
        }

        const { error } = await supabase
            .from('team_members')
            .insert({
                team_id: teamId,
                user_id: userData.supabase_uid,
                role: role
            });

        if (error) throw error;
    },

    async removeMember(teamId: number, memberId: string): Promise<void> {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', memberId)
            .eq('team_id', teamId);

        if (error) throw error;
    },

    async updateMemberRole(teamId: number, memberId: string, role: TeamRole): Promise<void> {
        const { error } = await supabase
            .from('team_members')
            .update({ role })
            .eq('id', memberId)
            .eq('team_id', teamId);

        if (error) throw error;
    }
};