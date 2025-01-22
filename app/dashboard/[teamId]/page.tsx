// app/dashboard/[teamId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, ListTodo, Users, Info } from 'lucide-react';
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
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="w-full">
                    <div className="h-16">
                        <div className="h-full max-w-[2000px] mx-auto px-6 flex justify-between items-center">
                            <div className="space-y-1">
                                <h1 className="text-xl font-semibold text-gray-900">Team Dashboard</h1>
                                <p className="text-sm text-gray-500">
                                    Manage your team&apos;s meetings and tasks
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={() => setIsCreateTaskModalOpen(true)} variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Task
                                </Button>
                                <Button onClick={() => setIsCreateModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Meeting
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <div className="max-w-[2000px] mx-auto px-6 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="bg-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.meetings.upcoming}</div>
                                <p className="text-xs text-gray-500">
                                    +{stats.meetings.thisWeek} scheduled this week
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                                <ListTodo className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.tasks.active}</div>
                                <p className="text-xs text-gray-500">
                                    {stats.tasks.dueThisWeek} due this week
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                                <Users className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.team.total}</div>
                                <p className="text-xs text-gray-500">
                                    {stats.team.online} online now
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <Tabs defaultValue="meetings" className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <TabsList className="bg-gray-100">
                                    <TabsTrigger value="meetings">Meetings</TabsTrigger>
                                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                                </TabsList>
                                <div className="text-sm text-gray-500 flex items-center">
                                    <Info className="h-4 w-4 mr-2" />
                                    Press <kbd className="mx-1 px-1.5 py-0.5 bg-gray-100 rounded border text-xs">/</kbd>
                                    in meetings to create tasks
                                </div>
                            </div>

                            <TabsContent value="meetings" className="space-y-4">
                                <MeetingList teamId={teamId} />
                            </TabsContent>

                            <TabsContent value="tasks" className="space-y-4">
                                <TaskList teamId={teamId} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

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