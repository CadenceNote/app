"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Notification, NotificationTitle, NotificationDescription } from "@/components/ui/notification"
import { Bell, CalendarIcon, CheckCircle, Clock, GripVertical, MoreHorizontal, Plus, Settings, Trash2, X, Users, AtSign, Check, AlertCircle, BarChart2, Link, MousePointerClick } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable, pointerWithin, rectIntersection } from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"
import { useUser } from "@/hooks/useUser"
import { useRouter } from "next/navigation"
import { Bird } from "@/components/common/Bird"

type Task = {
    id: string;
    taskId: string;
    title: string;
    tag: 'Feature' | 'Bug' | 'Documentation';
    status: 'To Do' | 'In Progress' | 'Done' | 'Backlog' | 'Canceled';
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    importance: 'important' | 'normal';
    urgency: 'urgent' | 'not-urgent';
    quadrant: 'important-urgent' | 'important-not-urgent' | 'not-important-urgent' | 'not-important-not-urgent' | 'unsorted';
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

// Mock data
const initialTasks = [
    {
        id: "1",
        taskId: "TASK-8782",
        title: "Review project proposal",
        tag: "Documentation" as const,
        status: "To Do" as const,
        dueDate: "2025-02-15",
        priority: "High" as const,
        importance: "normal" as const,
        urgency: "not-urgent" as const,
        quadrant: 'unsorted' as const
    },
    {
        id: "2",
        taskId: "TASK-7878",
        title: "Prepare presentation slides",
        tag: "Documentation" as const,
        status: "Done" as const,
        dueDate: "2025-02-10",
        priority: "Medium" as const,
        importance: "normal" as const,
        urgency: "not-urgent" as const,
        quadrant: 'unsorted' as const
    },
    {
        id: "3",
        taskId: "TASK-7839",
        title: "Schedule team meeting",
        tag: "Bug" as const,
        status: "In Progress" as const,
        dueDate: "2025-02-01",
        priority: "Low" as const,
        importance: "normal" as const,
        urgency: "not-urgent" as const,
        quadrant: 'unsorted' as const
    },
    {
        id: "4",
        taskId: "TASK-5562",
        title: "Update client documentation",
        tag: "Feature" as const,
        status: "In Progress" as const,
        dueDate: "2025-01-18",
        priority: "Medium" as const,
        importance: "normal" as const,
        urgency: "not-urgent" as const,
        quadrant: 'unsorted' as const
    },
    {
        id: "5",
        taskId: "TASK-1280",
        title: "Finalize Q3 budget",
        tag: "Feature" as const,
        status: "To Do" as const,
        dueDate: "2025-02-02",
        priority: "High" as const,
        importance: "normal" as const,
        urgency: "not-urgent" as const,
        quadrant: 'unsorted' as const
    },
].map(task => ({ ...task, quadrant: 'unsorted' as const }))

const initialMeetings = [
    {
        id: "1",
        title: "Weekly standup",
        time: "10:00 AM",
        date: "2025-02-02",
        attendees: ["John D.", "Alice K.", "Bob M."],
        isImportant: false
    },
    { id: "2", title: "Client presentation", time: "2:00 PM", date: "2025-01-16", attendees: ["John D.", "Emma S."], isImportant: false },

    {
        id: "3",
        title: "Project review",
        time: "4:30 PM",
        date: "2025-02-17",
        attendees: ["John D.", "Charlie R.", "Diana T.", "Frank O."],
        isImportant: false
    },
]

const taskCompletionData = [
    { name: "Mon", completed: 3, total: 5 },
    { name: "Tue", completed: 5, total: 8 },
    { name: "Wed", completed: 7, total: 10 },
    { name: "Thu", completed: 4, total: 6 },
    { name: "Fri", completed: 6, total: 9 },
]

const projectProgressData = [
    { name: "Week 1", actual: 20, expected: 25 },
    { name: "Week 2", actual: 40, expected: 50 },
    { name: "Week 3", actual: 65, expected: 75 },
    { name: "Week 4", actual: 90, expected: 100 },
]

// Add mock alerts data
const initialAlerts = [
    {
        id: "1",
        type: "meeting_invite",
        title: "New Meeting Invitation",
        description: "John invited you to 'Q1 Planning Meeting'",
        timestamp: "2024-03-15T10:00:00Z",
        isRead: false
    },
    {
        id: "2",
        type: "task_assignment",
        title: "New Task Assignment",
        description: "Alice assigned you to 'Review Documentation'",
        timestamp: "2024-03-15T09:30:00Z",
        isRead: false
    },
    {
        id: "3",
        type: "team_invite",
        title: "Team Invitation",
        description: "You've been invited to join 'Product Team'",
        timestamp: "2024-03-15T09:00:00Z",
        isRead: false
    }
]

function SortableItem({
    item,
    onDelete,
    type,
}: {
    item: Task | Meeting;
    onDelete: (id: string) => void;
    type: "task" | "meeting";
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: item.id,
        data: {
            type,
            item
        }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab'
    }

    if (type === "task") {
        const task = item as Task
        return (
            <li
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={cn(
                    "flex items-center justify-between p-2 rounded-md",
                    isDragging ? "bg-accent/50" : "hover:bg-accent"
                )}
            >
                <div className="flex items-center flex-1 min-w-0">
                    <div className="ml-2 flex-1 min-w-0">
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
                            <span className="font-medium truncate">{task.title}</span>
                            <span
                                className={cn(
                                    "text-xs px-2 py-1 rounded-full",
                                    task.status === "Done" && "bg-green-100 text-green-800",
                                    task.status === "In Progress" && "bg-blue-100 text-blue-800",
                                    task.status === "To Do" && "bg-yellow-100 text-yellow-800"
                                )}
                            >
                                {task.status}
                            </span>
                            <span
                                className={cn(
                                    "text-xs px-2 py-1 rounded-full",
                                    task.priority === "High" && "bg-red-100 text-red-800",
                                    task.priority === "Medium" && "bg-orange-100 text-orange-800",
                                    task.priority === "Low" && "bg-green-100 text-green-800"
                                )}
                            >
                                {task.priority}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </li>
        )
    } else {
        const meeting = item as Meeting
        return (
            <li
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={cn(
                    "flex items-center justify-between p-2 rounded-md",
                    isDragging ? "bg-accent/50" : "hover:bg-accent"
                )}
            >
                <div className="flex items-center flex-1 min-w-0">
                    <div className="ml-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{meeting.title}</span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(meeting.date + 'T' + meeting.time).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{new Date(meeting.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="truncate">{meeting.attendees.join(', ')}</span>
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(meeting.id);
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </li>
        )
    }
}

function DroppableContainer({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id
    });

    return (
        <div className="h-full w-full">
            <Card className={cn(
                "h-full transition-colors",
                isOver && "ring-2 ring-primary"
            )}>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        ref={setNodeRef}
                        className={cn(
                            "min-h-[200px] rounded-md p-2",
                            isOver && "bg-accent/10"
                        )}
                    >
                        {children}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function DashboardPage() {
    const [isMounted, setIsMounted] = useState(false)
    const { user } = useUser()
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings.map(meeting => ({ ...meeting, isImportant: false })))
    const [searchTerm, setSearchTerm] = useState("")
    const [notifications, setNotifications] = useState<{ id: string; title: string; description: string }[]>([])
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)
    const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month'>('week')
    const [timeUpdateKey, setTimeUpdateKey] = useState(0)
    const [activeSection, setActiveSection] = useState('summary-section');
    const router = useRouter();

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const deleteMeeting = (id: string) => {
        setMeetings(meetings.filter(meeting => meeting.id !== id));
    };

    const addTask = (newTask: Omit<Task, 'id'> & { taskId: string }) => {
        setTasks([...tasks, { ...newTask, id: Math.random().toString(36).substr(2, 9) }]);
    };

    const addMeeting = (newMeeting: Omit<Meeting, 'id' | 'isImportant'>) => {
        setMeetings([...meetings, {
            ...newMeeting,
            id: Math.random().toString(36).substr(2, 9),
            isImportant: false
        }]);
    };

    const removeNotification = (id: string) => {
        setNotifications(notifications.filter(notification => notification.id !== id));
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any, type: "tasks" | "meetings") => {
        const { active } = event;
        setActiveId(active.id);

        if (type === "tasks") {
            const task = tasks.find((t) => t.id === active.id);
            if (task) {
                setActiveTask(task);
            }
        } else {
            const meeting = meetings.find((m) => m.id === active.id);
            if (meeting) {
                setActiveMeeting(meeting);
            }
        }
    };

    const handleDragEnd = (event: any, type: "tasks" | "meetings") => {
        const { active, over } = event;
        setActiveId(null);
        setActiveTask(null);
        setActiveMeeting(null);

        if (!over) return;

        if (type === "tasks") {
            const taskId = active.id;
            const targetQuadrant = over.id as Task['quadrant'];
            const task = tasks.find((item) => item.id === taskId);

            if (!task || task.quadrant === targetQuadrant) return;

            // Update both quadrant and importance/urgency based on the drop target
            setTasks((items) => items.map((item) => {
                if (item.id !== taskId) return item;

                const updates = {
                    quadrant: targetQuadrant,
                    importance: 'normal' as const,
                    urgency: 'not-urgent' as const
                };

                switch (targetQuadrant) {
                    case 'important-urgent':
                        updates.importance = 'important';
                        updates.urgency = 'urgent';
                        break;
                    case 'important-not-urgent':
                        updates.importance = 'important';
                        updates.urgency = 'not-urgent';
                        break;
                    case 'not-important-urgent':
                        updates.importance = 'normal';
                        updates.urgency = 'urgent';
                        break;
                    case 'not-important-not-urgent':
                        updates.importance = 'normal';
                        updates.urgency = 'not-urgent';
                        break;
                }

                return { ...item, ...updates };
            }));
        } else if (type === "meetings") {
            const meetingId = active.id;
            const isTargetImportant = over.id === 'important';
            const meeting = meetings.find((item) => item.id === meetingId);

            // If meeting not found or dropped in same section, do nothing
            if (!meeting || meeting.isImportant === isTargetImportant) return;

            // Update the meeting's importance
            setMeetings((items) => items.map((item) =>
                item.id === meetingId
                    ? { ...item, isImportant: isTargetImportant }
                    : item
            ));
        }
    }

    const filteredTasks = tasks.filter(
        (task) =>
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.priority.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const filteredMeetings = meetings.filter(
        (meeting) =>
            meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            meeting.date.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Calculate stats based on period
    const calculateStats = () => {
        const now = new Date()
        let periodStart: Date

        switch (statsPeriod) {
            case 'day':
                periodStart = new Date(now.setHours(0, 0, 0, 0))
                break
            case 'week':
                periodStart = new Date(now.setDate(now.getDate() - 7))
                break
            case 'month':
                periodStart = new Date(now.setMonth(now.getMonth() - 1))
                break
        }

        // Calculate task stats
        const activeTasks = tasks.filter(task => task.status !== 'Done').length
        const dueThisWeek = tasks.filter(task => {
            const dueDate = new Date(task.dueDate)
            const weekFromNow = new Date()
            weekFromNow.setDate(weekFromNow.getDate() + 7)
            return dueDate <= weekFromNow && task.status !== 'Done'
        }).length

        // Calculate meeting stats
        const upcomingMeetings = meetings.filter(meeting =>
            new Date(meeting.date + 'T' + meeting.time) > new Date()
        ).length
        const meetingsThisWeek = meetings.filter(meeting => {
            const meetingDate = new Date(meeting.date)
            const weekFromNow = new Date()
            weekFromNow.setDate(weekFromNow.getDate() + 7)
            return meetingDate <= weekFromNow
        }).length

        // Mock team stats (replace with real data when available)
        const teamTotal = 8
        const teamActive = 6

        return {
            tasks: {
                active: activeTasks,
                dueThisWeek: dueThisWeek
            },
            meetings: {
                upcoming: upcomingMeetings,
                thisWeek: meetingsThisWeek
            },
            team: {
                total: teamTotal,
                active: teamActive
            }
        }
    }

    const stats = calculateStats()

    const navigateToSettings = () => {
        router.push('dashboard/settings')
    }
    // Add an effect to update relative times periodically
    useEffect(() => {
        if (!isMounted) return

        const interval = setInterval(() => {
            setTimeUpdateKey(prev => prev + 1)
        }, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [isMounted])
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
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-card text-card-foreground border-r border-border/40 backdrop-blur-sm fixed h-screen overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-indigo-500"></div>
                        <h2 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-indigo-600 bg-clip-text text-transparent">
                            Personal Dashboard
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
                    <h1 className="text-2xl  ">👋 Hey, {user?.full_name ?? 'Guest'}</h1>
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
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback>JD</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Profile</DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuItem>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Dashboard content */}
                <div className="space-y-0 pt-6">
                    {/* Stats Overview */}
                    {/* Background decoration */}
                    <section id="summary-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 opacity-40"></div>

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
                    </section>

                    {/* Calendar and Upcoming Events sections */}
                    <section id="calendar-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50 opacity-40"></div>
                        <div className="relative z-10  grid gap-4 md:gap-6 lg:grid-cols-7">

                            {/* Upcoming Events Section */}
                            <div className="space-y-4 md:space-y-6 lg:col-span-5 relative z-10">
                                <Card className="h-full">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle>Upcoming Events</CardTitle>
                                        <div className="flex items-center space-x-2">
                                            <Button variant="outline" size="sm">
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
                                                                <div className="bg-grey-100 rounded-full p-2 min-w-[80px]  text-center">
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
                                                                    <p className="font-medium truncate"> {meeting.title}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {new Date(meeting.date).toLocaleDateString('en-US', {
                                                                            weekday: 'short',
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })} at {meeting.time}
                                                                    </p>
                                                                </div>
                                                                <div className="text-gray-400">
                                                                    Meeting
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
                            <Card className="lg:col-span-2 h-fit relative z-10">
                                <CardHeader className="flex flex-row items-center justify-between pb-12">
                                    <CardTitle>Calendar</CardTitle>
                                    <Button variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Event
                                    </Button>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-4">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        className="rounded-md border"
                                        components={{
                                            Day: ({ date: dayDate, displayMonth, ...props }) => {  // do NOT remove displayMonth, or will have error
                                                if (!dayDate) return <div {...props} />

                                                const formattedDate = dayDate.toISOString().split("T")[0]
                                                const tasksForDay = tasks.filter((task) => task.dueDate === formattedDate)
                                                const meetingsForDay = meetings.filter((meeting) => meeting.date === formattedDate)
                                                const hasEvents = tasksForDay.length > 0 || meetingsForDay.length > 0
                                                const totalEvents = tasksForDay.length + meetingsForDay.length

                                                return (
                                                    <div
                                                        {...props}
                                                        className={cn(
                                                            "group relative p-0 text-center focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                                                            props.className
                                                        )}
                                                    >
                                                        <div className="relative h-10 w-full">
                                                            <button
                                                                onClick={() => setDate(dayDate)}
                                                                className={cn(
                                                                    "absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-md hover:bg-accent transition-colors",
                                                                    hasEvents && "font-medium"
                                                                )}
                                                            >
                                                                <span className="text-sm">{dayDate.getDate()}</span>
                                                                {hasEvents && (
                                                                    <span className="flex h-1 items-center gap-0.5">
                                                                        {tasksForDay.length > 0 && (
                                                                            <span className="h-1 w-1 rounded-full bg-[var(--calendar-task-color)]" />
                                                                        )}
                                                                        {meetingsForDay.length > 0 && (
                                                                            <span className="h-1 w-1 rounded-full bg-[var(--calendar-meeting-color)]" />
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </button>

                                                            {/* Event Preview Tooltip */}
                                                            {hasEvents && (
                                                                <div className="invisible group-hover:visible absolute left-1/2 bottom-full z-50 mb-2 -translate-x-1/2">
                                                                    <div className="w-64 rounded-lg bg-popover px-3 py-2 text-sm shadow-md">
                                                                        <div className="mb-1.5 flex items-center justify-between border-b pb-1">
                                                                            <span className="font-medium">
                                                                                {dayDate.toLocaleDateString('en-US', {
                                                                                    month: 'short',
                                                                                    day: 'numeric'
                                                                                })}
                                                                            </span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {totalEvents} {totalEvents === 1 ? 'event' : 'events'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-1 max-h-[150px] overflow-y-auto">
                                                                            {tasksForDay.map((task) => (
                                                                                <div key={task.id} className="flex items-center gap-2 text-xs">
                                                                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--calendar-task-color)]" />
                                                                                    <span className="truncate flex-1">{task.title}</span>
                                                                                    <span className="text-muted-foreground">{task.priority}</span>
                                                                                </div>
                                                                            ))}
                                                                            {meetingsForDay.map((meeting) => (
                                                                                <div key={meeting.id} className="flex items-center gap-2 text-xs">
                                                                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--calendar-meeting-color)]" />
                                                                                    <span className="truncate flex-1">{meeting.title}</span>
                                                                                    <span className="text-muted-foreground">{meeting.time}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-popover" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        }}
                                    />

                                    {/* Selected Date Events */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-semibold">
                                                {date ? (
                                                    `Events on ${date.toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}`
                                                ) : (
                                                    'Select a date to view events'
                                                )}
                                            </h4>
                                            {date && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDate(undefined)}
                                                    className="text-xs"
                                                >
                                                    Clear selection
                                                </Button>
                                            )}
                                        </div>

                                        {date && (
                                            <div className="space-y-3">
                                                {/* Tasks for selected date */}
                                                {tasks
                                                    .filter(task => task.dueDate === date.toISOString().split('T')[0])
                                                    .length > 0 && (
                                                        <div className="space-y-1">
                                                            <h5 className="text-sm font-medium text-muted-foreground">Tasks</h5>
                                                            {tasks
                                                                .filter(task => task.dueDate === date.toISOString().split('T')[0])
                                                                .map(task => (
                                                                    <div key={task.id} className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-accent">
                                                                        <div className={cn(
                                                                            "h-2 w-2 rounded-full",
                                                                            task.priority === "High" && "bg-red-500",
                                                                            task.priority === "Medium" && "bg-yellow-500",
                                                                            task.priority === "Low" && "bg-green-500"
                                                                        )} />
                                                                        <span className="flex-1 truncate">{task.title}</span>
                                                                        <span className={cn(
                                                                            "text-xs px-2 py-1 rounded-full",
                                                                            task.status === "Done" && "bg-green-100 text-green-800",
                                                                            task.status === "In Progress" && "bg-blue-100 text-blue-800",
                                                                            task.status === "To Do" && "bg-yellow-100 text-yellow-800"
                                                                        )}>
                                                                            {task.status}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}

                                                {/* Meetings for selected date */}
                                                {meetings
                                                    .filter(meeting => meeting.date === date.toISOString().split('T')[0])
                                                    .length > 0 && (
                                                        <div className="space-y-1">
                                                            <h5 className="text-sm font-medium text-muted-foreground">Meetings</h5>
                                                            {meetings
                                                                .filter(meeting => meeting.date === date.toISOString().split('T')[0])
                                                                .sort((a, b) => {
                                                                    const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
                                                                    const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
                                                                    return timeA - timeB;
                                                                })
                                                                .map(meeting => (
                                                                    <div key={meeting.id} className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-accent">
                                                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                                        <span className="flex-1 truncate">{meeting.title}</span>
                                                                        <span className="text-xs font-medium text-muted-foreground">{meeting.time}</span>
                                                                        <div className="flex -space-x-2">
                                                                            {meeting.attendees.slice(0, 2).map((attendee, i) => (
                                                                                <Avatar key={i} className="border-2 border-background h-6 w-6">
                                                                                    <AvatarFallback className="text-xs">{attendee.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                                                </Avatar>
                                                                            ))}
                                                                            {meeting.attendees.length > 2 && (
                                                                                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs">
                                                                                    +{meeting.attendees.length - 2}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}

                                                {tasks.filter(task => task.dueDate === date.toISOString().split('T')[0]).length === 0 &&
                                                    meetings.filter(meeting => meeting.date === date.toISOString().split('T')[0]).length === 0 && (
                                                        <div className="text-sm text-muted-foreground text-center py-2">
                                                            No events scheduled for this date
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Tasks and Meetings */}
                    <div className="mt-6 space-y-6">
                        {/* Tasks Section */}

                        <section id="tasks-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">Tasks</h2>
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
                                                        <SelectItem value="Canceled">Canceled</SelectItem>
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

                            <Tabs defaultValue="matrix" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="matrix">Matrix View</TabsTrigger>
                                    <TabsTrigger value="list">List View</TabsTrigger>
                                </TabsList>

                                <TabsContent value="matrix">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={pointerWithin}
                                        onDragStart={(event) => handleDragStart(event, "tasks")}
                                        onDragEnd={(event) => handleDragEnd(event, "tasks")}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="grid grid-cols-1 gap-8 h-full">
                                                <DroppableContainer id="important-urgent" title="Important & Urgent">
                                                    <SortableContext items={filteredTasks.filter(task => task.quadrant === 'important-urgent')} strategy={verticalListSortingStrategy}>
                                                        <ul className="space-y-2">
                                                            {filteredTasks
                                                                .filter(task => task.quadrant === 'important-urgent')
                                                                .map((task) => (
                                                                    <SortableItem key={task.id} item={task} onDelete={deleteTask} type="task" />
                                                                ))}
                                                        </ul>
                                                    </SortableContext>
                                                </DroppableContainer>

                                                <DroppableContainer id="important-not-urgent" title="Important & Not Urgent">
                                                    <SortableContext items={filteredTasks.filter(task => task.quadrant === 'important-not-urgent')} strategy={verticalListSortingStrategy}>
                                                        <ul className="space-y-2">
                                                            {filteredTasks
                                                                .filter(task => task.quadrant === 'important-not-urgent')
                                                                .map((task) => (
                                                                    <SortableItem key={task.id} item={task} onDelete={deleteTask} type="task" />
                                                                ))}
                                                        </ul>
                                                    </SortableContext>
                                                </DroppableContainer>
                                            </div>

                                            <div className="grid grid-cols-1 gap-8 h-full">
                                                <DroppableContainer id="not-important-urgent" title="Not Important & Urgent">
                                                    <SortableContext items={filteredTasks.filter(task => task.quadrant === 'not-important-urgent')} strategy={verticalListSortingStrategy}>
                                                        <ul className="space-y-2">
                                                            {filteredTasks
                                                                .filter(task => task.quadrant === 'not-important-urgent')
                                                                .map((task) => (
                                                                    <SortableItem key={task.id} item={task} onDelete={deleteTask} type="task" />
                                                                ))}
                                                        </ul>
                                                    </SortableContext>
                                                </DroppableContainer>

                                                <DroppableContainer id="not-important-not-urgent" title="Not Important & Not Urgent">
                                                    <SortableContext items={filteredTasks.filter(task => task.quadrant === 'not-important-not-urgent')} strategy={verticalListSortingStrategy}>
                                                        <ul className="space-y-2">
                                                            {filteredTasks
                                                                .filter(task => task.quadrant === 'not-important-not-urgent')
                                                                .map((task) => (
                                                                    <SortableItem key={task.id} item={task} onDelete={deleteTask} type="task" />
                                                                ))}
                                                        </ul>
                                                    </SortableContext>
                                                </DroppableContainer>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <DroppableContainer id="unsorted" title="Unsorted Tasks">
                                                <SortableContext items={filteredTasks.filter(task => task.quadrant === 'unsorted')} strategy={verticalListSortingStrategy}>
                                                    <ul className="space-y-2">
                                                        {filteredTasks
                                                            .filter(task => task.quadrant === 'unsorted')
                                                            .map((task) => (
                                                                <SortableItem key={task.id} item={task} onDelete={deleteTask} type="task" />
                                                            ))}
                                                    </ul>
                                                </SortableContext>
                                            </DroppableContainer>
                                        </div>

                                        <DragOverlay>
                                            {activeTask ? <SortableItem item={activeTask} onDelete={deleteTask} type="task" /> : null}
                                        </DragOverlay>
                                    </DndContext>
                                </TabsContent>

                                <TabsContent value="list">
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
                                                                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", "bg-gray-50 text-gray-700 ring-gray-600/20",
                                                                        task.tag === "Feature",
                                                                        task.tag === "Bug",
                                                                        task.tag === "Documentation"
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
                                                                    task.importance === "normal" && "bg-gray-50 text-gray-700 ring-gray-600/20",
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
                                </TabsContent>
                            </Tabs>
                        </section>

                        {/* Meetings Section */}
                        <section id="meetings-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-40"></div>

                            <div className="flex items-center justify-between relative z-10">
                                <h2 className="text-2xl font-bold">Meetings</h2>
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
                                                    isImportant: false
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={pointerWithin}
                                    onDragStart={(event) => handleDragStart(event, "meetings")}
                                    onDragEnd={(event) => handleDragEnd(event, "meetings")}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DroppableContainer id="important" title="Important Meetings">
                                            <SortableContext
                                                items={filteredMeetings.filter(meeting => meeting.isImportant)
                                                    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <ul className="space-y-2">
                                                    {filteredMeetings
                                                        .filter(meeting => meeting.isImportant)
                                                        .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                                                        .map((meeting) => (
                                                            <SortableItem key={meeting.id} item={meeting} onDelete={deleteMeeting} type="meeting" />
                                                        ))}
                                                </ul>
                                            </SortableContext>
                                        </DroppableContainer>

                                        <DroppableContainer id="other" title="Other Meetings">
                                            <SortableContext
                                                items={filteredMeetings.filter(meeting => !meeting.isImportant)
                                                    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <ul className="space-y-2">
                                                    {filteredMeetings
                                                        .filter(meeting => !meeting.isImportant)
                                                        .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                                                        .map((meeting) => (
                                                            <SortableItem key={meeting.id} item={meeting} onDelete={deleteMeeting} type="meeting" />
                                                        ))}
                                                </ul>
                                            </SortableContext>
                                        </DroppableContainer>
                                    </div>

                                    <DragOverlay>
                                        {activeMeeting ? <SortableItem item={activeMeeting} onDelete={deleteMeeting} type="meeting" /> : null}
                                    </DragOverlay>
                                </DndContext>
                            </div>
                        </section>
                    </div>

                    {/* Charts Section - Moved to bottom */}
                    <section id="analytics-section" className="min-h-screen p-4 md:p-6 relative scroll-mt-20">
                        <h2 className="text-2xl font-bold">Analytics</h2>
                        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
                            {/* Tasks Overview */}
                            <Card className="transition-shadow hover:shadow-md">
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
                                    <ChartContainer
                                        config={{
                                            completed: {
                                                label: "Completed",
                                                color: "hsl(var(--chart-primary))",
                                            },
                                            total: {
                                                label: "Total",
                                                color: "hsl(var(--chart-secondary))",
                                            },
                                        }}
                                        className="h-[300px] w-full"
                                    >
                                        <BarChart data={taskCompletionData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dx={-10}
                                            />
                                            <Bar
                                                dataKey="completed"
                                                fill="hsl(var(--chart-primary))"
                                                radius={[4, 4, 0, 0]}
                                                cursor="pointer"
                                            />
                                            <Bar
                                                dataKey="total"
                                                fill="hsl(var(--chart-secondary))"
                                                radius={[4, 4, 0, 0]}
                                                cursor="pointer"
                                            />
                                            <ChartTooltip
                                                content={<ChartTooltipContent />}
                                                cursor={{
                                                    fill: 'hsl(var(--muted))',
                                                    opacity: 0.1
                                                }}
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--background))",
                                                    border: "1px solid hsl(var(--border))",
                                                    borderRadius: "var(--radius)",
                                                    padding: "8px",
                                                }}
                                            />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            {/* Project Progress */}
                            <Card className="transition-shadow hover:shadow-md">
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
                                    <ChartContainer
                                        config={{
                                            actual: {
                                                label: "Actual",
                                                color: "hsl(var(--chart-success))",
                                            },
                                            expected: {
                                                label: "Expected",
                                                color: "hsl(var(--chart-muted))",
                                            },
                                        }}
                                        className="h-[300px] w-full"
                                    >
                                        <LineChart data={projectProgressData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dx={-10}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="actual"
                                                stroke="hsl(var(--chart-success))"
                                                strokeWidth={2}
                                                dot={{
                                                    fill: "hsl(var(--background))",
                                                    r: 4,
                                                    strokeWidth: 2,
                                                    stroke: "hsl(var(--chart-success))"
                                                }}
                                                activeDot={{
                                                    r: 6,
                                                    stroke: "hsl(var(--chart-success))",
                                                    strokeWidth: 2,
                                                    fill: "hsl(var(--background))"
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="expected"
                                                stroke="hsl(var(--chart-muted))"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={{
                                                    fill: "hsl(var(--background))",
                                                    r: 4,
                                                    strokeWidth: 2,
                                                    stroke: "hsl(var(--chart-muted))"
                                                }}
                                                activeDot={{
                                                    r: 6,
                                                    stroke: "hsl(var(--chart-muted))",
                                                    strokeWidth: 2,
                                                    fill: "hsl(var(--background))"
                                                }}
                                            />
                                            <ChartTooltip
                                                content={<ChartTooltipContent />}
                                                cursor={{ stroke: 'hsl(var(--chart-grid))' }}
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--background))",
                                                    border: "1px solid hsl(var(--border))",
                                                    borderRadius: "var(--radius)",
                                                    padding: "8px",
                                                }}
                                            />
                                        </LineChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

