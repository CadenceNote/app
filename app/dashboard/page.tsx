"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Bell, CalendarIcon, CheckCircle, Clock, GripVertical, Plus, Settings, Trash2, X } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

// Mock data
const initialTasks = [
    { id: "1", title: "Review project proposal", status: "To Do", dueDate: "2025-02-15", priority: "High" },
    { id: "2", title: "Prepare presentation slides", status: "Done", dueDate: "2025-02-10", priority: "Medium" },
    { id: "3", title: "Schedule team meeting", status: "In Progress", dueDate: "2025-02-01", priority: "Low" },
    { id: "4", title: "Update client documentation", status: "In Progress", dueDate: "2025-01-18", priority: "Medium" },
    { id: "5", title: "Finalize Q3 budget", status: "To Do", dueDate: "2025-02-02", priority: "High" },
]

const initialMeetings = [
    {
        id: "1",
        title: "Weekly standup",
        time: "10:00 AM",
        date: "2025-02-02",
        attendees: ["John D.", "Alice K.", "Bob M."],
    },
    { id: "2", title: "Client presentation", time: "2:00 PM", date: "2025-01-16", attendees: ["John D.", "Emma S."] },

    {
        id: "3",
        title: "Project review",
        time: "4:30 PM",
        date: "2025-02-17",
        attendees: ["John D.", "Charlie R.", "Diana T.", "Frank O."],

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

function SortableItem({
    item,
    onDelete,
    type,
}: { item: any; onDelete: (id: string) => void; type: "task" | "meeting" }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
        >
            <div className="flex items-center">
                <span {...listeners}>
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                </span>
                <div className="ml-2">
                    <span className="font-medium">{item.title}</span>
                    {type === "task" && (
                        <>
                            <span
                                className={`ml-2 text-sm px-2 py-1 rounded-full ${item.status === "Done"
                                    ? "bg-green-100 text-green-800"
                                    : item.status === "In Progress"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                            >
                                {item.status}
                            </span>
                            <span
                                className={`ml-2 text-sm px-2 py-1 rounded-full ${item.priority === "High"
                                    ? "bg-red-100 text-red-800"
                                    : item.priority === "Medium"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                            >
                                {item.priority}
                            </span>
                        </>
                    )}
                    {type === "meeting" && <span className="ml-2 text-sm text-muted-foreground">{item.time}</span>}
                </div>
            </div>
            <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-2">{item.dueDate || item.date}</span>
                <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </li>
    )
}

export default function DashboardPage() {
    const { theme, setTheme } = useTheme()
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [tasks, setTasks] = useState(initialTasks)
    const [meetings, setMeetings] = useState(initialMeetings)
    const [searchTerm, setSearchTerm] = useState("")
    const [notifications, setNotifications] = useState<{ id: string; title: string; description: string }[]>([])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    )

    const handleDragEnd = (event: any, type: "tasks" | "meetings") => {
        const { active, over } = event

        if (active.id !== over.id) {
            const setter = type === "tasks" ? setTasks : setMeetings
            setter((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)

                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const addTask = (newTask: any) => {
        setTasks([...tasks, { ...newTask, id: (tasks.length + 1).toString() }])
        addNotification(`New task added: ${newTask.title}`, "Task has been successfully added to your list.")
    }

    const addMeeting = (newMeeting: any) => {
        setMeetings([...meetings, { ...newMeeting, id: (meetings.length + 1).toString() }])
        addNotification(
            `New meeting scheduled: ${newMeeting.title}`,
            `Meeting scheduled for ${newMeeting.date} at ${newMeeting.time}`,
        )
    }

    const deleteTask = (id: string) => {
        setTasks(tasks.filter((task) => task.id !== id))
        addNotification("Task deleted", "The task has been removed from your list.")
    }

    const deleteMeeting = (id: string) => {
        setMeetings(meetings.filter((meeting) => meeting.id !== id))
        addNotification("Meeting cancelled", "The meeting has been removed from your schedule.")
    }

    const addNotification = (title: string, description: string) => {
        const newNotification = { id: Date.now().toString(), title, description }
        setNotifications((prev) => [newNotification, ...prev])
    }

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id))
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

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-card text-card-foreground p-4 hidden md:block">
                <div className="flex items-center mb-8">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 font-semibold">John Doe</span>
                </div>
                <nav>
                    <Button variant="ghost" className="w-full justify-start mb-2">
                        <CheckCircle className="mr-2 h-4 w-4" /> Tasks
                    </Button>
                    <Button variant="ghost" className="w-full justify-start mb-2">
                        <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
                    </Button>
                    <Button variant="ghost" className="w-full justify-start mb-2">
                        <Clock className="mr-2 h-4 w-4" /> Time Tracking
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" /> Settings
                    </Button>
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto bg-background">
                {/* Header */}
                <header className="bg-background border-b p-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
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
                <div className="p-4 md:p-6 space-y-6 max-w-[1800px]">
                    <div className="grid gap-4 md:gap-6 lg:grid-cols-7">
                        {/* Main Charts Section */}
                        <div className="space-y-4 md:space-y-6 lg:col-span-5">
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

                        {/* Calendar Section */}
                        <Card className="lg:col-span-2 h-fit transition-shadow hover:shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
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
                                        Day: ({ date: dayDate, ...props }) => {
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

                                {/* Events Section */}
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
                                                'Upcoming Events'
                                            )}
                                        </h4>
                                        {date && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDate(undefined)}
                                                className="text-xs"
                                            >
                                                Show upcoming
                                            </Button>
                                        )}
                                    </div>

                                    {date ? (
                                        // Selected date events
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
                                                                <div key={task.id} className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted">
                                                                    <div className="h-2 w-2 rounded-full bg-[var(--calendar-task-color)]" />
                                                                    <span className="flex-1 truncate">{task.title}</span>
                                                                    <span className="text-xs font-medium">{task.priority}</span>
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
                                                            .map(meeting => (
                                                                <div key={meeting.id} className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted">
                                                                    <div className="h-2 w-2 rounded-full bg-[var(--calendar-meeting-color)]" />
                                                                    <span className="flex-1 truncate">{meeting.title}</span>
                                                                    <span className="text-xs font-medium">{meeting.time}</span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}

                                            {tasks.filter(task => task.dueDate === date.toISOString().split('T')[0]).length === 0 &&
                                                meetings.filter(meeting => meeting.date === date.toISOString().split('T')[0]).length === 0 && (
                                                    <div className="text-sm text-muted-foreground text-center py-2">
                                                        No events scheduled
                                                    </div>
                                                )}
                                        </div>
                                    ) : (
                                        // Next upcoming events
                                        (() => {
                                            const now = new Date();
                                            // Process tasks
                                            const upcomingTasks = tasks
                                                .map(task => ({
                                                    ...task,
                                                    type: 'task',
                                                    eventDate: new Date(`${task.dueDate}T00:00:00`)
                                                }))
                                                .filter(task => task.eventDate > now)
                                                .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
                                                .slice(0, 2);

                                            // Process meetings
                                            const upcomingMeetings = meetings
                                                .map(meeting => {
                                                    const time = meeting.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                                                    let hours = parseInt(time?.[1] || "0");
                                                    const minutes = time?.[2] || "00";
                                                    const meridiem = time?.[3]?.toUpperCase() || "AM";

                                                    if (meridiem === "PM" && hours < 12) hours += 12;
                                                    if (meridiem === "AM" && hours === 12) hours = 0;

                                                    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes}:00`;

                                                    return {
                                                        ...meeting,
                                                        type: 'meeting',
                                                        eventDate: new Date(`${meeting.date}T${timeStr}`)
                                                    };
                                                })
                                                .filter(meeting => meeting.eventDate > now)
                                                .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
                                                .slice(0, 2);

                                            if (upcomingTasks.length > 0 || upcomingMeetings.length > 0) {
                                                return (
                                                    <div className="space-y-3">
                                                        {/* Upcoming Tasks */}
                                                        {upcomingTasks.length > 0 && (
                                                            <div className="space-y-1">
                                                                <h5 className="text-sm font-medium text-muted-foreground">Tasks Due</h5>
                                                                {upcomingTasks.map((task) => (
                                                                    <div
                                                                        key={task.id}
                                                                        className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted"
                                                                    >
                                                                        <div className="h-2 w-2 rounded-full bg-[var(--calendar-task-color)]" />
                                                                        <span className="flex-1 truncate">{task.title}</span>
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {task.eventDate.toLocaleDateString('en-US', {
                                                                                    weekday: 'short',
                                                                                    month: 'short',
                                                                                    day: 'numeric'
                                                                                })}
                                                                            </span>
                                                                            <span className="text-xs font-medium">{task.priority}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Upcoming Meetings */}
                                                        {upcomingMeetings.length > 0 && (
                                                            <div className="space-y-1">
                                                                <h5 className="text-sm font-medium text-muted-foreground">Scheduled Meetings</h5>
                                                                {upcomingMeetings.map((meeting) => (
                                                                    <div
                                                                        key={meeting.id}
                                                                        className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted"
                                                                    >
                                                                        <div className="h-2 w-2 rounded-full bg-[var(--calendar-meeting-color)]" />
                                                                        <span className="flex-1 truncate">{meeting.title}</span>
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {meeting.eventDate.toLocaleDateString('en-US', {
                                                                                    weekday: 'short',
                                                                                    month: 'short',
                                                                                    day: 'numeric'
                                                                                })}
                                                                            </span>
                                                                            <span className="text-xs font-medium">{meeting.time}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="text-sm text-muted-foreground text-center py-2">
                                                    No upcoming events
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tasks and Meetings */}
                    <div className="mt-6">
                        <Tabs defaultValue="tasks">
                            <TabsList>
                                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                                <TabsTrigger value="meetings">Meetings</TabsTrigger>
                            </TabsList>
                            <TabsContent value="tasks">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Tasks</CardTitle>
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
                                                            title: formData.get("title") as string,
                                                            status: formData.get("status") as string,
                                                            dueDate: formData.get("dueDate") as string,
                                                            priority: formData.get("priority") as string,
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
                                                        <Label htmlFor="status">Status</Label>
                                                        <Select name="status" defaultValue="To Do">
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="To Do">To Do</SelectItem>
                                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                                <SelectItem value="Done">Done</SelectItem>
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
                                    </CardHeader>
                                    <CardContent>
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={(event) => handleDragEnd(event, "tasks")}
                                        >
                                            <SortableContext items={filteredTasks} strategy={verticalListSortingStrategy}>
                                                <ul className="space-y-2">
                                                    {filteredTasks.map((task) => (
                                                        <SortableItem key={task.id} item={task} onDelete={deleteTask} type="task" />
                                                    ))}
                                                </ul>
                                            </SortableContext>
                                        </DndContext>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="meetings">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Meetings</CardTitle>
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
                                    </CardHeader>
                                    <CardContent>
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={(event) => handleDragEnd(event, "meetings")}
                                        >
                                            <SortableContext items={filteredMeetings} strategy={verticalListSortingStrategy}>
                                                <ul className="space-y-2">
                                                    {filteredMeetings.map((meeting) => (
                                                        <SortableItem key={meeting.id} item={meeting} onDelete={deleteMeeting} type="meeting" />
                                                    ))}
                                                </ul>
                                            </SortableContext>
                                        </DndContext>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    )
}

