"use client"

import { useEffect, useState } from "react"
import PSidebar from "@/components/personal_dashboard/PSidebar"
import PHeader from "@/components/personal_dashboard/PHeader"
import SummarySection from "@/components/personal_dashboard/SummarySection"
import PStats from "@/components/personal_dashboard/PStats"
import PAlerts from "@/components/personal_dashboard/PAlerts"
import PEvents from "@/components/personal_dashboard/PEvents"
import PTask from "@/components/personal_dashboard/PTask"
import PMeeting from "@/components/personal_dashboard/PMeeting"
import { taskApi } from '@/services/taskApi';
import { meetingApi } from '@/services/meetingApi';
import { auth } from '@/services/api';
import { teamApi } from '@/services/teamApi';
import { TaskType } from "@/lib/types/task"
import { TaskPriority } from "@/lib/types/task"
import { TaskStatus } from "@/lib/types/task"
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
    task_metadata?: Record<string, any>;
    // Personal dashboard specific fields
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
    const [isMounted, setIsMounted] = useState(false)
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [tasks, setTasks] = useState<Task[]>([])
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [activeSection, setActiveSection] = useState('summary-section')
    const [teamId, setTeamId] = useState<number | null>(null)
    const { toast } = useToast()

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const session = await auth.getCurrentSession();
                if (!session) return;

                const userTeams = await teamApi.getUserTeams();
                if (userTeams.length > 0) {
                    const currentTeamId = userTeams[0].id;
                    setTeamId(currentTeamId);

                    // Fetch tasks with full data
                    const tasksData = await taskApi.listTasks(currentTeamId);
                    setTasks(tasksData);

                    // Fetch meetings
                    const meetingsData = await meetingApi.listMeetings(currentTeamId);
                    setMeetings(meetingsData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    title: "Error",
                    description: "Failed to fetch dashboard data",
                    variant: "destructive"
                });
            }
        };

        if (isMounted) {
            fetchData();
        }
    }, [isMounted]);

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
                rootMargin: '-50% 0px -50% 0px' // Trigger when section is in the middle of the viewport
            }
        );

        const sections = document.querySelectorAll('section[id]');
        sections.forEach((section) => observer.observe(section));

        return () => {
            sections.forEach((section) => observer.unobserve(section));
        };
    }, []);

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Handle task updates
    const handleTaskUpdate = async (updatedTasks: Task[] | Task) => {
        if (!teamId) return;

        try {
            if (Array.isArray(updatedTasks)) {
                setTasks(updatedTasks);
            } else {
                // If it's a single task update
                const taskArray = [updatedTasks];

                // Update local state immediately
                setTasks(prevTasks => {
                    const updatedTaskMap = new Map(taskArray.map(task => [task.id, task]));
                    return prevTasks.map(task =>
                        updatedTaskMap.has(task.id)
                            ? {
                                ...updatedTaskMap.get(task.id)!,
                                taskId: `T-${updatedTaskMap.get(task.id)!.team_ref_number || updatedTaskMap.get(task.id)!.id}`
                            }
                            : task
                    );
                });

                // Refresh tasks from server
                try {
                    const tasksData = await taskApi.listTasks(teamId);
                    if (tasksData) {
                        setTasks(tasksData.map(task => ({
                            ...task,
                            taskId: `T-${task.team_ref_number || task.id}`
                        })));
                    }
                } catch (refreshError) {
                    console.error('Error refreshing tasks:', refreshError);
                }
            }
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
        if (!teamId) return;
        setMeetings(updatedMeetings);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <PSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

            {/* Main content */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-white to-indigo-50/20 ml-64">
                <PHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

                <div className="space-y-0 pt-6">
                    <section id="summary-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20 ">
                        {/* Background decoration */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 opacity-40"></div>

                        <div className="grid gap-4 md:gap-6 lg:grid-cols-3 relative z-10 ">
                            {/* Summary and Stats */}
                            <div className="lg:col-span-2 space-y-6">
                                <SummarySection />

                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                    {/* Stats Overview */}
                                    <PStats tasks={tasks} meetings={meetings} alerts={alerts} />
                                </div>
                            </div>

                            {/* Alerts Section */}
                            <div className="lg:col-span-1">
                                <PAlerts alerts={alerts} setAlerts={setAlerts} isMounted={isMounted} />
                            </div>
                        </div>
                    </section>

                    {/* Calendar and Upcoming Events sections */}
                    <section id="calendar-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50 opacity-40"></div>
                        <PEvents meetings={meetings} tasks={tasks} date={date} setDate={setDate} />
                    </section>

                    {/* Tasks and Meetings */}
                    <div className="mt-6 space-y-6">
                        {/* Tasks Section */}
                        <section id="tasks-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                            <PTask
                                tasks={tasks}
                                setTasks={handleTaskUpdate}
                                searchTerm={searchTerm}
                            />
                        </section>

                        {/* Meetings Section */}
                        <section id="meetings-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-40"></div>
                            <PMeeting />
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}

