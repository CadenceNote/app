// components/tasks/TaskDetail.tsx
'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Task, TaskStatus, TaskPriority, TaskType, TimeUnit } from '@/lib/types/task';
import { taskApi, CreateTaskInput } from '@/services/taskApi';
import { useToast } from '@/hooks/use-toast';
import { TimeTracking } from './TimeTracking'
import { useTimeTracking } from '@/hooks/useTimeTracking'

interface TaskDetailProps {
    isOpen: boolean
    onClose: () => void
    task: Task | undefined
    teamId: number
    onTaskUpdate?: (task: Task) => void
}

interface DetailFieldProps {
    label: string
    value: React.ReactNode
    onClick?: () => void
    className?: string
}

const DetailField: React.FC<DetailFieldProps> = ({ label, value, onClick, className = "" }) => (
    <div className={`py-2 ${className}`}>
        <div className="text-sm text-gray-600 mb-1">{label}</div>
        <div
            className={`${onClick ? 'cursor-pointer text-blue-600 hover:underline' : ''}`}
            onClick={onClick}
        >
            {value || 'None'}
        </div>
    </div>
);

export function TaskDetail({ isOpen, onClose, task, teamId, onTaskUpdate }: TaskDetailProps) {
    const { timeTracking, isTimerRunning, startTimer, stopTimer, logTime, updateEstimate } = useTimeTracking({
        teamId,
        taskId: task?.id || 0,
        initialTimeTracking: task?.time_tracking
    })

    const defaultFormData: Partial<CreateTaskInput> = {
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || TaskStatus.TODO,
        priority: task?.priority || TaskPriority.MEDIUM,
        type: task?.type || TaskType.TASK,
        start_date: task?.start_date || undefined,
        due_date: task?.due_date || undefined,
        assignee_id: task?.assignee?.id || undefined,
        labels: task?.labels.map(l => l.id.toString()) || [],
        category: task?.category || undefined,
        team: task?.team?.name || undefined,
        time_tracking: {
            logged: task?.time_tracking.time_spent?.toString() || '0',
            remaining: task?.time_tracking.remaining_estimate?.toString() || '0'
        }
    }

    const [formData, setFormData] = useState<Partial<CreateTaskInput>>(defaultFormData)
    const [newComment, setNewComment] = useState('')

    const { toast } = useToast()

    const handleSubmit = async () => {
        try {
            if (task) {
                // Format the data for update
                const updateData = {
                    title: formData.title,
                    description: formData.description,
                    status: formData.status,
                    priority: formData.priority,
                    type: formData.type,
                    start_date: formData.start_date,
                    due_date: formData.due_date,
                    assignee_id: formData.assignee_id,
                    labels: formData.labels,
                    category: formData.category
                };

                const updatedTask = await taskApi.updateTask(teamId, task.id, updateData);
                if (onTaskUpdate) {
                    onTaskUpdate(updatedTask);
                }
                toast({
                    title: "Task updated",
                    description: "Your changes have been saved successfully."
                });
            } else {
                const requiredFields: CreateTaskInput = {
                    title: formData.title || '',
                    description: formData.description || '',
                    status: formData.status || TaskStatus.TODO,
                    priority: formData.priority || TaskPriority.MEDIUM,
                    type: formData.type || TaskType.TASK,
                    start_date: formData.start_date,
                    due_date: formData.due_date,
                    assignee_id: formData.assignee_id,
                    labels: formData.labels?.map(l => Number(l)) || [],
                    category: formData.category,
                    team: formData.team ? {
                        id: Number(formData.team),
                        name: ''  // This will be filled by the backend
                    } : undefined,
                    time_tracking: {
                        original_estimate: 0,
                        remaining_estimate: 0,
                        unit: TimeUnit.HOURS
                    }
                };
                await taskApi.createTask(teamId, requiredFields);
                toast({
                    title: "Task created",
                    description: "The new task has been created successfully."
                });
            }
            onClose();
        } catch (err) {
            console.error('Failed to save task:', err);
            toast({
                title: "Error",
                description: "Failed to save the task. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleTimeTrackingChange = (field: 'logged' | 'remaining', value: string) => {
        setFormData(prev => ({
            ...prev,
            time_tracking: {
                logged: field === 'logged' ? value : prev.time_tracking?.logged || '0',
                remaining: field === 'remaining' ? value : prev.time_tracking?.remaining || '0'
            }
        }))
    }

    const handleDateChange = (field: 'start_date' | 'due_date', date: Date | undefined) => {
        setFormData(prev => ({
            ...prev,
            [field]: date ? date.toISOString().split('T')[0] : undefined
        }))
    }

    const handleLabelsChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            labels: value.split(',').map(l => l.trim()).filter(Boolean)
        }))
    }

    const handleAddComment = async () => {
        if (!task || !newComment.trim()) return

        try {
            await taskApi.addComment(teamId, task.id, { content: newComment })
            setNewComment('')

            // Refresh task data to get updated comments
            const updatedTask = await taskApi.getTask(teamId, task.id)
            if (updatedTask && onTaskUpdate) {
                onTaskUpdate(updatedTask)
            }

            toast({
                title: "Comment added",
                description: "Your comment has been added successfully."
            })
        } catch (err) {
            console.error('Failed to add comment:', err)
            toast({
                title: "Error",
                description: "Failed to add comment. Please try again.",
                variant: "destructive"
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                <DialogTitle className="sr-only">
                    {task?.title || 'New Task'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    View and edit task details
                </DialogDescription>
                <div className="flex-1 flex">
                    {/* Left Column - Main Content */}
                    <div className="flex-1 p-6 overflow-y-auto border-r">
                        {/* Title Section */}
                        <div className="mb-6">
                            <div className="text-sm text-gray-500 mb-2">
                                {task ? `T-${task.team_ref_number}` : 'New Task'}
                            </div>
                            <Input
                                value={formData.title || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Task title"
                                className="text-xl font-semibold mb-4"
                            />
                            <Textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Add a description..."
                                className="min-h-[100px] mb-6"
                            />

                            {/* Activity Section */}
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold">Activity</h2>

                                {/* Time Tracking */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Time Tracking</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Logged Time</label>
                                            <Input
                                                value={formData.time_tracking?.logged || '0'}
                                                onChange={(e) => handleTimeTrackingChange('logged', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Remaining Time</label>
                                            <Input
                                                value={formData.time_tracking?.remaining || '0'}
                                                onChange={(e) => handleTimeTrackingChange('remaining', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {task && (
                                        <TimeTracking
                                            taskId={task.id}
                                            timeTracking={timeTracking}
                                            onLogTime={logTime}
                                            onUpdateEstimate={updateEstimate}
                                            onStartTimer={startTimer}
                                            onStopTimer={stopTimer}
                                            isTimerRunning={isTimerRunning}
                                        />
                                    )}
                                </div>

                                {/* Comments Section */}
                                {task && (
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto mb-16">
                                        <h3 className="text-sm font-medium">Comments</h3>
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <Textarea
                                                    placeholder="Add a comment..."
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Button onClick={handleAddComment}>Add</Button>
                                            </div>
                                            <div className="space-y-4">
                                                {task.comments?.map((comment) => (
                                                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-medium">{comment.user.full_name}</span>
                                                            <span className="text-sm text-gray-500">
                                                                {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700">{comment.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Save Button */}
                            <div className="mt-6">
                                <Button onClick={handleSubmit} className="w-full">
                                    {task ? 'Update Task' : 'Create Task'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="w-80 p-6 overflow-y-auto">
                        <div className="space-y-6">
                            <DetailField
                                label="Status"
                                value={
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: TaskStatus) => setFormData(prev => ({ ...prev, status: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                                            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                                            <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                                            <SelectItem value={TaskStatus.BLOCKED}>Blocked</SelectItem>
                                        </SelectContent>
                                    </Select>
                                }
                            />

                            <DetailField
                                label="Priority"
                                value={
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value: TaskPriority) => setFormData(prev => ({ ...prev, priority: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                                            <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                                            <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                                            <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                }
                            />

                            <DetailField
                                label="Type"
                                value={
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: TaskType) => setFormData(prev => ({ ...prev, type: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={TaskType.TASK}>Task</SelectItem>
                                            <SelectItem value={TaskType.BUG}>Bug</SelectItem>
                                            <SelectItem value={TaskType.FEATURE}>Feature</SelectItem>
                                            <SelectItem value={TaskType.IMPROVEMENT}>Improvement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                }
                            />

                            <DetailField
                                label="Due date"
                                value={
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="p-0 h-auto font-normal"
                                            >
                                                {formData.due_date ?
                                                    format(new Date(formData.due_date), 'MMM d, yyyy') :
                                                    'None'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.due_date ? new Date(formData.due_date) : undefined}
                                                onSelect={(date) => handleDateChange('due_date', date)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                }
                            />

                            <DetailField
                                label="Start date"
                                value={
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="p-0 h-auto font-normal"
                                            >
                                                {formData.start_date ?
                                                    format(new Date(formData.start_date), 'MMM d, yyyy') :
                                                    'None'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.start_date ? new Date(formData.start_date) : undefined}
                                                onSelect={(date) => handleDateChange('start_date', date)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                }
                            />

                            {/* Additional fields */}
                            <DetailField
                                label="Category"
                                value={
                                    <Input
                                        value={formData.category || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                        placeholder="Add category"
                                    />
                                }
                            />

                            <DetailField
                                label="Labels"
                                value={
                                    <Input
                                        value={formData.labels?.join(', ') || ''}
                                        onChange={(e) => handleLabelsChange(e.target.value)}
                                        placeholder="Add labels (comma separated)"
                                    />
                                }
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}