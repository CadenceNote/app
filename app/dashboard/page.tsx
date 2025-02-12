"use client"

import { useEffect, useState, Suspense } from "react"
import PSidebar from "@/components/personal_dashboard/PSidebar"
import PHeader from "@/components/personal_dashboard/PHeader"
import AIAssistant from "@/components/personal_dashboard/AIAssistant"
import PStats from "@/components/personal_dashboard/PStats"
import PAlerts from "@/components/personal_dashboard/PAlerts"
import PEvents from "@/components/personal_dashboard/PEvents"
import PTask from "@/components/personal_dashboard/PTask"
import PMeeting from "@/components/personal_dashboard/PMeeting"
import { useTask } from '@/hooks/useTask';
import { useTeams } from '@/hooks/useTeams';
import { useMeeting } from '@/hooks/useMeeting';
import { useUser } from '@/hooks/useUser';
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [activeSection, setActiveSection] = useState('summary-section')
    const [date, setDate] = useState<Date>(new Date())
    const { toast } = useToast()

    // Use our hooks
    const { user } = useUser();
    const { teams, isLoading: isLoadingTeams } = useTeams();

    // Use task hook for all teams initially
    const { tasks, tasksError, isLoadingTasks } = useTask();

    // Use meeting hook for all teams initially
    const {
        meetings,
        meetingsError,
        isLoadingMeetings
    } = useMeeting();

    useEffect(() => {
        if (tasksError) {
            toast({
                title: "Error",
                description: "Failed to fetch tasks",
                variant: "destructive"
            });
        }
        if (meetingsError) {
            toast({
                title: "Error",
                description: "Failed to fetch meetings",
                variant: "destructive"
            });
        }
    }, [teams, tasks, meetings, tasksError, meetingsError, toast]);

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
                                            9
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
                                            {tasks?.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()).length}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-500">Today&apos;s Meetings</h3>
                                        <span className="text-2xl font-semibold text-indigo-600">
                                            {meetings?.filter(m => new Date(m.start_time).toDateString() === new Date().toDateString()).length}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-500">Pending Tasks</h3>
                                        <span className="text-2xl font-semibold text-indigo-600">
                                            {tasks?.filter(t => t.status === 'IN_PROGRESS').length}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-500">Todo Tasks</h3>
                                        <span className="text-2xl font-semibold text-indigo-600">
                                            {tasks?.filter(t => !t.due_date || new Date(t.due_date).toDateString() !== new Date().toDateString()).length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Grid */}
                            <AIAssistant />
                            <div className="space-y-6">
                                {/* Calendar and Events Section */}
                                <div className="w-full">
                                    <PEvents
                                        meetings={meetings || []}
                                        tasks={tasks || []}
                                        date={date}
                                        setDate={setDate}
                                    />
                                </div>

                                {/* Tasks Section */}
                                <div className="w-full">
                                    <div className="bg-white rounded-lg shadow-sm">
                                        <div className="p-4">
                                            <PTask
                                                tasks={tasks || []}
                                                teams={teams || []}
                                                searchTerm={searchTerm}
                                                setTasks={() => { }} // Remove this prop as we're using the hook
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Meetings Section */}
                                <div className="w-full">
                                    <div className="bg-white rounded-lg shadow-sm">
                                        <div className="p-4">
                                            <PMeeting
                                                meetings={meetings || []}
                                                teams={teams || []}
                                                onMeetingUpdate={() => { }} // Remove this prop as we're using the hook
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

