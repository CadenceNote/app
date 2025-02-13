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
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/common/UserAvatar"
import { useRouter } from "next/navigation";
import handleSignOut from "@/components/common/handleSignOut"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { differenceInDays } from "date-fns"

export default function DashboardPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [activeSection, setActiveSection] = useState('summary-section')
    const [date, setDate] = useState<Date>(new Date())
    const { toast } = useToast()
    const router = useRouter();
    // Use our hooks
    const { teams, isLoading: isLoadingTeams } = useTeams();

    // Use task hook for all teams initially
    const { tasks, tasksError, isLoadingTasks } = useTask();

    // Use meeting hook for all teams initially
    const {
        meetings,
        meetingsError,
        isLoadingMeetings
    } = useMeeting();

    const { user } = useUser();

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
        <div className="h-screen">
            <Suspense fallback={<h3 className="text-center text-2xl font-bold">Loading...</h3>}>
                <main className="h-full overflow-y-auto">
                    {/* Top Navigation Bar */}
                    <div className="bg-white border-b">
                        <div className="flex items-center h-14 px-4">
                            {/* Left section */}
                            <div className="flex-none flex items-center space-x-4">
                                <SidebarTrigger />
                                <Separator orientation="vertical" className="h-6" />
                                <h1 className="text-xl font-semibold text-gray-700">My Dashboard</h1>
                            </div>

                            {/* Center section - Search */}
                            <div className="flex-1 flex justify-center px-4">
                                <div className="w-full max-w-2xl">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Right section */}
                            <div className="flex-none flex items-center space-x-2">
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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <UserAvatar
                                                name={user?.full_name || 'User'}
                                                imageUrl={user?.avatar_url}
                                                className="h-8 w-8"
                                            />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/profile')}>Profile</DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/settings')}>Settings</DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleSignOut(router)}>Logout</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Content */}
                    <div className="w-full mx-auto px-4 sm:px-6 lg:px-40 py-6 space-y-6">
                        <h1 className="text-3xl font-bold tracking-tight"> My Dashboard</h1>
                        <div className="space-y-6" id="summary-section">
                            {/* Quick Stats Row */}
                            <div className="grid gap-6 md:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">Tasks Due Today</CardTitle>
                                        <Badge variant="secondary">
                                            {tasks?.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()).length || 0}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {tasks?.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()).length || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {tasks?.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString() && t.priority === 'HIGH').length || 0} high priority
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">Today&apos;s Meetings</CardTitle>
                                        <Badge variant="secondary">
                                            {meetings?.filter(m => new Date(m.start_time).toDateString() === new Date().toDateString()).length || 0}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {meetings?.filter(m => new Date(m.start_time).toDateString() === new Date().toDateString()).length || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Next at {meetings
                                                ?.filter(m => new Date(m.start_time) > new Date())
                                                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]
                                                ? format(parseISO(meetings
                                                    ?.filter(m => new Date(m.start_time) > new Date())
                                                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]
                                                    .start_time), 'h:mm a')
                                                : 'No more meetings today'}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                                        <Badge variant="secondary">
                                            {tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {tasks?.filter(t => t.status === 'IN_PROGRESS' && t.priority === 'HIGH').length || 0} high priority
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">Todo Tasks</CardTitle>
                                        <Badge variant="secondary">
                                            {tasks?.filter(t => t.status === 'TODO').length || 0}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {tasks?.filter(t => t.status === 'TODO').length || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {tasks?.filter(t =>
                                                t.status === 'TODO' &&
                                                t.due_date &&
                                                differenceInDays(parseISO(t.due_date), new Date()) <= 7
                                            ).length || 0} due this week
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Main Content Column - Takes up 2/3 of the space */}
                                <div className="lg:col-span-2 space-y-6">
                                    <AIAssistant />

                                    {/* Tasks Section */}
                                    <div className="border-indigo-500 border-1 rounded-lg bg-white/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300" id="tasks-section">
                                        <div className="bg-white rounded-lg shadow-sm">
                                            <PTask
                                                searchTerm={searchTerm}
                                            />
                                        </div>
                                    </div>

                                    {/* Meetings Section */}
                                    <div className="w-full" id="meetings-section">
                                        <div className="">
                                            <PMeeting
                                                searchTerm={searchTerm}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Side Column - Takes up 1/3 of the space */}
                                <div className="space-y-6 ">
                                    {/* Calendar and Events Section */}
                                    <div className="w-full " id="calendar-section">
                                        <PEvents
                                            meetings={meetings || []}
                                            date={date}
                                            setDate={setDate}
                                        />
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

