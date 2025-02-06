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
import PAnalytics from "@/components/personal_dashboard/PAnalytics"
import { taskApi } from '@/services/taskApi';
import { meetingApi } from '@/services/meetingApi';
import { auth } from '@/services/api';
import { teamApi } from '@/services/teamApi';

type Task = {
    id: string;
    taskId: string;
    title: string;
    category: string;
    status: 'To Do' | 'In Progress' | 'Done' | 'Backlog' | 'Canceled';
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    importance: 'important' | 'normal';
    urgency: 'urgent' | 'not-urgent';
    quadrant: 'important-urgent' | 'important-not-urgent' | 'not-important-urgent' | 'not-important-not-urgent' | 'unsorted';
    team_id: number;
};

type Meeting = {
    id: string;
    title: string;
    time: string;
    date: string;
    attendees: string[];
    isImportant: boolean;
};

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

    const updateTaskQuadrant = async (
        taskId: string,
        quadrant: Task['quadrant'],
        importance: Task['importance'],
        urgency: Task['urgency']
    ) => {
        // Optimistic update
        setTasks(prevTasks => prevTasks.map(task =>
            task.id === taskId ? { ...task, quadrant, importance, urgency } : task
        ));

        try {
            await taskApi.updatePersonalPreferences(Number(taskId), {
                importance: importance === 'important',
                urgency: urgency === 'urgent',
                quadrant
            });
        } catch (error) {
            // Revert on error
            setTasks(prevTasks => prevTasks.map(task =>
                task.id === taskId ? {
                    ...task,
                    quadrant: task.quadrant,
                    importance: task.importance,
                    urgency: task.urgency
                } : task
            ));
        }
    };
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

                    // Fetch tasks
                    const tasksData = await taskApi.listTasks(currentTeamId);
                    setTasks(tasksData.map(task => ({
                        id: task.id.toString(),
                        taskId: `TASK-${task.team_ref_number}`,
                        title: task.title,
                        category: task.category || 'Other',
                        status: task.status as Task['status'],
                        dueDate: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
                        priority: task.priority as Task['priority'],
                        importance: 'normal',
                        urgency: 'not-urgent',
                        quadrant: 'unsorted',
                        team_id: currentTeamId
                    })));

                    // Fetch meetings
                    const meetingsData = await meetingApi.listMeetings(currentTeamId);
                    setMeetings(meetingsData.map(meeting => ({
                        id: meeting.id.toString(),
                        title: meeting.title,
                        time: new Date(meeting.start_time).toLocaleTimeString(),
                        date: new Date(meeting.start_time).toISOString().split('T')[0],
                        attendees: meeting.participants?.map(p => p.full_name || p.email) || [],
                        isImportant: false
                    })));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
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
    const handleTaskUpdate = async (updatedTasks: Task[]) => {
        if (!teamId) return;

        try {
            // Create a copy of the tasks array
            const newTasks = [...updatedTasks];

            // Update each modified task
            for (const task of newTasks) {
                await taskApi.updateTask(teamId, Number(task.id), {
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    category: task.category,
                    due_date: task.dueDate
                });
            }

            setTasks(newTasks);
        } catch (error) {
            console.error('Error updating tasks:', error);
        }
    };

    // Handle meeting updates
    const handleMeetingUpdate = async (updatedMeetings: Meeting[]) => {
        if (!teamId) return;

        try {
            const newMeetings = [...updatedMeetings];

            // Update each modified meeting
            for (const meeting of newMeetings) {
                await meetingApi.updateMeeting(teamId, Number(meeting.id), {
                    title: meeting.title,
                    start_time: `${meeting.date}T${meeting.time}`
                });
            }

            setMeetings(newMeetings);
        } catch (error) {
            console.error('Error updating meetings:', error);
        }
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
                                meetings={meetings}
                                setTasks={handleTaskUpdate}
                                setMeetings={handleMeetingUpdate}
                                updateTaskQuadrant={updateTaskQuadrant}
                                searchTerm={searchTerm}
                            />
                        </section>

                        {/* Meetings Section */}
                        <section id="meetings-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-40"></div>
                            <PMeeting
                                meetings={meetings}
                                setMeetings={handleMeetingUpdate}
                                searchTerm={searchTerm}
                            />
                        </section>
                    </div>

                    {/* Charts Section - Moved to bottom */}
                    <section id="analytics-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                        <h2 className="text-2xl font-bold">Analytics</h2>
                        <PAnalytics />
                    </section>
                </div>
            </main>
        </div>
    )
}

