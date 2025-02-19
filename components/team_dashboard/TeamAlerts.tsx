import { AtSign, CalendarIcon, CheckCircle, Check, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardTitle, CardHeader } from "../ui/card"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface Alert {
    id: number;
    title: string;
    description: string;
    type: 'meeting_invite' | 'task_assignment' | 'team_invite' | 'mention';
    isRead: boolean;
    timestamp: string;
}

interface TeamAlertsProps {
    teamId: number;
}

// Placeholder alerts data
const placeholderAlerts: Alert[] = [
    {
        id: 1,
        title: "New Team Meeting",
        description: "Weekly sync scheduled for tomorrow at 10 AM",
        type: "meeting_invite",
        isRead: false,
        timestamp: new Date().toISOString()
    },
    {
        id: 2,
        title: "Task Assignment",
        description: "You've been assigned to review the new feature",
        type: "task_assignment",
        isRead: false,
        timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 3,
        title: "Team Mention",
        description: "@dev-team Please review the latest PR",
        type: "mention",
        isRead: true,
        timestamp: new Date(Date.now() - 7200000).toISOString()
    }
];

export default function TeamAlerts({ teamId }: TeamAlertsProps) {
    const [alerts, setAlerts] = useState<Alert[]>(placeholderAlerts)

    return (
        <Card className="backdrop-blur-sm h-full hover:shadow-lg transition-all duration-300">
            <CardHeader>
                <CardTitle className="">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {alerts.length > 0 ? (
                        alerts.map(alert => (
                            <div
                                key={alert.id}
                                className={cn(
                                    "flex items-center space-x-4 rounded-lg border p-4 transition-all duration-300",
                                    !alert.isRead ? "bg-indigo-50/50 border-indigo-200 dark:bg-gray-800 dark:border-gray-700" : "hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                                )}
                            >
                                <div className={cn(
                                    "rounded-full p-2",
                                    alert.type === 'meeting_invite' && "bg-blue-100 dark:bg-gray-800",
                                    alert.type === 'task_assignment' && "bg-green-100 dark:bg-gray-800",
                                    alert.type === 'team_invite' && "bg-purple-100 dark:bg-gray-800",
                                    alert.type === 'mention' && "bg-yellow-100 dark:bg-gray-800"
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
                                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                                    </time>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No new updates
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
