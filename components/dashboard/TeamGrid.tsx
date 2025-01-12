// components/dashboard/TeamGrid.tsx
'use client';

import { useState } from 'react';
import { TeamCard } from '@/components/dashboard/TeamCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTeams } from '@/hooks/useTeams';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function TeamGrid() {
    const {
        teams,
        isLoading,
        error,
        createTeam,
        loadTeams
    } = useTeams();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newTeamData, setNewTeamData] = useState({ name: '', description: '' });

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTeam(newTeamData);
            setIsCreateDialogOpen(false);
            setNewTeamData({ name: '', description: '' });
        } catch (error) {
            // Error is handled by the useTeams hook
            console.error('Error creating team:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold">My Teams</h2>
                    <p className="text-gray-600">Manage your team workspaces</p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Team
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                    <TeamCard
                        key={team.id}
                        team={team}
                        onUpdate={loadTeams}
                    />
                ))}
                {teams.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">No teams found. Create your first team to get started!</p>
                    </div>
                )}
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Team</DialogTitle>
                        <DialogDescription>
                            Create a new team to collaborate with your colleagues.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTeam} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="text-sm font-medium">
                                Team Name
                            </label>
                            <Input
                                id="name"
                                value={newTeamData.name}
                                onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                                placeholder="Enter team name"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="text-sm font-medium">
                                Description
                            </label>
                            <Textarea
                                id="description"
                                value={newTeamData.description}
                                onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
                                placeholder="Enter team description"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Create Team</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}