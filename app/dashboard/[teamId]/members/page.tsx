'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTeams } from '@/hooks/useTeams';
import { TeamMember } from '@/lib/types/team';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type TeamRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

interface TeamMemberWithUser extends TeamMember {
    user: {
        id: string;
        email: string;
        full_name: string;
    };
}

export default function MembersPage() {
    const params = useParams();
    const teamId = params?.teamId as string;
    const { teams, addTeamMember, mutateTeams } = useTeams();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<TeamRole>('MEMBER');
    const { toast } = useToast();

    const currentTeam = teams.find(team => team.id === Number(teamId));
    console.log(currentTeam)
    const members = currentTeam?.members || [];

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addTeamMember(Number(teamId), inviteEmail, { role: inviteRole });
            toast({
                title: 'Success',
                description: `Invitation sent to ${inviteEmail}`,
            });
            setIsInviteOpen(false);
            setInviteEmail('');
            setInviteRole('MEMBER');
        } catch (error) {
            console.error('Error inviting member:', error);
            toast({
                title: 'Error',
                description: 'Failed to invite member. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleUpdateRole = async (memberId: number, newRole: TeamRole) => {
        try {
            await fetch(`/api/teams/${teamId}/members/${memberId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            mutateTeams();
            toast({
                title: 'Success',
                description: 'Member role updated successfully',
            });
        } catch (error) {
            console.error('Error updating role:', error);
            toast({
                title: 'Error',
                description: 'Failed to update member role',
                variant: 'destructive',
            });
        }
    };

    const handleRemoveMember = async (memberId: number) => {
        try {
            await fetch(`/api/teams/${teamId}/members/${memberId}`, {
                method: 'DELETE',
            });
            mutateTeams();
            toast({
                title: 'Success',
                description: 'Member removed successfully',
            });
        } catch (error) {
            console.error('Error removing member:', error);
            toast({
                title: 'Error',
                description: 'Failed to remove member',
                variant: 'destructive',
            });
        }
    };

    if (!currentTeam) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-muted-foreground">Team not found</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                        Manage your team members and their roles
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">
                            {members.length} Members
                        </h2>
                        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                            <DialogTrigger asChild>
                                <Button>Invite Member</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Invite New Member</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleInviteMember} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="Enter email address"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                            value={inviteRole}
                                            onValueChange={(value: TeamRole) => setInviteRole(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                <SelectItem value="MEMBER">Member</SelectItem>
                                                <SelectItem value="VIEWER">Viewer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="submit" className="w-full">
                                        Send Invitation
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member: TeamMemberWithUser) => (
                                <TableRow key={member.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <UserAvatar
                                            userId={member.user_id}
                                            name={member.user.full_name}
                                        />
                                        <span>{member.user.full_name}</span>
                                    </TableCell>
                                    <TableCell>{member.user.email}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={member.role}
                                            onValueChange={(newRole: TeamRole) =>
                                                handleUpdateRole(member.id, newRole)
                                            }
                                        >
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                <SelectItem value="MEMBER">Member</SelectItem>
                                                <SelectItem value="VIEWER">Viewer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    •••
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                >
                                                    Remove Member
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
