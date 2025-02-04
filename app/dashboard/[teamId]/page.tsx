/*
* Team Dashboard Page
* 
* This page displays the dashboard for a team.
* It includes statistics, meeting and task lists, and modals for creating meetings and tasks.
*/
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Plus, Bell, CalendarIcon, CheckCircle, Clock,
    MoreHorizontal, Settings, Trash2, X, AtSign, Check,
    AlertCircle, BarChart2, Users,

} from 'lucide-react';
import { CreateMeetingModal } from '@/components/meetings/CreateMeetingModal';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { meetingApi } from '@/services/meetingApi';
import { taskApi } from '@/services/taskApi';
import { teamApi } from '@/services/teamApi';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Notification, NotificationTitle, NotificationDescription } from "@/components/ui/notification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bird } from '@/components/common/Bird';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/hooks/useUser";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";

interface Task {
    id: string;
    taskId: string;
    title: string;
    tag: 'Feature' | 'Bug' | 'Documentation';
    status: 'To Do' | 'In Progress' | 'Done' | 'Backlog' | 'Canceled';
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    importance: 'important' | 'normal';
    urgency: 'urgent' | 'not-urgent';
}

interface Meeting {
    id: string;
    title: string;
    time: string;
    date: string;
    attendees: string[];
    isImportant: boolean;
}

interface Alert {
    id: string;
    type: 'meeting_invite' | 'mention' | 'task_assignment' | 'team_invite';
    title: string;
    description: string;
    timestamp: string;
    isRead: boolean;
}

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

interface Team {
    name: string;
    members: any[];
}

export default function TeamDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = parseInt(params.teamId as string);
    const [isMounted, setIsMounted] = useState(false);
    const { user } = useUser();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [notifications, setNotifications] = useState<{ id: string; title: string; description: string }[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        meetings: { upcoming: 0, thisWeek: 0 },
        tasks: { active: 0, dueThisWeek: 0 },
        team: { total: 0, active: 0 }
    });
    const [tasks, setTasks] = useState<Task[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [timeUpdateKey, setTimeUpdateKey] = useState(0);
    const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
    const [activeSection, setActiveSection] = useState('summary-section');
    const [team, setTeam] = useState<Team | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const interval = setInterval(() => {
            setTimeUpdateKey(prev => prev + 1);
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [isMounted]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get team data
                const teamData = await teamApi.getTeam(teamId);
                setTeam(teamData);

                // Get all meetings and filter upcoming ones
                const meetingsData = await meetingApi.listMeetings(teamId);
                const formattedMeetings = meetingsData?.map(m => ({
                    id: m.id.toString(),
                    title: m.title,
                    time: new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: new Date(m.start_time).toISOString().split('T')[0],
                    attendees: m.attendees?.map(a => a.name) || [],
                    isImportant: m.is_important || false
                })) || [];
                setMeetings(formattedMeetings);

                // Get all tasks
                const tasksData = await taskApi.listTasks(teamId);
                const formattedTasks = tasksData?.map(t => ({
                    id: t.id.toString(),
                    taskId: `TASK-${t.id}`,
                    title: t.title,
                    tag: t.type as Task['tag'],
                    status: t.status as Task['status'],
                    dueDate: t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    priority: t.priority as Task['priority'],
                    importance: 'normal' as const,
                    urgency: 'not-urgent' as const
                })) || [];
                setTasks(formattedTasks);

                // Get team members
                const members = teamData?.members || [];

                // Calculate stats
                const now = new Date();
                const weekEnd = new Date(now);
                weekEnd.setDate(now.getDate() + 7);

                setStats({
                    meetings: {
                        upcoming: meetingsData?.filter(m => new Date(m.start_time) > now).length || 0,
                        thisWeek: meetingsData?.filter(m => {
                            const meetingDate = new Date(m.start_time);
                            return meetingDate > now && meetingDate <= weekEnd;
                        }).length || 0
                    },
                    tasks: {
                        active: tasksData?.filter(t => t.status !== 'DONE').length || 0,
                        dueThisWeek: tasksData?.filter(t =>
                            t.status !== 'DONE' &&
                            t.due_date &&
                            new Date(t.due_date) <= weekEnd
                        ).length || 0
                    },
                    team: {
                        total: members.length,
                        active: members.filter(m => m.role === 'member').length
                    }
                });
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            }
        };

        if (teamId) {
            loadData();
        }
    }, [teamId]);

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

    const addTask = (newTask: Omit<Task, 'id' | 'quadrant'>) => {
        setTasks(prev => [...prev, { ...newTask, id: (prev.length + 1).toString(), quadrant: 'unsorted' }]);
        addNotification(`New task added: ${newTask.title}`, "Task has been successfully added to your list.");
    };

    const addMeeting = (newMeeting: Omit<Meeting, 'id' | 'isImportant'>) => {
        setMeetings(prev => [...prev, { ...newMeeting, id: (prev.length + 1).toString(), isImportant: false }]);
        addNotification(
            `New meeting scheduled: ${newMeeting.title}`,
            `Meeting scheduled for ${newMeeting.date} at ${newMeeting.time}`
        );
    };

    const deleteTask = (id: string) => {
        setTasks(prev => prev.filter(task => task.id !== id));
        addNotification("Task deleted", "The task has been removed from your list.");
    };

    const deleteMeeting = (id: string) => {
        setMeetings(prev => prev.filter(meeting => meeting.id !== id));
        addNotification("Meeting cancelled", "The meeting has been removed from your schedule.");
    };

    const addNotification = (title: string, description: string) => {
        const newNotification = { id: Date.now().toString(), title, description };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    const filteredTasks = tasks.filter(
        (task) =>
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.priority.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredMeetings = meetings.filter(
        (meeting) =>
            meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            meeting.date.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate stats based on period
    const calculateStats = () => {
        const now = new Date();
        let periodStart: Date;

        switch (statsPeriod) {
            case 'day':
                periodStart = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                periodStart = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                periodStart = new Date(now.setMonth(now.getMonth() - 1));
                break;
        }

        const tasksToComplete = tasks.filter(task => task.status !== 'Done').length;
        const tasksCompletedThisPeriod = tasks.filter(task =>
            task.status === 'Done' &&
            new Date(task.dueDate) >= periodStart
        ).length;
        const upcomingMeetings = meetings.filter(meeting =>
            new Date(meeting.date + 'T' + meeting.time) > new Date()
        ).length;

        return {
            tasksToComplete,
            tasksCompletedThisPeriod,
            upcomingMeetings
        };
    };

    const calculatedStats = calculateStats();

    const navigateToSettings = () => {
        router.push(`/dashboard/${teamId}/settings`);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-card text-card-foreground border-r border-border/40 backdrop-blur-sm fixed h-screen overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-indigo-500"></div>
                        <h2 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-indigo-600 bg-clip-text text-transparent">
                            Team Dashboard
                        </h2>
                    </div>
                    <nav className="space-y-1">
                        <Button
                            variant={activeSection === 'summary-section' ? 'secondary' : 'ghost'}
                            className={cn(
                                "w-full justify-start",
                                activeSection === 'summary-section' && "bg-gradient-to-r from-green-50 to-indigo-50 text-indigo-900"
                            )}
                            onClick={() => {
                                const element = document.getElementById('summary-section')
                                element?.scrollIntoView({ behavior: 'smooth' })
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <BarChart2 className={cn(
                                    "h-4 w-4",
                                    activeSection === 'summary-section' ? "text-indigo-600" : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    activeSection === 'summary-section' ? "font-medium" : "text-muted-foreground"
                                )}>Summary & Alerts</span>
                            </div>
                        </Button>
                        <Button
                            variant={activeSection === 'calendar-section' ? 'secondary' : 'ghost'}
                            className={cn(
                                "w-full justify-start",
                                activeSection === 'calendar-section' && "bg-gradient-to-r from-green-50 to-indigo-50 text-indigo-900"
                            )}
                            onClick={() => {
                                const element = document.getElementById('calendar-section')
                                element?.scrollIntoView({ behavior: 'smooth' })
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <CalendarIcon className={cn(
                                    "h-4 w-4",
                                    activeSection === 'calendar-section' ? "text-indigo-600" : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    activeSection === 'calendar-section' ? "font-medium" : "text-muted-foreground"
                                )}>Calendar</span>
                            </div>
                        </Button>
                        <Button
                            variant={activeSection === 'tasks-section' ? 'secondary' : 'ghost'}
                            className={cn(
                                "w-full justify-start",
                                activeSection === 'tasks-section' && "bg-gradient-to-r from-green-50 to-indigo-50 text-indigo-900"
                            )}
                            onClick={() => {
                                const element = document.getElementById('tasks-section')
                                element?.scrollIntoView({ behavior: 'smooth' })
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <CheckCircle className={cn(
                                    "h-4 w-4",
                                    activeSection === 'tasks-section' ? "text-indigo-600" : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    activeSection === 'tasks-section' ? "font-medium" : "text-muted-foreground"
                                )}>Tasks</span>
                            </div>
                        </Button>
                        <Button
                            variant={activeSection === 'meetings-section' ? 'secondary' : 'ghost'}
                            className={cn(
                                "w-full justify-start",
                                activeSection === 'meetings-section' && "bg-gradient-to-r from-green-50 to-indigo-50 text-indigo-900"
                            )}
                            onClick={() => {
                                const element = document.getElementById('meetings-section')
                                element?.scrollIntoView({ behavior: 'smooth' })
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <CalendarIcon className={cn(
                                    "h-4 w-4",
                                    activeSection === 'meetings-section' ? "text-indigo-600" : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    activeSection === 'meetings-section' ? "font-medium" : "text-muted-foreground"
                                )}>Meetings</span>
                            </div>
                        </Button>
                        <Button
                            variant={activeSection === 'analytics-section' ? 'secondary' : 'ghost'}
                            className={cn(
                                "w-full justify-start",
                                activeSection === 'analytics-section' && "bg-gradient-to-r from-green-50 to-indigo-50 text-indigo-900"
                            )}
                            onClick={() => {
                                const element = document.getElementById('analytics-section')
                                element?.scrollIntoView({ behavior: 'smooth' })
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <BarChart2 className={cn(
                                    "h-4 w-4",
                                    activeSection === 'analytics-section' ? "text-indigo-600" : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    activeSection === 'analytics-section' ? "font-medium" : "text-muted-foreground"
                                )}>Analytics</span>
                            </div>
                        </Button>

                        <div className="pt-4 mt-4 border-t border-border/60">
                            <Button variant="ghost" className="w-full justify-start opacity-70 hover:opacity-100">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Time Tracking</span>
                                </div>
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start opacity-70 hover:opacity-100"
                                onClick={navigateToSettings}
                            >
                                <div className="flex items-center gap-3">
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Settings</span>
                                </div>
                            </Button>
                        </div>
                    </nav>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-white to-indigo-50/20 ml-64">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-indigo-100 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">{team?.name}</h1>
                    <div className="flex items-center space-x-4">
                        <Input
                            type="search"
                            placeholder="Search tasks or meetings..."
                            className="w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Bell className="h-4 w-4" />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                    <h4 className="font-medium leading-none">Notifications</h4>
                                    {notifications.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No new notifications.</p>
                                    ) : (
                                        notifications.map((notification) => (
                                            <Notification key={notification.id} className="grid gap-1">
                                                <NotificationTitle>{notification.title}</NotificationTitle>
                                                <NotificationDescription>{notification.description}</NotificationDescription>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute top-2 right-2"
                                                    onClick={() => removeNotification(notification.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </Notification>
                                        ))
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Avatar>
                                        <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
                                        <AvatarFallback>
                                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Team Settings</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Team Profile</DropdownMenuItem>
                                <DropdownMenuItem>Members</DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Dashboard content */}
                <div className="space-y-0 pt-6">
                    {/* Stats Overview and Alerts */}
                    <section id="summary-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                        {/* Background decoration */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 opacity-40"></div>
                        <div className="relative z-10">
                            <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
                                {/* Summary and Stats */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="border-indigo-100 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                                        <CardHeader>
                                            <CardTitle>Summary</CardTitle>
                                            <CardDescription>AI-powered insights and analytics to help your team stay on top of work.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="relative">
                                            {/* Bird Container */}
                                            <Bird />
                                            {/* Speech Bubble */}
                                            <div className="relative ml-16 p-4 bg-gradient-to-br from-green-50 to-indigo-50 rounded-2xl">
                                                {/* Speech Bubble Pointer */}
                                                <div className="absolute -left-3 top-6 w-4 h-4 bg-gradient-to-br from-green-50 to-indigo-50 transform rotate-45"></div>
                                                <textarea
                                                    className="w-full h-40 bg-transparent border-none rounded-md p-2 focus:ring-0 placeholder:text-gray-400"
                                                    placeholder="Hi there! Here's your AI-powered team summary..."
                                                    style={{ resize: 'none' }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                        <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30 hover:shadow-lg transition-all duration-300">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium text-green-800">Tasks To Complete</CardTitle>
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-green-700">{stats.tasks.active}</div>
                                                <p className="text-xs text-green-600/80">
                                                    {stats.tasks.dueThisWeek} due this week
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-lg transition-all duration-300">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium text-blue-800">Upcoming Meetings</CardTitle>
                                                <Select value={statsPeriod} onValueChange={(value: 'day' | 'week' | 'month') => setStatsPeriod(value)}>
                                                    <SelectTrigger className="w-[100px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="day">Today</SelectItem>
                                                        <SelectItem value="week">This Week</SelectItem>
                                                        <SelectItem value="month">This Month</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-blue-700">{stats.meetings.upcoming}</div>
                                                <p className="text-xs text-blue-600/80">
                                                    +{stats.meetings.thisWeek} scheduled this week
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-lg transition-all duration-300">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium text-indigo-800">Team Members</CardTitle>
                                                <Users className="h-4 w-4 text-indigo-600" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-indigo-700">{stats.team.total}</div>
                                                <p className="text-xs text-indigo-600/80">
                                                    {stats.team.active} active members
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-lg transition-all duration-300">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium text-blue-800">Unread Alerts</CardTitle>
                                                <Bell className="h-4 w-4 text-blue-600" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-blue-700">{alerts.filter(alert => !alert.isRead).length}</div>
                                                <p className="text-xs text-blue-600/80">
                                                    New notifications
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                {/* Alerts Section */}
                                <div className="lg:col-span-1">
                                    <Card className="border-indigo-100 bg-white/70 backdrop-blur-sm h-full hover:shadow-lg transition-all duration-300">
                                        <CardHeader>
                                            <CardTitle className="text-indigo-800">Recent Updates</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {alerts.map(alert => (
                                                    <div
                                                        key={alert.id}
                                                        className={cn(
                                                            "flex items-center space-x-4 rounded-lg border p-4 transition-all duration-300",
                                                            !alert.isRead ? "bg-indigo-50/50 border-indigo-200" : "hover:bg-gray-50/50"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "rounded-full p-2",
                                                            alert.type === 'meeting_invite' && "bg-blue-100",
                                                            alert.type === 'task_assignment' && "bg-green-100",
                                                            alert.type === 'team_invite' && "bg-purple-100",
                                                            alert.type === 'mention' && "bg-yellow-100"
                                                        )}>
                                                            {alert.type === 'meeting_invite' && <CalendarIcon className="h-4 w-4 text-blue-600" />}
                                                            {alert.type === 'task_assignment' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                                            {alert.type === 'team_invite' && <Users className="h-4 w-4 text-purple-600" />}
                                                            {alert.type === 'mention' && <AtSign className="h-4 w-4 text-yellow-600" />}
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <p className="text-sm font-medium leading-none">{alert.title}</p>
                                                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setAlerts(alerts.map(a =>
                                                                        a.id === alert.id ? { ...a, isRead: true } : a
                                                                    ))
                                                                }}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <time className="text-sm text-muted-foreground">
                                                                {isMounted ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }) : 'recently'}
                                                            </time>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Calendar and Upcoming Events sections */}
                    <section id="calendar-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50 opacity-40"></div>
                        <div className="relative z-10">
                            {/* Upcoming Events Section */}
                            <div className="space-y-4 md:space-y-6 lg:col-span-5">
                                <Card className="h-full">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle>Upcoming Events</CardTitle>
                                        <div className="flex items-center space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Event
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-8">
                                            {/* Today's Events */}
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4">Today</h3>
                                                <div className="space-y-4">
                                                    {meetings
                                                        .filter(meeting => {
                                                            const today = new Date()
                                                            const meetingDate = new Date(meeting.date)
                                                            return meetingDate.toDateString() === today.toDateString()
                                                        })
                                                        .map(meeting => (
                                                            <div key={meeting.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-accent">
                                                                <div className="bg-grey-100 rounded-full p-2 min-w-[80px] text-center">
                                                                    <div className="text-gray-500">
                                                                        Meeting
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">{meeting.title}</p>
                                                                    <p className="text-sm text-muted-foreground">{meeting.time}</p>
                                                                </div>
                                                                <div className="flex -space-x-2">
                                                                    {meeting.attendees.slice(0, 3).map((attendee, i) => (
                                                                        <Avatar key={i} className="border-2 border-background h-8 w-8">
                                                                            <AvatarFallback>{attendee.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                                        </Avatar>
                                                                    ))}
                                                                    {meeting.attendees.length > 3 && (
                                                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm">
                                                                            +{meeting.attendees.length - 3}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    {tasks
                                                        .filter(task => {
                                                            const today = new Date()
                                                            const taskDate = new Date(task.dueDate)
                                                            return taskDate.toDateString() === today.toDateString()
                                                        })
                                                        .map(task => (
                                                            <div key={task.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-accent">
                                                                <div className="bg-grey-100 rounded-full p-2 min-w-[80px] text-center">
                                                                    <div className="text-gray-500">
                                                                        Task
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">{task.title}</p>
                                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                        <span className={cn(
                                                                            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                                            task.tag === "Feature" && "bg-purple-50 text-purple-700 ring-purple-600/20",
                                                                            task.tag === "Bug" && "bg-red-50 text-red-700 ring-red-600/20",
                                                                            task.tag === "Documentation" && "bg-blue-50 text-blue-700 ring-blue-600/20"
                                                                        )}>
                                                                            {task.tag}
                                                                        </span>
                                                                        <span>{task.priority} Priority</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>

                                            {/* Upcoming Events */}
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4">Upcoming</h3>
                                                <div className="space-y-4">
                                                    {meetings
                                                        .filter(meeting => {
                                                            const today = new Date()
                                                            const meetingDate = new Date(meeting.date)
                                                            return meetingDate > today && meetingDate.toDateString() !== today.toDateString()
                                                        })
                                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                        .slice(0, 5)
                                                        .map(meeting => (
                                                            <div key={meeting.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-accent">
                                                                <div className="bg-grey-100 rounded-full p-2 min-w-[80px] text-center">
                                                                    <div className="text-gray-500">
                                                                        Meeting
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">{meeting.title}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {new Date(meeting.date).toLocaleDateString('en-US', {
                                                                            weekday: 'short',
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })} at {meeting.time}
                                                                    </p>
                                                                </div>
                                                                <div className="flex -space-x-2">
                                                                    {meeting.attendees.slice(0, 3).map((attendee, i) => (
                                                                        <Avatar key={i} className="border-2 border-background h-8 w-8">
                                                                            <AvatarFallback>{attendee.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                                        </Avatar>
                                                                    ))}
                                                                    {meeting.attendees.length > 3 && (
                                                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm">
                                                                            +{meeting.attendees.length - 3}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    {tasks
                                                        .filter(task => {
                                                            const today = new Date()
                                                            const taskDate = new Date(task.dueDate)
                                                            return taskDate > today && taskDate.toDateString() !== today.toDateString()
                                                        })
                                                        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                                                        .slice(0, 5)
                                                        .map(task => (
                                                            <div key={task.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-accent">
                                                                <div className="bg-grey-100 rounded-full p-2 min-w-[80px] text-center">
                                                                    <div className="text-gray-500">
                                                                        Task
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">{task.title}</p>
                                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                        <span className={cn(
                                                                            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                                            task.tag === "Feature" && "bg-purple-50 text-purple-700 ring-purple-600/20",
                                                                            task.tag === "Bug" && "bg-red-50 text-red-700 ring-red-600/20",
                                                                            task.tag === "Documentation" && "bg-blue-50 text-blue-700 ring-blue-600/20"
                                                                        )}>
                                                                            {task.tag}
                                                                        </span>
                                                                        <span>Due {new Date(task.dueDate).toLocaleDateString('en-US', {
                                                                            weekday: 'short',
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Calendar Section */}
                            <Card className="lg:col-span-2 h-fit">
                                <CardHeader className="flex flex-row items-center justify-between pb-12">
                                    <CardTitle>Calendar</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Event
                                    </Button>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-4">
                                    {/* Calendar component would go here */}
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Tasks and Meetings */}
                    <div className="space-y-0">
                        {/* Tasks Section */}
                        <section id="tasks-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-40"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-500 bg-clip-text text-transparent">Tasks</h2>
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button size="sm">
                                                <Plus className="mr-2 h-4 w-4" /> Add Task
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle>Add New Task</SheetTitle>
                                                <SheetDescription>Fill in the details to add a new task to your list.</SheetDescription>
                                            </SheetHeader>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault()
                                                    const formData = new FormData(e.currentTarget)
                                                    addTask({
                                                        taskId: `TASK-${Math.floor(Math.random() * 10000)}`,
                                                        title: formData.get("title") as string,
                                                        tag: formData.get("tag") as Task['tag'],
                                                        status: formData.get("status") as Task['status'],
                                                        dueDate: formData.get("dueDate") as string,
                                                        priority: formData.get("priority") as Task['priority'],
                                                        importance: "normal",
                                                        urgency: "not-urgent"
                                                    })
                                                    e.currentTarget.reset()
                                                }}
                                                className="space-y-4 mt-4"
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor="title">Title</Label>
                                                    <Input id="title" name="title" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="tag">Type</Label>
                                                    <Select name="tag" defaultValue="Feature">
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Feature">Feature</SelectItem>
                                                            <SelectItem value="Bug">Bug</SelectItem>
                                                            <SelectItem value="Documentation">Documentation</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="status">Status</Label>
                                                    <Select name="status" defaultValue="To Do">
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="To Do">To Do</SelectItem>
                                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                                            <SelectItem value="Done">Done</SelectItem>
                                                            <SelectItem value="Backlog">Backlog</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="dueDate">Due Date</Label>
                                                    <Input id="dueDate" name="dueDate" type="date" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="priority">Priority</Label>
                                                    <Select name="priority" defaultValue="Medium">
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select priority" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Low">Low</SelectItem>
                                                            <SelectItem value="Medium">Medium</SelectItem>
                                                            <SelectItem value="High">High</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button type="submit">Add Task</Button>
                                            </form>
                                        </SheetContent>
                                    </Sheet>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px] text-xs">Task</TableHead>
                                                <TableHead className="text-xs">Title</TableHead>
                                                <TableHead className="w-[100px] text-xs">Status</TableHead>
                                                <TableHead className="w-[100px] text-xs">Importance</TableHead>
                                                <TableHead className="w-[100px] text-xs">Urgency</TableHead>
                                                <TableHead className="w-[100px] text-xs">Due Date</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTasks.map((task) => (
                                                <TableRow key={task.id}>
                                                    <TableCell className="font-medium text-sm text-muted-foreground">{task.taskId}</TableCell>
                                                    <TableCell className="font-medium text-sm text-foreground/90">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={cn(
                                                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                                    task.tag === "Feature" && "bg-purple-50 text-purple-700 ring-purple-600/20",
                                                                    task.tag === "Bug" && "bg-red-50 text-red-700 ring-red-600/20",
                                                                    task.tag === "Documentation" && "bg-blue-50 text-blue-700 ring-blue-600/20"
                                                                )}
                                                            >
                                                                {task.tag}
                                                            </span>
                                                            {task.title}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
                                                                task.status === "Done" && "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
                                                                task.status === "In Progress" && "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
                                                                task.status === "To Do" && "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20",
                                                                task.status === "Backlog" && "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20",
                                                                task.status === "Canceled" && "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                                                            )}
                                                        >
                                                            {task.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                                task.importance === "important" && "bg-red-50 text-red-700 ring-red-600/20",
                                                                task.importance === "normal" && "bg-gray-50 text-gray-700 ring-gray-600/20"
                                                            )}
                                                        >
                                                            {task.importance}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                                task.urgency === "urgent" && "bg-red-50 text-red-700 ring-red-600/20",
                                                                task.urgency === "not-urgent" && "bg-gray-50 text-gray-700 ring-gray-600/20"
                                                            )}
                                                        >
                                                            {task.urgency}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>{task.dueDate}</TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem
                                                                    onClick={() => navigator.clipboard.writeText(task.taskId)}
                                                                >
                                                                    Copy task ID
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem>View task details</DropdownMenuItem>
                                                                <DropdownMenuItem>View task history</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </section>

                        {/* Meetings Section */}
                        <section id="meetings-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50 opacity-40"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-blue-800">Meetings</h2>
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button size="sm">
                                                <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent>
                                            <SheetHeader>
                                                <SheetTitle>Schedule New Meeting</SheetTitle>
                                                <SheetDescription>Fill in the details to schedule a new meeting.</SheetDescription>
                                            </SheetHeader>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault()
                                                    const formData = new FormData(e.currentTarget)
                                                    addMeeting({
                                                        title: formData.get("title") as string,
                                                        date: formData.get("date") as string,
                                                        time: formData.get("time") as string,
                                                        attendees: (formData.get("attendees") as string).split(",").map((a) => a.trim()),
                                                    })
                                                    e.currentTarget.reset()
                                                }}
                                                className="space-y-4 mt-4"
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor="title">Title</Label>
                                                    <Input id="title" name="title" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="date">Date</Label>
                                                    <Input id="date" name="date" type="date" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="time">Time</Label>
                                                    <Input id="time" name="time" type="time" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="attendees">Attendees (comma-separated)</Label>
                                                    <Input id="attendees" name="attendees" required />
                                                </div>
                                                <Button type="submit">Schedule Meeting</Button>
                                            </form>
                                        </SheetContent>
                                    </Sheet>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px] text-xs">Meeting</TableHead>
                                                <TableHead className="text-xs">Title</TableHead>
                                                <TableHead className="w-[100px] text-xs">Date</TableHead>
                                                <TableHead className="w-[100px] text-xs">Time</TableHead>
                                                <TableHead className="w-[100px] text-xs">Attendees</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredMeetings.map((meeting) => (
                                                <TableRow key={meeting.id}>
                                                    <TableCell className="font-medium text-sm text-muted-foreground">{meeting.id}</TableCell>
                                                    <TableCell className="font-medium text-sm text-foreground/90">{meeting.title}</TableCell>
                                                    <TableCell>{new Date(meeting.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}</TableCell>
                                                    <TableCell>{meeting.time}</TableCell>
                                                    <TableCell>{meeting.attendees.join(', ')}</TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem
                                                                    onClick={() => navigator.clipboard.writeText(meeting.id)}
                                                                >
                                                                    Copy meeting ID
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem>View meeting details</DropdownMenuItem>
                                                                <DropdownMenuItem>View meeting history</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Analytics Section */}
                    <section id="analytics-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-blue-50 to-green-50 opacity-40"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent mb-6">Analytics</h2>
                            <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
                                {/* Tasks Overview */}
                                <Card className="border-indigo-100 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Tasks Overview</CardTitle>
                                        <Select defaultValue="week">
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue placeholder="Select view" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="week">This Week</SelectItem>
                                                <SelectItem value="month">This Month</SelectItem>
                                                <SelectItem value="year">This Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full">
                                            {/* Task completion chart would go here */}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Project Progress */}
                                <Card className="border-blue-100 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Project Progress</CardTitle>
                                        <Select defaultValue="month">
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue placeholder="Select view" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="month">This Month</SelectItem>
                                                <SelectItem value="quarter">This Quarter</SelectItem>
                                                <SelectItem value="year">This Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full">
                                            {/* Project progress chart would go here */}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

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