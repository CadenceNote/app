"use client"

import { useEffect, useState, Suspense } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import PSidebar from "@/components/personal_dashboard/PSidebar"
import PHeader from "@/components/personal_dashboard/PHeader"
import AIAssistant from "@/components/personal_dashboard/AIAssistant"
import PStats from "@/components/personal_dashboard/PStats"
import PAlerts from "@/components/personal_dashboard/PAlerts"
import PEvents from "@/components/personal_dashboard/PEvents"
import PTask from "@/components/personal_dashboard/PTask"
import PMeeting from "@/components/personal_dashboard/PMeeting"
import { taskApi } from '@/services/taskApi';
import { meetingApi } from '@/services/meetingApi';
import { auth } from '@/services/api';
import { teamApi } from '@/services/teamApi';
import { TaskType, TaskPriority, TaskStatus } from "@/lib/types/task"
import { Meeting as APIMeeting } from "@/lib/types/meeting"
import { useToast } from "@/hooks/use-toast"

type Task = {
    id: string;
    taskId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType;
    start_date?: string;
    due_date?: string;
    assignee?: {
        id: string;
        email: string;
        full_name?: string;
        avatar_url?: string;
    };
    category?: string;
    team_id: number;
    team_ref_number?: string;
    created_at: string;
    created_by?: {
        id: string;
        email: string;
        full_name?: string;
    };
    comments?: Array<{
        id: number;
        content: string;
        user: {
            id: string;
            email: string;
            full_name?: string;
        };
        created_at: string;
    }>;
    labels?: string[];
    task_metadata?: Record<string, unknown>;
    importance: 'important' | 'normal';
    urgency: 'urgent' | 'not-urgent';
    quadrant: 'important-urgent' | 'important-not-urgent' | 'not-important-urgent' | 'not-important-not-urgent' | 'unsorted';
    order_in_quadrant?: number;
};

type Meeting = APIMeeting;

type Alert = {
    id: string;
    type: 'meeting_invite' | 'task_assignment' | 'team_invite' | 'mention';
    title: string;
    description: string;
    timestamp: string;
    isRead: boolean;
};

export default function DashboardPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [activeSection, setActiveSection] = useState('summary-section')
    const [date, setDate] = useState<Date>(new Date())
    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Use React Query for data fetching with proper caching
    const { data: session } = useQuery({
        queryKey: ['session'],
        queryFn: () => auth.getCurrentSession(),
        staleTime: Infinity // Session rarely changes, cache it indefinitely
    })

    const { data: userTeams = [] } = useQuery({
        queryKey: ['userTeams'],
        queryFn: () => teamApi.getUserTeams(),
        enabled: !!session?.user?.id,
        staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    })

    const currentTeamId = userTeams?.[0]?.id

    const { data: tasks = [], error: tasksError } = useQuery({
        queryKey: ['tasks', currentTeamId],
        queryFn: () => currentTeamId ? taskApi.listTasks(currentTeamId) : Promise.resolve([]),
        enabled: !!currentTeamId,
        staleTime: 30 * 1000 // Cache for 30 seconds
    })

    const { data: meetings = [], error: meetingsError } = useQuery({
        queryKey: ['meetings', currentTeamId],
        queryFn: () => currentTeamId ? meetingApi.listMeetings(currentTeamId) : Promise.resolve([]),
        enabled: !!currentTeamId,
        staleTime: 30 * 1000 // Cache for 30 seconds
    })

    useEffect(() => {
        if (tasksError) {
            toast({
                title: "Error",
                description: "Failed to fetch tasks",
                variant: "destructive"
            })
        }
        if (meetingsError) {
            toast({
                title: "Error",
                description: "Failed to fetch meetings",
                variant: "destructive"
            })
        }
    }, [tasksError, meetingsError, toast])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-50% 0px -50% 0px'
            }
        );

        const sections = document.querySelectorAll('section[id]');
        sections.forEach((section) => observer.observe(section));

        return () => {
            sections.forEach((section) => observer.unobserve(section));
        };
    }, []);

    // Handle task updates
    const handleTaskUpdate = async (updatedTasks: Task[] | Task) => {
        if (!currentTeamId) return;

        try {
            if (Array.isArray(updatedTasks)) {
                queryClient.setQueryData(['tasks', currentTeamId], updatedTasks);
            } else {
                queryClient.setQueryData(['tasks', currentTeamId], (oldTasks: Task[] = []) => {
                    const updatedTask = {
                        ...updatedTasks,
                        taskId: `T-${updatedTasks.team_ref_number || updatedTasks.id}`
                    };
                    return oldTasks.map(task =>
                        task.id === updatedTask.id ? updatedTask : task
                    );
                });
            }
            await queryClient.invalidateQueries({ queryKey: ['tasks', currentTeamId] });
        } catch (error) {
            console.error('Error updating tasks:', error);
            toast({
                title: "Error",
                description: "Failed to update tasks. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Handle meeting updates
    const handleMeetingUpdate = async (updatedMeetings: Meeting[]) => {
        if (!currentTeamId) return;
        queryClient.setQueryData(['meetings', currentTeamId], updatedMeetings);
        await queryClient.invalidateQueries({ queryKey: ['meetings', currentTeamId] });
    };

    return (
        <div className="h-screen overflow-hidden bg-gray-50">
            <Suspense fallback={<div>Loading...</div>}>
                <main className="h-full overflow-y-auto">
                    {/* Top Navigation Bar */}
                    <div className="bg-white border-b">
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                                <nav className="hidden md:flex space-x-4">
                                    <button
                                        onClick={() => setActiveSection('summary')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${activeSection === 'summary'
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Overview
                                    </button>
                                    <button
                                        onClick={() => setActiveSection('tasks')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${activeSection === 'tasks'
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Tasks
                                    </button>
                                    <button
                                        onClick={() => setActiveSection('calendar')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${activeSection === 'calendar'
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Calendar
                                    </button>
                                </nav>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="w-64">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="relative">
                                    <button className="p-2 text-gray-400 hover:text-gray-500">
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                            {tasks.filter(t => !t.due_date || new Date(t.due_date).toDateString() !== new Date().toDateString()).length}
                                        </span>
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Content */}
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="space-y-6">
                            {/* Quick Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-lg shadow-sm p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-500">Tasks Due Today</h3>
                                        <span className="text-2xl font-semibold text-indigo-600">
                                            {tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()).length}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-500">Today&apos;s Meetings</h3>
                                        <span className="text-2xl font-semibold text-indigo-600">
                                            {meetings.filter(m => new Date(m.start_time).toDateString() === new Date().toDateString()).length}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-500">Pending Tasks</h3>
                                        <span className="text-2xl font-semibold text-indigo-600">
                                            {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-500">Todo Tasks</h3>
                                        <span className="text-2xl font-semibold text-indigo-600">
                                            {tasks.filter(t => !t.due_date || new Date(t.due_date).toDateString() !== new Date().toDateString()).length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Grid */}
                            <AIAssistant />
                            <div className="space-y-6">
                                {/* Calendar and Events Section - Full Width */}
                                <div className="w-full">
                                    <PEvents
                                        meetings={meetings}
                                        tasks={tasks}
                                        date={date}
                                        setDate={setDate}
                                    />
                                </div>

                                {/* Tasks Section - Full Width */}
                                <div className="w-full">
                                    <div className="bg-white rounded-lg shadow-sm">
                                        <div className="p-4">
                                            <PTask
                                                tasks={tasks}
                                                teams={userTeams}
                                                setTasks={handleTaskUpdate}
                                                searchTerm={searchTerm}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Meetings Section - Full Width */}
                                <div className="w-full">
                                    <div className="bg-white rounded-lg shadow-sm">
                                        <div className="p-4">
                                            <PMeeting
                                                meetings={meetings}
                                                teams={userTeams}
                                                onMeetingUpdate={handleMeetingUpdate}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </Suspense>
        </div>
    )
}

