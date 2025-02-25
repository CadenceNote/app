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
import { Calendar as CalendarIcon, Users2, Clock, CalendarDays } from "lucide-react"
import { ExpandableEventCard } from "../card/expandable-event-card"
import { useTask } from "@/hooks/useTask"
import { useMeeting } from "@/hooks/useMeeting"
interface PEventsProps {
    meetings: Meeting[];
    tasks: Task[];
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}


export default function PEvents({ date, setDate }: PEventsProps) {
    const today = startOfDay(new Date());
    const [selectedTask, setSelectedTask] = useState<Task | undefined>();
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | undefined>();
    const { teams } = useTeams();
    const { tasks, updateTask } = useTask()
    const { meetings } = useMeeting()
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
        <div className="mx-auto space-y-6">
            {/* Calendar Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-x-2">
                    <CardTitle>Calendar</CardTitle>

                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-3">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="w-full"
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
                    </div>

                    {/* Selected Date Events */}
                    <div className="border-t p-4 space-y-3">
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
                                                    <ExpandableEventCard
                                                        key={task.id}
                                                        title={task.title}
                                                        time={task.due_date!}
                                                        description={task.description}
                                                        type="task"
                                                        priority={task.priority}
                                                        status={task.status}
                                                        participants={task.assignees}
                                                        onClick={() => setSelectedTask(task)}
                                                    />
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
                                                    <ExpandableEventCard
                                                        key={meeting.id}
                                                        title={meeting.title}
                                                        time={meeting.start_time}
                                                        description={meeting.description}
                                                        type="meeting"
                                                        duration={meeting.duration_minutes}
                                                        participants={meeting.participants}
                                                        onClick={() => setSelectedMeeting(meeting)}
                                                    />
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

            {/* Upcoming Events Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Upcoming Events</CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 hover:bg-background">
                        <Plus className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Today's Events */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-muted-foreground">Today</h3>
                            <span className="text-xs text-muted-foreground">
                                {todayMeetings.length + todayTasks.length} events
                            </span>
                        </div>
                        <div className="space-y-2">
                            {todayMeetings.map(meeting => (
                                <ExpandableEventCard
                                    key={meeting.id}
                                    title={meeting.title}
                                    time={meeting.start_time}
                                    description={meeting.description}
                                    type="meeting"
                                    duration={meeting.duration_minutes}
                                    participants={meeting.participants}
                                    onClick={() => setSelectedMeeting(meeting)}
                                />
                            ))}
                            {todayTasks.map(task => (
                                <ExpandableEventCard
                                    key={task.id}
                                    title={task.title}
                                    time={task.due_date!}
                                    description={task.description}
                                    type="task"
                                    priority={task.priority}
                                    status={task.status}
                                    participants={task.assignees}
                                    onClick={() => setSelectedTask(task)}
                                />
                            ))}
                            {todayMeetings.length === 0 && todayTasks.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    No events scheduled for today
                                </p>
                            )}
                        </div>

                        {/* Upcoming Events */}
                        <div className="pt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-muted-foreground">Upcoming</h3>
                                <span className="text-xs text-muted-foreground">
                                    {upcomingMeetings.length + upcomingTasks.length} events
                                </span>
                            </div>
                            <div className="space-y-2 mt-2">
                                {upcomingMeetings.slice(0, 5).map(meeting => (
                                    <ExpandableEventCard
                                        key={meeting.id}
                                        title={meeting.title}
                                        time={meeting.start_time}
                                        description={meeting.description}
                                        type="meeting"
                                        duration={meeting.duration_minutes}
                                        participants={meeting.participants}
                                        onClick={() => setSelectedMeeting(meeting)}
                                    />
                                ))}
                                {upcomingTasks.slice(0, 5).map(task => (
                                    <ExpandableEventCard
                                        key={task.id}
                                        title={task.title}
                                        time={task.due_date!}
                                        description={task.description}
                                        type="task"
                                        priority={task.priority}
                                        status={task.status}
                                        participants={task.assignees}
                                        onClick={() => setSelectedTask(task)}
                                    />
                                ))}
                                {upcomingMeetings.length === 0 && upcomingTasks.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-2">
                                        No upcoming events scheduled
                                    </p>
                                )}
                            </div>
                        </div>
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
                    onTaskUpdate={updateTask}
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
