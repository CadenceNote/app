// components/dashboard/TeamCard.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    MoreVertical,
    Users,
    ArrowRight,
    Edit,
    Trash2,
    UserPlus,
    Calendar,
    ListTodo
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Team, teamApi } from '@/services/teamApi';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/common/UserAvatar";

interface TeamCardProps {
    team: Team;
    onUpdate: () => void;
}

export function TeamCard({ team, onUpdate }: TeamCardProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
    const [isViewMembersDialogOpen, setIsViewMembersDialogOpen] = useState(false);
    const [editData, setEditData] = useState({ name: team.name, description: team.description });
    const [newMemberData, setNewMemberData] = useState({ email: '', role: 'member' as const });
    const [isLoading, setIsLoading] = useState(false);

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            await teamApi.updateTeam(team.id, editData);
            onUpdate();
            setIsEditDialogOpen(false);
            toast({
                title: "Success",
                description: "Team updated successfully!",
            });
        } catch (error) {
            console.error('Error updating team:', error);
            toast({
                title: "Error",
                description: "Failed to update team. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this team?')) {
            try {
                setIsLoading(true);
                await teamApi.deleteTeam(team.id);
                onUpdate();
                toast({
                    title: "Success",
                    description: "Team deleted successfully!",
                });
            } catch (error) {
                console.error('Error deleting team:', error);
                toast({
                    title: "Error",
                    description: "Failed to delete team. Please try again.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            await teamApi.addTeamMember(team.id, newMemberData);
            setIsAddMemberDialogOpen(false);
            setNewMemberData({ email: '', role: 'member' });
            onUpdate();
            toast({
                title: "Member added",
                description: "Team member added successfully! They can now access the team.",
            });
        } catch (error: any) {
            // Handle authentication errors
            if (error.response?.status === 401) {
                toast({
                    title: "Authentication required",
                    description: "Your session has expired. Please log in again.",
                    variant: "destructive"
                });
                // Optionally redirect to login page
                router.push('/login');
                return;
            }

            // Get the error message from the response
            const errorMessage = error.response?.data?.message;

            // Handle different error cases based on the message
            if (errorMessage?.includes("already a member")) {
                toast({
                    title: "Already a member",
                    description: "This user is already a member of the team.",
                    variant: "destructive"
                });
            } else if (errorMessage?.includes("User not found")) {
                toast({
                    title: "User not found",
                    description: "This email is not registered. Ask them to sign up first.",
                    variant: "destructive"
                });
            } else if (errorMessage?.includes("cannot add yourself")) {
                toast({
                    title: "Invalid invitation",
                    description: "You cannot add yourself as a team member.",
                    variant: "destructive"
                });
            } else {
                // Unexpected error
                toast({
                    title: "Error",
                    description: "An unexpected error occurred. Please try again.",
                    variant: "destructive"
                });
            }
        } finally {
            setIsLoading(false);
        }
    };
    const handleQuickAccess = (route: string) => {
        router.push(`/dashboard/${team.id}/${route}`);
    };

    // Get member count correctly from the team object
    const memberCount = team.members?.length || 0;

    return (
        <>
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            <CardTitle>{team.name}</CardTitle>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsViewMembersDialogOpen(true)}>
                                    <Users className="h-4 w-4 mr-2" />
                                    View Members
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsAddMemberDialogOpen(true)}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Member
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Team
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleQuickAccess('meetings')}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Meetings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleQuickAccess('tasks')}>
                                    <ListTodo className="h-4 w-4 mr-2" />
                                    Tasks
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="text-red-600"
                                    disabled={isLoading}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Team
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <CardDescription>
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{team.description || 'No description provided'}</p>
                    <div className="space-y-2">
                        <Button
                            className="w-full"
                            onClick={() => router.push(`/dashboard/${team.id}`)}
                        >
                            View Dashboard
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleQuickAccess('meetings')}
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Meetings
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleQuickAccess('tasks')}
                            >
                                <ListTodo className="h-4 w-4 mr-2" />
                                Tasks
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Team Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Team</DialogTitle>
                        <DialogDescription>
                            Update your team's information.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="text-sm font-medium">
                                Team Name
                            </label>
                            <Input
                                id="name"
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
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
                                value={editData.description}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                placeholder="Enter team description"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Member Dialog */}
            <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                            Enter the email address of the user you want to add to the team.
                            Make sure they have already signed up for an account.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddMember} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="text-sm font-medium">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={newMemberData.email}
                                onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                                placeholder="Enter member's email"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="role" className="text-sm font-medium">
                                Role
                            </label>
                            <Select
                                value={newMemberData.role}
                                onValueChange={(value: 'member' | 'admin' | 'meeting_manager') =>
                                    setNewMemberData({ ...newMemberData, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="meeting_manager">Meeting Manager</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-gray-500 mt-1">
                                {newMemberData.role === 'admin' && 'Admins can manage team settings and members'}
                                {newMemberData.role === 'meeting_manager' && 'Meeting managers can create and manage meetings'}
                                {newMemberData.role === 'member' && 'Members can participate in meetings and tasks'}
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Adding...' : 'Add Member'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Members Dialog */}
            <Dialog open={isViewMembersDialogOpen} onOpenChange={setIsViewMembersDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Team Members</DialogTitle>
                        <DialogDescription>
                            Members of {team.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {team.members && team.members.length > 0 ? (
                            team.members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar name={member.user.full_name} />
                                        <div>
                                            <div className="font-medium">{member.user.full_name}</div>
                                            <div className="text-sm text-gray-500">{member.user.email}</div>
                                        </div>
                                    </div>
                                    <span className={`text-sm px-2 py-1 rounded-full ${member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                        member.role === 'meeting_manager' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {member.role.replace('_', ' ')}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                No members yet. Add members to start collaborating.
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddMemberDialogOpen(true)}
                                className="w-full"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add New Member
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}