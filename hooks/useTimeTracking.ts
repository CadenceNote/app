import { useState, useEffect, useCallback, useRef } from 'react'
import { TimeTracking, TimeUnit } from '@/lib/types/task'
import { timeTrackingService } from '@/services/timeTrackingService'
import { useToast } from './use-toast'

interface UseTimeTrackingProps {
    teamId: number
    taskId: number
    initialTimeTracking?: TimeTracking
}

export function useTimeTracking({ teamId, taskId, initialTimeTracking }: UseTimeTrackingProps) {
    const [timeTracking, setTimeTracking] = useState<TimeTracking | undefined>(initialTimeTracking)
    const [isTimerRunning, setIsTimerRunning] = useState(false)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [timerStartTime, setTimerStartTime] = useState<Date | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const loadingRef = useRef(false)
    const { toast } = useToast()

    const loadTimeEntries = useCallback(async () => {
        if (!taskId || taskId === 0 || loadingRef.current) return

        loadingRef.current = true
        setIsLoading(true)
        try {
            const entries = await timeTrackingService.getTimeEntries(teamId, taskId)
            setTimeTracking(prev => prev ? {
                ...prev,
                entries: entries || []
            } : {
                original_estimate: 0,
                remaining_estimate: 0,
                time_spent: 0,
                unit: TimeUnit.MINUTES,
                entries: entries || []
            })
        } catch (err) {
            console.error('Failed to load time entries:', err)
            toast({
                title: "Error",
                description: "Failed to load time entries. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
            loadingRef.current = false
        }
    }, [teamId, taskId, toast])

    // Load time entries on mount and when taskId changes
    useEffect(() => {
        if (taskId && taskId !== 0) {
            loadTimeEntries()
        }
    }, [taskId, loadTimeEntries])

    // Start timer
    const startTimer = useCallback(() => {
        setIsTimerRunning(true)
        setTimerStartTime(new Date())
    }, [])

    // Stop timer and log time
    const stopTimer = useCallback(async () => {
        if (!timerStartTime) return

        setIsTimerRunning(false)
        const endTime = new Date()
        const duration = Math.round((endTime.getTime() - timerStartTime.getTime()) / 1000 / 60) // Convert to minutes

        try {
            await timeTrackingService.addTimeEntry(teamId, taskId, {
                duration,
                started_at: timerStartTime.toISOString(),
                ended_at: endTime.toISOString()
            })
            await loadTimeEntries()
        } catch (error) {
            console.error('Failed to log time:', error)
            toast({
                title: "Error",
                description: "Failed to log time. Please try again.",
                variant: "destructive"
            })
        }

        setTimerStartTime(null)
        setElapsedTime(0)
    }, [teamId, taskId, timerStartTime, loadTimeEntries, toast])

    // Log time manually
    const logTime = useCallback(async (data: { duration: number, description: string }) => {
        try {
            await timeTrackingService.addTimeEntry(teamId, taskId, {
                duration: data.duration,
                description: data.description
            })
            await loadTimeEntries()
        } catch (error) {
            console.error('Failed to log time:', error)
            toast({
                title: "Error",
                description: "Failed to log time. Please try again.",
                variant: "destructive"
            })
        }
    }, [teamId, taskId, loadTimeEntries, toast])

    // Update time estimate
    const updateEstimate = useCallback(async (data: { original: number, remaining: number }) => {
        try {
            await timeTrackingService.updateTimeEstimate(teamId, taskId, {
                original_estimate: data.original,
                remaining_estimate: data.remaining
            })
            if (timeTracking) {
                setTimeTracking({
                    ...timeTracking,
                    original_estimate: data.original,
                    remaining_estimate: data.remaining
                })
            }
        } catch (error) {
            console.error('Failed to update estimate:', error)
            toast({
                title: "Error",
                description: "Failed to update time estimate. Please try again.",
                variant: "destructive"
            })
        }
    }, [teamId, taskId, timeTracking, toast])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isTimerRunning && timerStartTime) {
            interval = setInterval(() => {
                const now = new Date()
                const elapsed = Math.round((now.getTime() - timerStartTime.getTime()) / 1000 / 60)
                setElapsedTime(elapsed)
            }, 1000)
        }

        return () => {
            if (interval) {
                clearInterval(interval)
            }
        }
    }, [isTimerRunning, timerStartTime])

    return {
        timeTracking,
        isTimerRunning,
        elapsedTime,
        startTimer,
        stopTimer,
        logTime,
        updateEstimate,
        isLoading
    }
} 