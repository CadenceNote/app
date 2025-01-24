'use client';

import { use } from 'react';
import { MeetingList } from '@/components/meetings/MeetingList';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timeline } from '@/components/meetings/Timeline';

interface PageProps {
    params: Promise<{
        teamId: string;
    }>;
}

export default function MeetingsPage({ params }: PageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const teamId = parseInt(resolvedParams.teamId);

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
                    <p className="text-muted-foreground">Schedule and manage your team meetings</p>
                </div>
                <Button
                    onClick={() => router.push(`/dashboard/${teamId}/meetings/new`)}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    New Meeting
                </Button>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <TabsList>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="mt-6">
                    <MeetingList teamId={teamId} />
                </TabsContent>

                <TabsContent value="timeline" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Meeting Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Timeline teamId={teamId} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 