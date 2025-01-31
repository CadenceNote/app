/*
* Team Dashboard Page
* 
* This page displays the dashboard for a team.
* It includes statistics, meeting and task lists, and modals for creating meetings and tasks.
*/
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, ListTodo, Users, Info, ArrowRight, Link } from 'lucide-react';
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
        active: number;
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
        team: { total: 0, active: 0 }
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
                            t.due_date &&
                            new Date(t.due_date) <= weekEnd
                        ).length
                    },
                    team: {
                        total: members.length,
                        active: members.filter(m => m.role === 'member').length
                    }
                });
            } catch (error) {
                console.error('Failed to load dashboard stats:', error);
            }
        };

        loadStats();
    }, [teamId]);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b">
                <div className="w-full">
                    <div className="h-16">
                        <div className="h-full max-w-[2000px] mx-auto px-6 flex justify-between items-center">
                            <div className="space-y-1">
                                <h1 className="text-xl font-semibold">Team Dashboard</h1>
                                <p className="text-sm text-muted-foreground">
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

            {/* Main Content */}
            <div className="w-full">
                <div className="max-w-[2000px] mx-auto px-6 py-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
                                <Calendar className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.meetings.upcoming}</div>
                                <p className="text-xs text-muted-foreground">
                                    +{stats.meetings.thisWeek} scheduled this week
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                                <ListTodo className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.tasks.active}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.tasks.dueThisWeek} due this week
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                                <Users className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.team.total}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.team.active} active members
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Meetings Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <a href={`/dashboard/${teamId}/meetings`}><h2 className="text-lg font-semibold">Meetings</h2></a>
                            </div>
                            <Card>
                                <div className="p-6">
                                    <MeetingList
                                        teamId={teamId}
                                        emptyState={
                                            <div
                                                className="text-center p-8 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                                                onClick={() => setIsCreateModalOpen(true)}
                                            >
                                                <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground mb-2">No upcoming meetings scheduled</p>
                                                <Button variant="link" className="text-primary hover:text-primary/90">
                                                    Schedule your next meeting
                                                    <ArrowRight className="h-4 w-4 ml-2" />
                                                </Button>
                                            </div>
                                        }
                                    />
                                </div>
                            </Card>
                        </div>

                        {/* Tasks Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Tasks</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground flex items-center">
                                        <Info className="h-4 w-4 mr-2" />
                                        You can press <kbd className="mx-1 px-1.5 py-0.5 bg-muted rounded border text-xs">/</kbd>
                                        in meeting notes to create tasks
                                    </span>
                                </div>
                            </div>
                            <Card>
                                <div className="p-6">
                                    <TaskList teamId={teamId} />
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CreateMeetingModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                teamId={teamId}
            />

            <TaskDetail
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                teamId={teamId}
                task={undefined}
            />
        </div>
    );
}