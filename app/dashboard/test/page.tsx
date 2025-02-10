"use client"

import { useState, useEffect } from "react"
import { Task, TaskStatus, TaskPriority } from "@/lib/types/task"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useTeams } from "@/hooks/useTeams"
import { useTask } from "@/hooks/useTask"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function TestPage() {
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
    const [selectedTaskId, setSelectedTaskId] = useState<string>("")
    const [isUpdating, setIsUpdating] = useState(false)
    const [formData, setFormData] = useState<Partial<Task>>({})
    const [showDebug, setShowDebug] = useState(false)
    const [focusLog, setFocusLog] = useState<Array<{ timestamp: string, event: string }>>([])
    const { toast } = useToast()

    // Fetch user's teams
    const { teams, isLoading: isLoadingTeams, error: teamsError } = useTeams();

    // Use our new useTask hook
    const {
        tasks,
        task: selectedTask,
        isLoadingTasks,
        isLoadingTask,
        tasksError,
        taskError,
        updateTask
    } = useTask(selectedTeamId ?? undefined, selectedTaskId || undefined);

    // Focus listener
    useEffect(() => {
        const handleFocus = () => {
            const log = {
                timestamp: new Date().toISOString(),
                event: "Window focused"
            }
            setFocusLog(prev => [log, ...prev].slice(0, 10))
        }

        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [selectedTeamId, selectedTaskId])

    const handleTaskUpdate = async () => {
        if (!selectedTask || !formData || Object.keys(formData).length === 0 || !selectedTeamId) return

        setIsUpdating(true)
        try {
            await updateTask(selectedTaskId, {
                title: formData.title,
                description: formData.description,
                status: formData.status,
                priority: formData.priority,
            });

            // Clear form data after successful update
            setFormData({})

            toast({
                title: "Success",
                description: "Task updated successfully"
            })
        } catch (error) {
            console.error('Update failed:', error)
            toast({
                title: "Error",
                description: "Failed to update task",
                variant: "destructive"
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleFieldChange = (field: keyof Task, value: string | TaskStatus | TaskPriority) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    if (teamsError) {
        return (
            <div className="p-6">
                <div className="text-red-500">Error loading teams: {teamsError.message}</div>
            </div>
        )
    }

    const hasChanges = Object.keys(formData).length > 0

    return (
        <div className="p-6 max-w-8xl mx-auto">
            <div className="flex gap-6">
                {/* Main content card */}
                <Card className="p-6 flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Test Task Update</h1>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDebug(!showDebug)}
                        >
                            {showDebug ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                            {showDebug ? 'Hide Debug' : 'Show Debug'}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {/* Team Selector */}
                        <div>
                            <label className="text-sm font-medium">Team</label>
                            <Select
                                value={selectedTeamId?.toString() ?? ""}
                                onValueChange={(value) => {
                                    setSelectedTeamId(parseInt(value))
                                    setSelectedTaskId("")
                                    setFormData({})
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team">
                                        {teams?.find(t => t.id === selectedTeamId)?.name ?? "Select team"}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {teams?.map((team) => (
                                        <SelectItem key={team.id} value={team.id.toString()}>
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isLoadingTeams && <div className="text-sm text-muted-foreground mt-1">Loading teams...</div>}
                        </div>

                        {/* Task Selector */}
                        {selectedTeamId && (
                            <div>
                                <label className="text-sm font-medium">Task</label>
                                <Select
                                    value={selectedTaskId}
                                    onValueChange={(value) => {
                                        setSelectedTaskId(value)
                                        setFormData({})
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select task">
                                            {tasks?.find(t => t.id.toString() === selectedTaskId)?.title ?? "Select task"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tasks?.map((task) => (
                                            <SelectItem key={task.id} value={task.id.toString()}>
                                                {task.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {isLoadingTasks && <div className="text-sm text-muted-foreground mt-1">Loading tasks...</div>}
                            </div>
                        )}

                        {selectedTask && (
                            <>
                                {/* Title */}
                                <div>
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                        value={formData.title ?? selectedTask.title}
                                        onChange={(e) => handleFieldChange('title', e.target.value)}
                                        placeholder="Task title"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea
                                        value={formData.description ?? selectedTask.description}
                                        onChange={(e) => handleFieldChange('description', e.target.value)}
                                        placeholder="Task description"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Select
                                        value={formData.status ?? selectedTask.status}
                                        onValueChange={(value: TaskStatus) => handleFieldChange('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>{formData.status ?? selectedTask.status}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(TaskStatus).map(status => (
                                                <SelectItem key={status} value={status}>
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="text-sm font-medium">Priority</label>
                                    <Select
                                        value={formData.priority ?? selectedTask.priority}
                                        onValueChange={(value: TaskPriority) => handleFieldChange('priority', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>{formData.priority ?? selectedTask.priority}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(TaskPriority).map(priority => (
                                                <SelectItem key={priority} value={priority}>
                                                    {priority}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Update Button */}
                                <div className="flex items-center gap-4">
                                    <Button
                                        onClick={handleTaskUpdate}
                                        disabled={!hasChanges || isUpdating}
                                        className="w-full"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Task'
                                        )}
                                    </Button>
                                    {hasChanges && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setFormData({})}
                                            disabled={isUpdating}
                                        >
                                            Reset Changes
                                        </Button>
                                    )}
                                </div>

                                {/* Current Task State */}
                                <div className="mt-8">
                                    <h2 className="text-lg font-semibold mb-2">Current Task State:</h2>
                                    <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
                                        {JSON.stringify(selectedTask, null, 2)}
                                    </pre>
                                    {hasChanges && (
                                        <>
                                            <h2 className="text-lg font-semibold mb-2 mt-4">Pending Changes:</h2>
                                            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
                                                {JSON.stringify(formData, null, 2)}
                                            </pre>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </Card>

                {/* Debug Panel */}
                {showDebug && (
                    <Card className="p-6 overflow-auto">
                        <h2 className="text-lg font-semibold mb-4">Debug Panel</h2>

                        <div className="space-y-6">
                            {/* Loading States */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Loading States</h3>
                                <div className="space-y-1 text-sm">
                                    <div>Teams Loading: {isLoadingTeams ? '✓' : '×'}</div>
                                    <div>Tasks Loading: {isLoadingTasks ? '✓' : '×'}</div>
                                    <div>Task Loading: {isLoadingTask ? '✓' : '×'}</div>
                                    <div>Update in Progress: {isUpdating ? '✓' : '×'}</div>
                                </div>
                            </div>

                            {/* Teams Data */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Teams ({teams?.length ?? 0})</h3>
                                <pre className="text-xs bg-gray-100 p-2 rounded-lg overflow-auto max-h-40">
                                    {JSON.stringify(teams, null, 2)}
                                </pre>
                            </div>

                            {/* Selected Values */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Selected Values</h3>
                                <div className="space-y-1 text-sm">
                                    <div>Team ID: {selectedTeamId ?? 'none'}</div>
                                    <div>Task ID: {selectedTaskId || 'none'}</div>
                                    <div>Has Changes: {hasChanges ? '✓' : '×'}</div>
                                </div>
                            </div>

                            {/* Tasks List */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Tasks ({tasks?.length ?? 0})</h3>
                                <pre className="text-xs bg-gray-100 p-2 rounded-lg overflow-auto max-h-40">
                                    {JSON.stringify(tasks, null, 2)}
                                </pre>
                            </div>

                            {/* Selected Task */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Selected Task</h3>
                                <pre className="text-xs bg-gray-100 p-2 rounded-lg overflow-auto max-h-40">
                                    {JSON.stringify(selectedTask, null, 2)}
                                </pre>
                            </div>

                            {/* Form Data */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Form Data (Changes)</h3>
                                <pre className="text-xs bg-gray-100 p-2 rounded-lg overflow-auto max-h-40">
                                    {JSON.stringify(formData, null, 2)}
                                </pre>
                            </div>

                            {/* Focus Log */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Focus Log</h3>
                                <div className="space-y-1 text-xs">
                                    {focusLog.map((log, index) => (
                                        <div key={index} className="bg-gray-100 p-2 rounded-lg">
                                            <div className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                            <div>{log.event}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Error States */}
                            {(teamsError || tasksError || taskError) && (
                                <div>
                                    <h3 className="text-sm font-medium mb-2 text-red-500">Errors</h3>
                                    {teamsError && (
                                        <pre className="text-xs bg-red-50 text-red-500 p-2 rounded-lg overflow-auto max-h-40 mb-2">
                                            Teams Error: {JSON.stringify(teamsError, null, 2)}
                                        </pre>
                                    )}
                                    {tasksError && (
                                        <pre className="text-xs bg-red-50 text-red-500 p-2 rounded-lg overflow-auto max-h-40 mb-2">
                                            Tasks Error: {JSON.stringify(tasksError, null, 2)}
                                        </pre>
                                    )}
                                    {taskError && (
                                        <pre className="text-xs bg-red-50 text-red-500 p-2 rounded-lg overflow-auto max-h-40">
                                            Task Error: {JSON.stringify(taskError, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}



