'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Bird } from '@/components/common/Bird';
import { useUser } from '@/hooks/useUser';
import { useTeams } from '@/hooks/useTeams';

type TeamMember = {
    email: string;
    role: 'ADMIN' | 'MEMBER' | 'MEETING_MANAGER';
};


export default function CreateTeamPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [newMember, setNewMember] = useState<TeamMember>({
        email: '',
        role: 'MEMBER'
    });
    const { user } = useUser();
    const { createTeam } = useTeams();

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMember.email) return;


        setTeamMembers(prev => [...prev, { ...newMember }]);
        setNewMember({ email: '', role: 'MEMBER' });

    };

    const handleRemoveMember = (index: number) => {
        setTeamMembers(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast({
                title: "Error",
                description: "Team name is required",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsLoading(true);

            const result = await createTeam({
                name: formData.name.trim(),
                description: formData.description.trim(),
                userId: user?.id as string
            });

            toast({
                title: "Success",
                description: "Team created successfully!"
            });

            // Force a full page refresh when redirecting
            window.location.href = `/dashboard/${result.id}`;

        } catch (error: unknown) {
            console.error('Error creating team:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create team. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
            <div className="p-8">
                <Button
                    variant="ghost"
                    className="mb-6 hover:bg-indigo-500/50"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back

                </Button>

                <div className="max-w-2xl mx-auto relative">
                    <Bird className="absolute -top-10 -left-10" />
                    <Card className="border-t-4 border-t-indigo-500 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Create New Team
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Create a new team to collaborate with others
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium text-gray-700">
                                            Team Name
                                        </label>
                                        <Input
                                            id="name"
                                            placeholder="Enter team name"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                name: e.target.value
                                            }))}
                                            disabled={isLoading}
                                            required
                                            className="border-indigo-200 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="description" className="text-sm font-medium text-gray-700">
                                            Description
                                        </label>
                                        <Textarea
                                            id="description"
                                            placeholder="Enter team description (optional)"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                description: e.target.value
                                            }))}
                                            disabled={isLoading}
                                            rows={4}
                                            className="border-indigo-200 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-700">Invite Team Members</h3>
                                    <div className="flex gap-2">
                                        <Input
                                            type="email"
                                            placeholder="Enter email address"
                                            value={newMember.email}
                                            onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                                            className="border-indigo-200 focus:border-indigo-500"
                                        />
                                        <select
                                            value={newMember.role}
                                            onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value as TeamMember['role'] }))}
                                            className="px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="member">Member</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <Button
                                            type="button"
                                            onClick={handleAddMember}
                                            variant="outline"
                                            className="flex-shrink-0"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {teamMembers.length > 0 && (
                                        <div className="space-y-2">
                                            {teamMembers.map((member, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-indigo-50 rounded-md">
                                                    <div>
                                                        <span className="text-sm text-gray-700">{member.email}</span>
                                                        <span className="ml-2 text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                                                            {member.role}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveMember(index)}
                                                        className="text-gray-500 hover:text-red-500"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-green-500 via-blue-500 to-indigo-500 hover:from-green-500/95 hover:via-blue-500/95 hover:to-indigo-500/95 text-white"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Creating..." : "Create Team"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
