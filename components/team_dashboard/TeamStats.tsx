import { Bell } from "lucide-react";
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Users } from "lucide-react";
import { useState } from "react";
import { Task } from "@/lib/types/task";
import { Meeting } from "@/lib/types/meeting";
import { Team } from "@/lib/types/team";
import { Badge } from "../ui/badge";
import { format, parseISO } from "date-fns";
import { useTask } from "@/hooks/useTask";
import { useMeeting } from "@/hooks/useMeeting";

interface TeamStatsProps {
    teamId: number;
}

export default function TeamStats({ teamId }: TeamStatsProps) {
    const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month'>('week');
    const { tasks } = useTask(teamId);
    const { meetings } = useMeeting(teamId);

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
        const tasksToday = tasks?.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()).length || 0;
        const tasksDueThisWeek = tasks?.filter(t => {
            if (!t.due_date) return false;
            const dueDate = new Date(t.due_date);
            const weekFromNow = new Date();
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return dueDate <= weekFromNow && t.status !== 'DONE';
        }).length || 0;
        const tasksInProgress = tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0;
        const tasksTodo = tasks?.filter(t => t.status === 'TODO').length || 0;
        const highPriorityTasks = tasks?.filter(t => t.priority === 'HIGH' && t.status !== 'DONE').length || 0;

        // Calculate meeting stats
        const meetingsToday = meetings?.filter(m => new Date(m.start_time).toDateString() === new Date().toDateString()).length || 0;
        const nextMeeting = meetings
            ?.filter(m => new Date(m.start_time) > new Date())
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

        return {
            tasksToday,
            tasksDueThisWeek,
            tasksInProgress,
            tasksTodo,
            highPriorityTasks,
            meetingsToday,
            nextMeeting
        }
    }

    const stats = calculateStats()

    return (
        <div className="grid gap-6 md:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Tasks Due Today</CardTitle>
                    <Badge variant="secondary">
                        {stats.tasksToday}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.tasksToday}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.highPriorityTasks} high priority
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Today&apos;s Meetings</CardTitle>
                    <Badge variant="secondary">
                        {stats.meetingsToday}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.meetingsToday}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Next at {stats.nextMeeting
                            ? format(parseISO(stats.nextMeeting.start_time), 'h:mm a')
                            : 'No more meetings today'}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                    <Badge variant="secondary">
                        {stats.tasksInProgress}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.tasksInProgress}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.tasksDueThisWeek} due this week
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Todo Tasks</CardTitle>
                    <Badge variant="secondary">
                        {stats.tasksTodo}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.tasksTodo}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.tasksDueThisWeek} due this week
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

