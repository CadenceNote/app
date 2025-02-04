// components/tasks/TaskDetail.tsx
'use client';

import { useState, useEffect } from 'react';
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
import { Task, TaskStatus, TaskPriority, TaskType, TimeUnit, Label } from '@/lib/types/task';
import { taskApi, CreateTaskInput } from '@/services/taskApi';
import { labelApi } from '@/services/labelApi';
import { teamApi } from '@/services/teamApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";

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
    const defaultFormData: Partial<CreateTaskInput> = {
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || TaskStatus.TODO,
        priority: task?.priority || TaskPriority.MEDIUM,
        type: task?.type || TaskType.TASK,
        start_date: task?.start_date || undefined,
        due_date: task?.due_date || undefined,
        assignee_id: task?.assignee?.id || undefined,
        labels: task?.labels?.map(l => l.id) || []
    }

    const [formData, setFormData] = useState<Partial<CreateTaskInput>>(defaultFormData);
    const [newComment, setNewComment] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>(
        task?.start_date ? new Date(task.start_date) : undefined
    );
    const [dueDate, setDueDate] = useState<Date | undefined>(
        task?.due_date ? new Date(task.due_date) : undefined
    );
    const [isDueDatePopoverOpen, setIsDueDatePopoverOpen] = useState(false);
    const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
    const [labels, setLabels] = useState<Label[]>([]);
    const [teamMembers, setTeamMembers] = useState<{ id: string; email: string; full_name: string }[]>([]);
    const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { toast } = useToast();

    // Reset form data and dates when task changes
    useEffect(() => {
        setFormData(defaultFormData);
        setStartDate(task?.start_date ? new Date(task.start_date) : undefined);
        setDueDate(task?.due_date ? new Date(task.due_date) : undefined);
    }, [task]);

    // Load team members and labels
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load team data
                const teamData = await teamApi.getTeam(teamId);
                setTeamMembers(teamData.members?.map(m => ({
                    id: m.user.id.toString(),
                    email: m.user.email,
                    full_name: m.user.full_name
                })) || []);

                // Load labels
                const labelsData = await labelApi.listLabels(teamId);
                setLabels(labelsData);
            } catch (error) {
                console.error('Failed to load data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load team data. Please try again.",
                    variant: "destructive"
                });
            }
        };

        if (teamId) {
            loadData();
        }
    }, [teamId]);

    // Handle label search
    const handleLabelSearch = async (query: string) => {
        setSearchQuery(query);
        try {
            const results = await labelApi.searchLabels(teamId, query);
            setLabels(results);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    // Create new label
    const handleCreateLabel = async () => {
        if (!searchQuery.trim()) return;

        try {
            const newLabel = await labelApi.createLabel(teamId, {
                name: searchQuery,
                color: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color
            });
            setLabels(prev => [...prev, newLabel]);
            setFormData(prev => ({
                ...prev,
                labels: [...(prev.labels || []), newLabel.id]
            }));
            setIsLabelPopoverOpen(false);
            setSearchQuery('');

            toast({
                title: "Success",
                description: `Label "${newLabel.name}" created successfully.`
            });
        } catch (error) {
            console.error('Failed to create label:', error);
            toast({
                title: "Error",
                description: "Failed to create label. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleDateSelect = (field: 'start_date' | 'due_date', date: Date | undefined) => {
        if (!date) return;

        if (field === 'start_date') {
            setStartDate(date);
            setFormData(prev => ({
                ...prev,
                start_date: date.toISOString().split('T')[0]
            }));
        } else {
            setDueDate(date);
            setFormData(prev => ({
                ...prev,
                due_date: date.toISOString().split('T')[0]
            }));
        }
    };

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
                    start_date: startDate ? startDate.toISOString() : undefined,
                    due_date: dueDate ? dueDate.toISOString() : undefined,
                    assignee_id: formData.assignee_id,
                    labels: formData.labels?.map(l => Number(l)) || [],
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
                    start_date: startDate ? startDate.toISOString() : undefined,
                    due_date: dueDate ? dueDate.toISOString() : undefined,
                    assignee_id: formData.assignee_id,
                    labels: formData.labels?.map(l => Number(l)) || [],
                    time_tracking: {
                        original_estimate: 0,
                        remaining_estimate: 0,
                        unit: TimeUnit.HOURS
                    }
                };
                const createdTask = await taskApi.createTask(teamId, requiredFields);
                if (onTaskUpdate) {
                    onTaskUpdate(createdTask);
                }
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
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-gray-500">
                                    {task ? `T-${task.team_ref_number}` : 'New Task'}
                                </div>
                                {task && (
                                    <div className="text-xs text-muted-foreground">
                                        Created {new Date(task.created_at).toLocaleDateString()} by {task.created_by?.full_name || task.created_by?.email}
                                    </div>
                                )}
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

                            {/* Metadata Section */}
                            {task?.task_metadata && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium mb-2">Additional Information</h3>
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <pre className="text-sm whitespace-pre-wrap">
                                            {JSON.stringify(task.task_metadata, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* Related Items Section */}
                            {(task?.source_meeting_id || task?.source_note_id || task?.parent_id) && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium mb-2">Related Items</h3>
                                    <div className="space-y-2">
                                        {task.source_meeting_id && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Source Meeting:</span>
                                                <Button variant="link" className="h-auto p-0">
                                                    Meeting #{task.source_meeting_id}
                                                </Button>
                                            </div>
                                        )}
                                        {task.source_note_id && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Source Note:</span>
                                                <Button variant="link" className="h-auto p-0">
                                                    Note #{task.source_note_id}
                                                </Button>
                                            </div>
                                        )}
                                        {task.parent_id && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Parent Task:</span>
                                                <Button variant="link" className="h-auto p-0">
                                                    Task #{task.parent_id}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Activity Section */}
                            <div className="space-y-6">
                                {task && <h2 className="text-lg font-semibold">Activity</h2>}

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
                                            <SelectItem value={TaskStatus.CANCELLED}>Cancelled</SelectItem>
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
                                label="Assignee"
                                value={
                                    <Select
                                        value={formData.assignee_id?.toString() || "unassigned"}
                                        onValueChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            assignee_id: value === "unassigned" ? undefined : value
                                        }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {teamMembers.map(member => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.full_name || member.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                }
                            />

                            <DetailField
                                label="Due date"
                                value={
                                    <Popover
                                        open={isDueDatePopoverOpen}
                                        onOpenChange={setIsDueDatePopoverOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "p-0 h-auto font-normal w-full justify-start",
                                                    task?.completed_at && "text-green-600"
                                                )}
                                            >
                                                <div className="text-left">
                                                    <div>{dueDate ? format(dueDate, 'MMM d, yyyy') : 'None'}</div>
                                                    {task?.completed_at && (
                                                        <div className="text-xs">
                                                            Completed {format(new Date(task.completed_at), 'MMM d, yyyy')}
                                                        </div>
                                                    )}
                                                </div>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="z-50 relative" sideOffset={5}>
                                            <div className="pointer-events-auto">
                                                <Calendar
                                                    mode="single"
                                                    selected={dueDate}
                                                    onSelect={(date) => {
                                                        handleDateSelect('due_date', date);
                                                        setIsDueDatePopoverOpen(false);
                                                    }}
                                                    initialFocus
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                }
                            />

                            <DetailField
                                label="Start date"
                                value={
                                    <Popover
                                        open={isStartDatePopoverOpen}
                                        onOpenChange={setIsStartDatePopoverOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="p-0 h-auto font-normal w-full justify-start"
                                            >
                                                {startDate ? format(startDate, 'MMM d, yyyy') : 'None'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="z-50 relative" sideOffset={5}>
                                            <div className="pointer-events-auto">
                                                <Calendar
                                                    mode="single"
                                                    selected={startDate}
                                                    onSelect={(date) => {
                                                        handleDateSelect('start_date', date);
                                                        setIsStartDatePopoverOpen(false);
                                                    }}
                                                    initialFocus
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                }
                            />

                            <DetailField
                                label="Labels"
                                value={
                                    <div className="space-y-2">
                                        <Popover open={isLabelPopoverOpen} onOpenChange={setIsLabelPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={isLabelPopoverOpen}
                                                    className="w-full justify-between"
                                                >
                                                    <span className="truncate">
                                                        {formData.labels?.length
                                                            ? `${formData.labels.length} label${formData.labels.length === 1 ? '' : 's'} selected`
                                                            : "Select labels..."}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0" align="start">
                                                <Command>
                                                    <div className="flex items-center border-b px-3">
                                                        <CommandInput
                                                            placeholder="Search labels..."
                                                            value={searchQuery}
                                                            onValueChange={handleLabelSearch}
                                                            className="h-9 flex-1"
                                                        />
                                                        {searchQuery && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={handleCreateLabel}
                                                                className="h-full px-2 text-xs"
                                                            >
                                                                Create
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <CommandEmpty className="py-2 px-3 text-sm">
                                                        {searchQuery ? (
                                                            <span className="text-muted-foreground">
                                                                Press <span className="font-semibold">Create</span> to add "{searchQuery}"
                                                            </span>
                                                        ) : (
                                                            "No labels found."
                                                        )}
                                                    </CommandEmpty>
                                                    <CommandGroup className="max-h-[200px] overflow-auto">
                                                        {labels.map(label => (
                                                            <CommandItem
                                                                key={label.id}
                                                                value={label.name}
                                                                onSelect={() => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        labels: prev.labels?.includes(label.id)
                                                                            ? prev.labels.filter(id => id !== label.id)
                                                                            : [...(prev.labels || []), label.id]
                                                                    }));
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <Check
                                                                        className={cn(
                                                                            "h-4 w-4",
                                                                            formData.labels?.includes(label.id) ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <span
                                                                        className="h-3 w-3 rounded-full"
                                                                        style={{ backgroundColor: label.color }}
                                                                    />
                                                                    <span>{label.name}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        {/* Selected Labels Display */}
                                        {formData.labels && formData.labels.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {formData.labels.map(labelId => {
                                                    const label = labels.find(l => l.id === labelId);
                                                    if (!label) return null;
                                                    return (
                                                        <div
                                                            key={label.id}
                                                            className="group flex items-center gap-1 text-xs rounded-full px-2 py-1 hover:saturate-150 transition-all"
                                                            style={{ backgroundColor: `${label.color}20` }}
                                                        >
                                                            <span
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: label.color }}
                                                            />
                                                            <span style={{ color: label.color }}>{label.name}</span>
                                                            <button
                                                                onClick={() => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        labels: prev.labels?.filter(id => id !== label.id) || []
                                                                    }));
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                }
                            />


                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}