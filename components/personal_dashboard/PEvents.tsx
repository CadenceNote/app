import { Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardTitle, CardHeader } from "../ui/card"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { cn } from "@/lib/utils"
import { Calendar } from "../ui/calendar"


export default function PEvents({ meetings, tasks, date, setDate }) {

    return (
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
    )
}
