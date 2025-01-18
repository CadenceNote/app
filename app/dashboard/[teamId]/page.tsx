// app/dashboard/[teamId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, ListTodo, Users } from 'lucide-react';
import { MeetingList } from '@/components/meetings/MeetingList';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { meetingApi } from '@/services/meetingApi';
import { taskApi } from '@/services/taskApi';
import { teamApi } from '@/services/teamApi';

interface DashboardStats {
    meetings: {
        upcoming: number;
        thisWeek: number;
    };
    tasks: {
        active: number;
        dueThisWeek: number;
    };
    team: {
        total: number;
        online: number;
    };
}

export default function TeamDashboardPage() {
    const params = useParams();
    const teamId = parseInt(params.teamId as string);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        meetings: { upcoming: 0, thisWeek: 0 },
        tasks: { active: 0, dueThisWeek: 0 },
        team: { total: 0, online: 0 }
    });

    useEffect(() => {
        const loadStats = async () => {
            try {
                // Get all meetings and filter upcoming ones
                const meetings = await meetingApi.listMeetings(teamId);
                const now = new Date();
                const upcomingMeetings = meetings.filter(m => new Date(m.start_time) > now);

                // Get all tasks
                const tasks = await taskApi.listTasks(teamId);

                // Get team members
                const team = await teamApi.getTeam(teamId);
                const members = team.members || [];

                const weekEnd = new Date(now);
                weekEnd.setDate(now.getDate() + 7);

                setStats({
                    meetings: {
                        upcoming: upcomingMeetings.length,
                        thisWeek: upcomingMeetings.filter(m => new Date(m.start_time) <= weekEnd).length
                    },
                    tasks: {
                        active: tasks.filter(t => t.status !== 'DONE').length,
                        dueThisWeek: tasks.filter(t =>
                            t.status !== 'DONE' &&
                            t.dueDate &&
                            new Date(t.dueDate) <= weekEnd
                        ).length
                    },
                    team: {
                        total: members.length,
                        online: members.filter(m => m.status === 'online').length
                    }
                });
            } catch (error) {
                console.error('Failed to load dashboard stats:', error);
            }
        };

        loadStats();
    }, [teamId]);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your team&apos;s meetings and tasks
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsCreateTaskModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Task
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)} variant="default">
                        <Plus className="h-4 w-4 mr-2" />
                        New Meeting
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.meetings.upcoming}</div>
                        <p className="text-xs text-muted-foreground">
                            +{stats.meetings.thisWeek} scheduled for this week
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.tasks.active}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.tasks.dueThisWeek} due this week
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.team.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.team.online} online now
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="meetings" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="meetings">Meetings</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>

                <TabsContent value="meetings" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-semibold tracking-tight">Team Meetings</h2>
                            <p className="text-sm text-muted-foreground">
                                Schedule and manage your team meetings
                            </p>
                        </div>
                    </div>
                    <MeetingList teamId={teamId} />
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-semibold tracking-tight">Team Tasks</h2>
                            <p className="text-sm text-muted-foreground">
                                Track and manage your team tasks
                            </p>
                        </div>
                    </div>
                    <TaskList teamId={teamId} />
                </TabsContent>
            </Tabs>

            <CreateMeetingModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                teamId={teamId}
            />

            <TaskDetail
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                teamId={teamId}
            />
        </div>
    );
}