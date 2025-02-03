/*
* Team Settings Page
* 
* This page displays the settings for a team.
* It includes team management, notifications, and integrations settings.
*/
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Plus, Bell, Settings, Trash2, X, AtSign, Check,
    AlertCircle, Users, Mail, Shield, Globe, Zap,
    UserPlus, UserMinus, Edit2, Save, Copy, ExternalLink, ArrowLeft,
    Slack, Github, Calendar
} from 'lucide-react';
import { teamApi } from '@/services/teamApi';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";

interface TeamMember {
    id: string;
    team_id: number;
    user_id: string;
    role: 'ADMIN' | 'MEETING_MANAGER' | 'MEMBER';
    created_at: string;
    user: {
        id: string;
        email: string;
        full_name: string;
    };

}

interface Team {
    id: number;
    name: string;
    description: string;
    members: TeamMember[];
    created_at: string;
    invite_code?: string;
}

interface NotificationSetting {
    id: string;
    type: string;
    description: string;
    email: boolean;
    push: boolean;
    inApp: boolean;
}

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: string;
    connected: boolean;
    status: 'active' | 'inactive' | 'pending';
}

export default function TeamSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = parseInt(params.teamId as string);
    const { user } = useUser();
    const { toast } = useToast();
    const [team, setTeam] = useState<Team | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTeam, setEditedTeam] = useState<Partial<Team>>({});
    const [inviteEmail, setInviteEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEETING_MANAGER' | 'MEMBER'>('MEMBER');

    const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
        {
            id: '1',
            type: 'New Task Assignments',
            description: 'When you are assigned to a new task',
            email: true,

            push: true,
            inApp: true,
        },
        {
            id: '2',
            type: 'Meeting Invites',
            description: 'When you are invited to a meeting',
            email: true,
            push: true,
            inApp: true,
        },
        {
            id: '3',
            type: 'Task Updates',
            description: 'When a task you are assigned to is updated',
            email: false,
            push: true,
            inApp: true,
        },
        {
            id: '4',
            type: 'Team Updates',
            description: 'When team information or settings are changed',
            email: true,
            push: false,
            inApp: true,
        },
    ]);

    const [integrations, setIntegrations] = useState<Integration[]>([
        {
            id: '1',
            name: 'Slack',
            description: 'Get notifications and updates in your Slack workspace',
            icon: 'slack',
            connected: false,
            status: 'inactive',
        },
        {
            id: '2',
            name: 'GitHub',
            description: 'Sync tasks with GitHub issues and pull requests',
            icon: 'github',
            connected: true,
            status: 'active',
        },
        {
            id: '3',
            name: 'Google Calendar',
            description: 'Sync meetings with your Google Calendar',
            icon: 'calendar',
            connected: true,
            status: 'active',
        },
    ]);

    useEffect(() => {
        const loadTeam = async () => {
            try {
                const teamData = await teamApi.getTeam(teamId);
                setTeam(teamData);
                setEditedTeam(teamData);
            } catch (error) {
                console.error('Failed to load team data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load team data. Please try again.",
                    variant: "destructive",
                });
            }
        };

        if (teamId) {
            loadTeam();
        }
    }, [teamId]);

    const handleTeamUpdate = async () => {
        try {
            await teamApi.updateTeam(teamId, editedTeam);
            setTeam({ ...team, ...editedTeam } as Team);
            setIsEditing(false);
            toast({
                title: "Success",
                description: "Team settings updated successfully.",
            });
        } catch (error) {
            console.error('Failed to update team:', error);
            toast({
                title: "Error",
                description: "Failed to update team settings. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleMemberInvite = async () => {
        try {
            await teamApi.inviteMember(teamId, inviteEmail, selectedRole);
            setInviteEmail('');
            toast({
                title: "Success",
                description: `Invitation sent to ${inviteEmail}`,
            });
        } catch (error) {
            console.error('Failed to invite member:', error);
            toast({
                title: "Error",
                description: "Failed to send invitation. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleMemberRemove = async (memberId: string) => {
        try {
            await teamApi.removeMember(teamId, memberId);
            setTeam({
                ...team!,
                members: team!.members.filter(m => m.id !== memberId)
            });
            toast({
                title: "Success",
                description: "Team member removed successfully.",
            });
        } catch (error) {
            console.error('Failed to remove member:', error);
            toast({
                title: "Error",
                description: "Failed to remove team member. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleNotificationSettingChange = (settingId: string, channel: 'email' | 'push' | 'inApp', value: boolean) => {
        setNotificationSettings(settings =>
            settings.map(setting =>
                setting.id === settingId
                    ? { ...setting, [channel]: value }
                    : setting
            )
        );
    };

    const handleIntegrationToggle = async (integrationId: string) => {
        setIntegrations(integrations =>
            integrations.map(integration =>
                integration.id === integrationId
                    ? {
                        ...integration,
                        connected: !integration.connected,
                        status: !integration.connected ? 'active' : 'inactive'
                    }
                    : integration
            )
        );
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/invite/${team?.invite_code}`);
        toast({
            title: "Success",
            description: "Invite link copied to clipboard.",
        });
    };

    const navigateToDashboard = () => {
        router.push(`/dashboard/${teamId}`);
    };

    const handleTeamDelete = async () => {
        try {
            await teamApi.deleteTeam(teamId);
            toast({
                title: "Success",
                description: "Team deleted successfully."
            });
            router.push('/dashboard');
        } catch (error) {
            console.error('Failed to delete team:', error);
            toast({
                title: "Error",
                description: "Failed to delete team. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">Team Settings</h1>
                    <p className="text-muted-foreground">Manage your team settings and preferences</p>
                </div>
                <Button variant="outline" onClick={navigateToDashboard}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Information</CardTitle>
                                <CardDescription>Update your team&apos;s basic information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="teamName">Team Name</Label>
                                        <Input
                                            id="teamName"
                                            value={editedTeam.name || ''}
                                            onChange={(e) => setEditedTeam({ ...editedTeam, name: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="teamDescription">Description</Label>
                                        <Textarea
                                            id="teamDescription"
                                            value={editedTeam.description || ''}
                                            onChange={(e) => setEditedTeam({ ...editedTeam, description: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        {isEditing ? (
                                            <>
                                                <Button variant="outline" onClick={() => setIsEditing(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleTeamUpdate}>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Save Changes
                                                </Button>
                                            </>
                                        ) : (
                                            <Button onClick={() => setIsEditing(true)}>
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Edit Team
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Members Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Members</CardTitle>
                                <CardDescription>Manage your team members and their roles</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 mb-6">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Enter email address"
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                    <Select value={selectedRole} onValueChange={(value: 'ADMIN' | 'MEETING_MANAGER' | 'MEMBER') => setSelectedRole(value)}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                            <SelectItem value="MEETING_MANAGER">Meeting Manager</SelectItem>
                                            <SelectItem value="MEMBER">Member</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button onClick={handleMemberInvite}>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Invite
                                    </Button>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg mb-6">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-blue-900">Invite Link</h4>
                                        <p className="text-sm text-blue-700">Share this link to invite people to your team</p>
                                    </div>
                                    <Button variant="outline" onClick={copyInviteLink}>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Link
                                    </Button>
                                </div>
                                {/* Members List */}
                                <div className="space-y-4">
                                    {team?.members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent"
                                        >
                                            <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarFallback>
                                                        {member.user.full_name?.split(' ').map(n => n[0]).join('') || member.user.email[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.user.full_name || 'Unnamed User'}</p>
                                                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={cn(
                                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                    member.role === "ADMIN" && "bg-purple-50 text-purple-700 ring-purple-600/20",
                                                    member.role === "MEETING_MANAGER" && "bg-blue-50 text-blue-700 ring-blue-600/20",
                                                    member.role === "MEMBER" && "bg-green-50 text-green-700 ring-green-600/20"

                                                )}>
                                                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                                </span>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <Settings className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem>Change Role</DropdownMenuItem>
                                                        <DropdownMenuItem>View Activity</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleMemberRemove(member.id)}
                                                        >
                                                            Remove Member
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Danger Zone */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-red-900 font-medium mb-2">Delete Team</h4>
                                    <p className="text-red-700 text-sm mb-4">
                                        Once you delete a team, there is no going back. Please be certain.
                                    </p>
                                    <Button variant="destructive" onClick={handleTeamDelete}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Team
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Choose how and when you want to be notified</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {notificationSettings.map((setting) => (
                                    <div key={setting.id} className="flex items-start justify-between p-4 rounded-lg border">
                                        <div className="space-y-1">
                                            <h4 className="font-medium">{setting.type}</h4>
                                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="flex flex-col items-center gap-2">
                                                <Label htmlFor={`${setting.id}-email`} className="text-sm">Email</Label>
                                                <Switch
                                                    id={`${setting.id}-email`}
                                                    checked={setting.email}
                                                    onCheckedChange={(checked) =>
                                                        handleNotificationSettingChange(setting.id, 'email', checked)
                                                    }
                                                />
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <Label htmlFor={`${setting.id}-push`} className="text-sm">Push</Label>
                                                <Switch
                                                    id={`${setting.id}-push`}
                                                    checked={setting.push}
                                                    onCheckedChange={(checked) =>
                                                        handleNotificationSettingChange(setting.id, 'push', checked)
                                                    }
                                                />
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <Label htmlFor={`${setting.id}-inapp`} className="text-sm">In-App</Label>
                                                <Switch
                                                    id={`${setting.id}-inapp`}
                                                    checked={setting.inApp}
                                                    onCheckedChange={(checked) =>
                                                        handleNotificationSettingChange(setting.id, 'inApp', checked)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Integrations */}
                <TabsContent value="integrations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connected Services</CardTitle>
                            <CardDescription>Manage your connected services and integrations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {integrations.map((integration) => (
                                    <div key={integration.id} className="flex items-center justify-between p-4 rounded-lg border">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                                                {integration.icon === 'slack' && <Slack className="w-8 h-8" />}
                                                {integration.icon === 'github' && <Github className="w-8 h-8" />}
                                                {integration.icon === 'calendar' && <Calendar className="w-8 h-8" />}
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{integration.name}</h4>
                                                <p className="text-sm text-muted-foreground">{integration.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn(
                                                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                integration.status === "active" && "bg-green-50 text-green-700 ring-green-600/20",
                                                integration.status === "inactive" && "bg-gray-50 text-gray-700 ring-gray-600/20",
                                                integration.status === "pending" && "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                                            )}>
                                                {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                                            </span>
                                            <Button
                                                variant={integration.connected ? "outline" : "default"}
                                                onClick={() => handleIntegrationToggle(integration.id)}
                                            >
                                                {integration.connected ? (
                                                    <>
                                                        <Settings className="w-4 h-4 mr-2" />
                                                        Configure
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Connect
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
