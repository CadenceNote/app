import { AtSign, CalendarIcon, CheckCircle, Check, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardTitle, CardHeader } from "../ui/card"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"


export default function PAlerts({ alerts, setAlerts, isMounted }) {
    return (
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
    )
}
