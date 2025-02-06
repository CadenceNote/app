import { Bell } from "lucide-react";
import { Card, CardTitle, CardHeader, CardContent } from "../ui/card";
import { CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Users } from "lucide-react";
import { useState } from "react";





export default function PStats({ tasks, meetings, alerts }) {
    const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month'>('week')

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
    return (
        <>
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
        </>
    )
}

