'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from 'lucide-react';
import { teamApi } from '@/services/teamApi';
import Link from 'next/link';

interface Team {
    id: number;
    name: string;
    description?: string;
    members: Array<{
        id: number;
        email: string;
        full_name: string;
    }>;
}

export default function MyTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const userTeams = await teamApi.getUserTeams();
                setTeams(userTeams);
            } catch (error) {
                console.error('Failed to fetch teams:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Teams</h1>
                <Button>
                    Create Team
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.length === 0 ? (
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardContent className="p-6">
                            <p className="text-gray-500 text-center">You haven't joined any teams yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    teams.map((team) => (
                        <Link key={team.id} href={`/dashboard/${team.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg">{team.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    {team.description && (
                                        <p className="text-sm text-gray-600 mb-4">
                                            {team.description}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Users className="h-4 w-4" />
                                            {team.members.length} members
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
} 