import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { PlayIcon, PauseIcon, ChevronDownIcon } from "@radix-ui/react-icons"
import { formatDistanceToNow } from 'date-fns'
import { TimeTracking as TimeTrackingType, TimeUnit } from '@/lib/types/task'

interface TimeTrackingProps {
    taskId: number
    timeTracking?: TimeTrackingType
    onLogTime: (data: { duration: number, description: string }) => Promise<void>
    onUpdateEstimate: (data: { original: number, remaining: number }) => Promise<void>
    onStartTimer: () => void
    onStopTimer: () => void
    isTimerRunning: boolean
}

export function TimeTracking({
    taskId,
    timeTracking,
    onLogTime,
    onUpdateEstimate,
    onStartTimer,
    onStopTimer,
    isTimerRunning
}: TimeTrackingProps) {
    const defaultTimeTracking: TimeTrackingType = {
        original_estimate: 0,
        remaining_estimate: 0,
        time_spent: 0,
        unit: TimeUnit.HOURS,
        entries: []
    }

    const currentTimeTracking = timeTracking || defaultTimeTracking
    const [logAmount, setLogAmount] = useState("")
    const [logDescription, setLogDescription] = useState("")
    const [showWorkLog, setShowWorkLog] = useState(true)

    const handleLogTime = () => {
        const duration = parseFloat(logAmount) * 60 // Convert to minutes
        if (duration > 0) {
            onLogTime({ duration, description: logDescription })
            setLogAmount("")
            setLogDescription("")
        }
    }

    const formatDuration = (minutes: number, unit: TimeUnit) => {
        switch (unit) {
            case TimeUnit.MINUTES:
                return `${minutes}m`
            case TimeUnit.HOURS:
                return `${(minutes / 60).toFixed(1)}h`
            case TimeUnit.DAYS:
                return `${(minutes / 60 / 8).toFixed(1)}d`
            case TimeUnit.WEEKS:
                return `${(minutes / 60 / 8 / 5).toFixed(1)}w`
            default:
                return `${minutes}m`
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={isTimerRunning ? onStopTimer : onStartTimer}
                >
                    {isTimerRunning ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                    {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
                </Button>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        placeholder="Time spent"
                        value={logAmount}
                        onChange={(e) => setLogAmount(e.target.value)}
                        className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">hours</span>
                    <Textarea
                        placeholder="What did you work on?"
                        value={logDescription}
                        onChange={(e) => setLogDescription(e.target.value)}
                        className="flex-1 h-8 min-h-0"
                    />
                    <Button onClick={handleLogTime} size="sm">Log</Button>
                </div>
            </div>

            <Card className="p-4">
                <div className="space-y-2">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setShowWorkLog(!showWorkLog)}
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-muted-foreground">Original Estimate:</span>
                                <span className="font-medium">{formatDuration(currentTimeTracking.original_estimate, currentTimeTracking.unit)}</span>
                                <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Remaining:</span>
                                <span className="font-medium">{formatDuration(currentTimeTracking.remaining_estimate, currentTimeTracking.unit)}</span>
                                <span className="text-muted-foreground ml-2">Time Spent:</span>
                                <span className="font-medium">{formatDuration(currentTimeTracking.time_spent, currentTimeTracking.unit)}</span>
                            </div>
                        </div>
                    </div>

                    {showWorkLog && (
                        <div className="space-y-2">
                            {currentTimeTracking.entries.map((entry) => (
                                <Card key={entry.id} className="p-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1 text-sm">
                                                <span className="font-medium">{entry.user.full_name}</span>
                                                <span className="text-muted-foreground">logged</span>
                                                <span className="font-medium">{formatDuration(entry.duration, currentTimeTracking.unit)}</span>
                                                <span className="text-muted-foreground">{formatDistanceToNow(new Date(entry.created_at))} ago</span>
                                            </div>
                                            {entry.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
} 