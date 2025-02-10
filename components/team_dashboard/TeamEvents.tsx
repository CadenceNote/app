import { Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardTitle, CardHeader } from "../ui/card"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { cn } from "@/lib/utils"
import { Calendar } from "../ui/calendar"
import { UserAvatar } from "@/components/common/UserAvatar"
import { Task } from "@/lib/types/task"
import { Meeting } from "@/lib/types/meeting"
import { format, parseISO, startOfDay, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TaskDetail } from "@/components/tasks/TaskDetail"
import { MeetingDetail } from "@/components/meetings/MeetingDetail"
import { useState } from "react"
import { useTeams } from "@/hooks/useTeams"

interface TeamEventsProps {
    meetings: Meeting[];
    tasks: Task[];
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

// Helper function to format remaining time
function formatRemainingTime(date: Date): string {
    const now = new Date();
    const days = differenceInDays(date, now);
    const hours = differenceInHours(date, now);
    const minutes = differenceInMinutes(date, now);

    if (minutes < 0) {
        return 'Finished';
    }

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} remaining`;
    }

    if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m remaining`;
    }

    if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    }

    return 'Now';
}

// Helper function to format task due status
function formatTaskDueStatus(dueDate: string | undefined, status: string): string {
    if (!dueDate || status === 'DONE') return '';

    const now = new Date();
    const due = parseISO(dueDate);
    const days = differenceInDays(due, now);

    if (days < 0) {
        return `Past due by ${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''}`;
    }

    if (days === 0) {
        return 'Due today';
    }

    return `${days} day${days > 1 ? 's' : ''} remaining`;
}

// Helper function to get display name for avatar
function getDisplayName(participant: any): string {
    if (typeof participant.name === 'string') return participant.name;
    if (typeof participant.full_name === 'string') return participant.full_name;
    if (typeof participant.email === 'string') return participant.email;
    return 'User';
}

// Helper function to get user ID
function getUserId(participant: any): string {
    if (participant.id) return participant.id.toString();
    return 'unknown';
}

// Helper function to get team name
function getTeamName(teams: any[], teamId: number): string {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : `Team ${teamId}`;
}

// Meeting Card Component
function MeetingCard({
    title,
    time,
    description,
    teamId,
    eventType,
    duration,
    participants,
    onClick
}: {
    title: string;
    time: string;
    description?: string;
    teamId: number;
    eventType?: string;
    duration?: number;
    participants?: any[];
    onClick: () => void;
}) {
    const { teams } = useTeams();
    const isPast = new Date(time) < new Date();

    if (isPast) return null;

    return (
        <div
            onClick={onClick}
            className="group relative overflow-hidden rounded-lg border border-gray-200 transition-all duration-300 hover:border-gray-300 hover:shadow-lg cursor-pointer bg-white min-h-[120px]"
        >
            <div className="p-4 h-[120px] transition-all duration-300 group-hover:-translate-y-full">
                <div className="flex items-center space-x-4">
                    <div className="rounded-full px-3 py-1 text-sm font-medium min-w-[100px] text-center text-indigo-700">
                        Meeting
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{title}</p>
                        <div className="flex items-center gap-2 text-sm mt-1">
                            <span className="text-indigo-600 font-medium">
                                {format(parseISO(time), 'MMM d, h:mm a')}
                            </span>
                            <span className="text-gray-500">• {eventType}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            {teams && getTeamName(teams, teamId)}
                        </div>
                    </div>
                    {participants && (
                        <div className="flex -space-x-2">
                            {participants.slice(0, 3).map((participant, i) => (
                                <UserAvatar
                                    key={i}
                                    userId={getUserId(participant)}
                                    name={getDisplayName(participant)}
                                    className="h-8 w-8 border-2 border-background"
                                />
                            ))}
                            {participants.length > 3 && (
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-sm font-medium text-gray-600 border-2 border-background">
                                    +{participants.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute inset-0 h-[120px] flex flex-col p-4 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 translate-y-full group-hover:translate-y-0">
                <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600 line-clamp-3">Description: {description}</p>
                        <p className="font-medium text-indigo-600 text-sm">
                            {formatRemainingTime(parseISO(time))}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">Duration: {duration} minutes</p>
                        <p className="text-sm text-gray-600">Type: {eventType}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Task Card Component
function TaskCard({
    title,
    description,
    teamId,
    status,
    priority,
    dueDate,
    eventType,
    assignees,
    onClick
}: {
    title: string;
    description?: string;
    teamId: number;
    status?: string;
    priority?: string;
    dueDate?: string;
    eventType?: string;
    assignees?: any[];
    onClick: () => void;
}) {
    const { teams } = useTeams();

    if (status === 'DONE') return null;

    return (
        <div
            onClick={onClick}
            className="group relative overflow-hidden rounded-lg border border-gray-200 transition-all duration-300 hover:border-gray-300 hover:shadow-lg cursor-pointer bg-white min-h-[120px]"
        >
            <div className="p-4 h-[120px] transition-all duration-300 group-hover:-translate-y-full">
                <div className="flex items-center space-x-4">
                    <div className="rounded-full px-3 py-1 text-sm font-medium min-w-[100px] text-center text-purple-700">
                        Task
                    </div>
                    <div className="flex-1 min-w-0">
                        <div>
                            <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                eventType === "FEATURE" && "bg-purple-50 text-purple-700",
                                eventType === "BUG" && "bg-red-50 text-red-700",
                                eventType === "TASK" && "bg-blue-50 text-blue-700"
                            )}>
                                {eventType}
                            </span>
                            <span className="font-medium truncate ml-2">{title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                            <span className="text-purple-600 font-medium">
                                {dueDate && "Due: " + format(parseISO(dueDate), 'MMM d')}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            {teams && getTeamName(teams, teamId)}
                        </div>
                    </div>
                    {assignees && assignees.length > 0 && (
                        <div className="flex -space-x-2">
                            {assignees.slice(0, 3).map((assignee, i) => (
                                <UserAvatar
                                    key={i}
                                    userId={getUserId(assignee)}
                                    name={getDisplayName(assignee)}
                                    className="h-8 w-8 border-2 border-background"
                                />
                            ))}
                            {assignees.length > 3 && (
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-sm font-medium text-gray-600 border-2 border-background">
                                    +{assignees.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute inset-0 h-[120px] flex flex-col p-4 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 translate-y-full group-hover:translate-y-0">
                <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600 line-clamp-3">Description: {description}</p>
                        <p className="font-medium text-purple-600 text-sm">
                            {dueDate && formatTaskDueStatus(dueDate, status || '')}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">Status: {status}</p>
                        <p className="text-sm text-gray-600">Priority: {priority}</p>
                        {assignees && assignees.length > 0 && (
                            <p className="text-sm text-gray-600 truncate">
                                Assignees: {assignees.map(a => getDisplayName(a)).join(', ')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TeamEvents({ meetings, tasks, date, setDate }: TeamEventsProps) {
    const today = startOfDay(new Date());
    const [selectedTask, setSelectedTask] = useState<Task | undefined>();
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | undefined>();
    const { teams } = useTeams();

    // Filter today's meetings and tasks
    const todayMeetings = meetings.filter(meeting => {
        const meetingDate = startOfDay(parseISO(meeting.start_time));
        return meetingDate.getTime() === today.getTime();
    });

    const todayTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = startOfDay(parseISO(task.due_date));
        return taskDate.getTime() === today.getTime();
    });

    // Filter upcoming meetings and tasks
    const upcomingMeetings = meetings.filter(meeting => {
        const meetingDate = startOfDay(parseISO(meeting.start_time));
        return meetingDate.getTime() > today.getTime();
    }).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());

    const upcomingTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = startOfDay(parseISO(task.due_date));
        return taskDate.getTime() > today.getTime();
    }).sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime());

    return (
        <div className="relative z-10 grid gap-4 md:gap-6 lg:grid-cols-7">
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
                                    {todayMeetings.map(meeting => (
                                        <MeetingCard
                                            key={meeting.id}
                                            title={meeting.title}
                                            time={meeting.start_time}
                                            description={meeting.description}
                                            teamId={meeting.team_id}
                                            eventType={meeting.type}
                                            duration={meeting.duration_minutes}
                                            participants={meeting.participants}
                                            onClick={() => setSelectedMeeting(meeting)}
                                        />
                                    ))}
                                    {todayTasks.map(task => (
                                        <TaskCard
                                            key={task.id}
                                            title={task.title}
                                            description={task.description}
                                            teamId={task.team_id}
                                            status={task.status}
                                            priority={task.priority}
                                            dueDate={task.due_date}
                                            eventType={task.type}
                                            assignees={task.assignees}
                                            onClick={() => setSelectedTask(task)}
                                        />
                                    ))}
                                    {todayMeetings.length === 0 && todayTasks.length === 0 && (
                                        <div className="text-center text-muted-foreground py-4">
                                            No events scheduled for today
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upcoming Events */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Upcoming</h3>
                                <div className="space-y-4">
                                    {upcomingMeetings.slice(0, 5).map(meeting => (
                                        <MeetingCard
                                            key={meeting.id}
                                            title={meeting.title}
                                            time={meeting.start_time}
                                            description={meeting.description}
                                            teamId={meeting.team_id}
                                            eventType={meeting.type}
                                            duration={meeting.duration_minutes}
                                            participants={meeting.participants}
                                            onClick={() => setSelectedMeeting(meeting)}
                                        />
                                    ))}
                                    {upcomingTasks.slice(0, 5).map(task => (
                                        <TaskCard
                                            key={task.id}
                                            title={task.title}
                                            description={task.description}
                                            teamId={task.team_id}
                                            status={task.status}
                                            priority={task.priority}
                                            dueDate={task.due_date}
                                            eventType={task.type}
                                            assignees={task.assignees}
                                            onClick={() => setSelectedTask(task)}
                                        />
                                    ))}
                                    {upcomingMeetings.length === 0 && upcomingTasks.length === 0 && (
                                        <div className="text-center text-muted-foreground py-4">
                                            No upcoming events scheduled
                                        </div>
                                    )}
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
                            Day: ({ date: dayDate, displayMonth, ...props }) => {
                                if (!dayDate) return <div {...props} />;

                                const formattedDate = format(dayDate, 'yyyy-MM-dd');
                                const tasksForDay = tasks.filter((task) => task.due_date && format(parseISO(task.due_date), 'yyyy-MM-dd') === formattedDate);
                                const meetingsForDay = meetings.filter((meeting) => format(parseISO(meeting.start_time), 'yyyy-MM-dd') === formattedDate);
                                const hasEvents = tasksForDay.length > 0 || meetingsForDay.length > 0;
                                const totalEvents = tasksForDay.length + meetingsForDay.length;

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
                                                            <span className="h-1 w-1 rounded-full bg-indigo-500" />
                                                        )}
                                                        {meetingsForDay.length > 0 && (
                                                            <span className="h-1 w-1 rounded-full bg-blue-500" />
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
                                                                {format(dayDate, 'MMM d')}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {totalEvents} {totalEvents === 1 ? 'event' : 'events'}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 max-h-[150px] overflow-y-auto">
                                                            {tasksForDay.map((task) => (
                                                                <div key={task.id} className="flex items-center gap-2 text-xs">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                                    <span className="truncate flex-1">{task.title}</span>
                                                                    <span className="text-muted-foreground">{task.priority}</span>
                                                                </div>
                                                            ))}
                                                            {meetingsForDay.map((meeting) => (
                                                                <div key={meeting.id} className="flex items-center gap-2 text-xs">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                                    <span className="truncate flex-1">{meeting.title}</span>
                                                                    <span className="text-muted-foreground">
                                                                        {format(parseISO(meeting.start_time), 'h:mm a')}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-popover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        }}
                    />

                    {/* Selected Date Events */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold">
                                {date ? (
                                    `Events on ${format(date, 'EEEE, MMM d')}`
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
                                    .filter(task => task.due_date && format(parseISO(task.due_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
                                    .length > 0 && (
                                        <div className="space-y-1">
                                            <h5 className="text-sm font-medium text-muted-foreground">Tasks</h5>
                                            {tasks
                                                .filter(task => task.due_date && format(parseISO(task.due_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
                                                .map(task => (
                                                    <div key={task.id} className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-accent">
                                                        <div className={cn(
                                                            "h-2 w-2 rounded-full",
                                                            task.priority === "HIGH" && "bg-red-500",
                                                            task.priority === "MEDIUM" && "bg-yellow-500",
                                                            task.priority === "LOW" && "bg-green-500"
                                                        )} />
                                                        <span className="flex-1 truncate">{task.title}</span>
                                                        <span className={cn(
                                                            "text-xs px-2 py-1 rounded-full",
                                                            task.status === "DONE" && "bg-green-100 text-green-800",
                                                            task.status === "IN_PROGRESS" && "bg-blue-100 text-blue-800",
                                                            task.status === "TODO" && "bg-yellow-100 text-yellow-800"
                                                        )}>
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}

                                {/* Meetings for selected date */}
                                {meetings
                                    .filter(meeting => format(parseISO(meeting.start_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
                                    .length > 0 && (
                                        <div className="space-y-1">
                                            <h5 className="text-sm font-medium text-muted-foreground">Meetings</h5>
                                            {meetings
                                                .filter(meeting => format(parseISO(meeting.start_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
                                                .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
                                                .map(meeting => (
                                                    <div key={meeting.id} className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-accent">
                                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                        <span className="flex-1 truncate">{meeting.title}</span>
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            {format(parseISO(meeting.start_time), 'h:mm a')}
                                                        </span>
                                                        <div className="flex -space-x-2">
                                                            {meeting.participants.slice(0, 2).map((participant, i) => (
                                                                <UserAvatar
                                                                    key={i}
                                                                    userId={getUserId(participant)}
                                                                    name={getDisplayName(participant)}
                                                                    className="h-6 w-6 border-2 border-background"
                                                                />
                                                            ))}
                                                            {meeting.participants.length > 2 && (
                                                                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs">
                                                                    +{meeting.participants.length - 2}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}

                                {tasks.filter(task => task.due_date && format(parseISO(task.due_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')).length === 0 &&
                                    meetings.filter(meeting => format(parseISO(meeting.start_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')).length === 0 && (
                                        <div className="text-sm text-muted-foreground text-center py-2">
                                            No events scheduled for this date
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskDetail
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(undefined)}
                    task={selectedTask}
                    teamId={selectedTask.team_id}
                />
            )}

            {/* Meeting Detail Modal */}
            {selectedMeeting && (
                <MeetingDetail
                    isOpen={!!selectedMeeting}
                    onClose={() => setSelectedMeeting(undefined)}
                    meeting={selectedMeeting}
                    teamId={selectedMeeting.team_id}
                />
            )}
        </div>
    );
}
