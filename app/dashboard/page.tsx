"use client"

import { useEffect, useState, Suspense } from "react"
import AIAssistant from "@/components/personal_dashboard/AIAssistant"
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
import { NotificationBell } from "@/components/common/NotificationBell"
import DashboardHeader from "@/components/header/DashboardHeader"
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
        <div className="">
            <Suspense fallback={<h3 className="text-center text-2xl font-bold">Loading...</h3>}>
                <main className="h-full overflow-y-auto">

                    {/* Dashboard Content */}
                    <div className="w-full mx-auto px-4 sm:px-6 lg:px-40 py-6 space-y-6">
                        <div className="space-y-6" id="summary-section">
                            {/* Quick Stats Row */}
                            <div className="grid gap-6 md:grid-cols-4">
                                <Card className="">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium dark:text-gray-200">Tasks Due Today</CardTitle>
                                        <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">
                                            {tasks?.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()).length || 0}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold dark:text-white">
                                            {tasks?.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()).length || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                                            {tasks?.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString() && t.priority === 'HIGH').length || 0} high priority
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium dark:text-gray-200">Today&apos;s Meetings</CardTitle>
                                        <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">
                                            {meetings?.filter(m => new Date(m.start_time).toDateString() === new Date().toDateString()).length || 0}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold dark:text-white">
                                            {meetings?.filter(m => new Date(m.start_time).toDateString() === new Date().toDateString()).length || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-400">
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
                                <Card className="">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium dark:text-gray-200">Pending Tasks</CardTitle>
                                        <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">
                                            {tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold dark:text-white">
                                            {tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                                            {tasks?.filter(t => t.status === 'IN_PROGRESS' && t.priority === 'HIGH').length || 0} high priority
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium dark:text-gray-200">Todo Tasks</CardTitle>
                                        <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">
                                            {tasks?.filter(t => t.status === 'TODO').length || 0}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold dark:text-white">
                                            {tasks?.filter(t => t.status === 'TODO').length || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-400">
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
                                    <div className="" id="tasks-section">
                                        <div className="">
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

