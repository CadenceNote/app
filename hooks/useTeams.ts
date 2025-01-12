import { useState, useEffect } from 'react';
import { teamApi } from '@/services/teamApi';
import { Team, CreateTeamInput, UpdateTeamInput, AddTeamMemberInput } from '@/lib/types/team';
import { useToast } from '@/hooks/use-toast';

export function useTeams() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const loadTeams = async () => {
        try {
            setIsLoading(true);
            const data = await teamApi.getUserTeams();
            setTeams(data);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load teams';
            setError(message);
            toast({
                title: "Error",
                description: message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const createTeam = async (data: CreateTeamInput) => {
        try {
            const newTeam = await teamApi.createTeam(data);
            setTeams(prev => [...prev, newTeam]);
            toast({
                title: "Success",
                description: "Team created successfully!"
            });
            return newTeam;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create team';
            toast({
                title: "Error",
                description: message,
                variant: "destructive"
            });
            throw err;
        }
    };

    const updateTeam = async (teamId: number, data: UpdateTeamInput) => {
        try {
            const updatedTeam = await teamApi.updateTeam(teamId, data);
            setTeams(prev => prev.map(team =>
                team.id === teamId ? updatedTeam : team
            ));
            toast({
                title: "Success",
                description: "Team updated successfully!"
            });
            return updatedTeam;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update team';
            toast({
                title: "Error",
                description: message,
                variant: "destructive"
            });
            throw err;
        }
    };

    const deleteTeam = async (teamId: number) => {
        try {
            await teamApi.deleteTeam(teamId);
            setTeams(prev => prev.filter(team => team.id !== teamId));
            toast({
                title: "Success",
                description: "Team deleted successfully!"
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete team';
            toast({
                title: "Error",
                description: message,
                variant: "destructive"
            });
            throw err;
        }
    };

    const addTeamMember = async (teamId: number, data: AddTeamMemberInput) => {
        try {
            const updatedTeam = await teamApi.addTeamMember(teamId, data);
            setTeams(prev => prev.map(team =>
                team.id === teamId ? updatedTeam : team
            ));
            toast({
                title: "Success",
                description: "Team member added successfully!"
            });
            return updatedTeam;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add team member';
            toast({
                title: "Error",
                description: message,
                variant: "destructive"
            });
            throw err;
        }
    };

    // Load teams on component mount
    useEffect(() => {
        loadTeams();
    }, []);

    return {
        teams,
        isLoading,
        error,
        loadTeams,
        createTeam,
        updateTeam,
        deleteTeam,
        addTeamMember
    };
}