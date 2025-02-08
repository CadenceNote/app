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
import { Check, ChevronsUpDown, Eye } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { useUser } from '@/hooks/useUser';
import { UserCombobox } from "@/components/common/UserCombobox";

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
    <div className={`relative py-2 ${className}`}>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="mt-1">{value}</div>
    </div>
);

const defaultFormData = {
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    type: TaskType.TASK,
    start_date: undefined as string | undefined,
    due_date: undefined as string | undefined,
    assignees: [] as { id: string; email: string; full_name?: string }[],
    category: '',
};

// Add this style at the top of the file
const calendarPopoverStyle: React.CSSProperties = {
    zIndex: 99999,  // Very high z-index
    position: 'relative'
};

export function TaskDetail({ isOpen, onClose, task, teamId, onTaskUpdate }: TaskDetailProps) {
    const [formData, setFormData] = useState(defaultFormData);
    const [newComment, setNewComment] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [isDueDatePopoverOpen, setIsDueDatePopoverOpen] = useState(false);
    const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
    const [labels, setLabels] = useState<Label[]>([]);
    const [teamMembers, setTeamMembers] = useState<{ id: string; email: string; full_name: string; avatar_url: string }[]>([]);
    const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [teamName, setTeamName] = useState('');
    const [isWatching, setIsWatching] = useState(false);
    const { user } = useUser();

    const { toast } = useToast();

    // Reset form data when task changes
    useEffect(() => {
        if (task) {
            console.log('Setting form data for task:', task);
            setFormData({
                title: task.title || '',
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                type: task.type || TaskType.TASK,
                start_date: task.start_date,
                due_date: task.due_date,
                assignees: task.assignees || [],
                category: task.category || '',
            });

            setStartDate(task.start_date ? new Date(task.start_date) : undefined);
            setDueDate(task.due_date ? new Date(task.due_date) : undefined);
        } else {
            setFormData(defaultFormData);
            setStartDate(undefined);
            setDueDate(undefined);
        }
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
                    full_name: m.user.full_name,
                    avatar_url: m.user.avatar_url
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

    // Load team name and check if user is watching
    useEffect(() => {
        const loadTeamDetails = async () => {
            if (task) {
                try {
                    const team = await teamApi.getTeam(teamId);
                    setTeamName(team.name);
                    setIsWatching(task.watchers.some(w => w.id === user?.id));
                } catch (error) {
                    console.error('Failed to load team details:', error);
                }
            }
        };
        loadTeamDetails();
    }, [task, teamId, user?.id]);

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
        if (!task || !newComment.trim()) return;

        try {
            await taskApi.addComment(teamId, task.id, newComment);
            setNewComment('');

            const updatedTask = await taskApi.getTask(teamId, task.id);
            if (onTaskUpdate) {
                onTaskUpdate(updatedTask);
            }

            toast({
                title: "Comment added",
                description: "Your comment has been added successfully."
            });
        } catch (err) {
            console.error('Failed to add comment:', err);
            toast({
                title: "Error",
                description: "Failed to add comment. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleSubmit = async () => {
        try {
            const submitData = {
                ...formData,
                start_date: startDate?.toISOString(),
                due_date: dueDate?.toISOString(),
                assignees: formData.assignees.map(a => a.id.toString()),
            };

            console.log('Submitting task data:', submitData);

            if (!task?.id || !onTaskUpdate) {
                throw new Error('No task ID or update handler provided');
            }

            const updatedTask = await taskApi.updateTask(teamId, task.id, submitData);
            onTaskUpdate(updatedTask);

            toast({
                title: "Success",
                description: "Task updated successfully"
            });
        } catch (error) {
            console.error('Failed to save task:', error);
            toast({
                title: "Error",
                description: "Failed to save changes. Please try again.",
                variant: "destructive"
            });
        }
    };

    const toggleWatch = async () => {
        if (!task || !user) return;

        try {
            const updatedTask = isWatching
                ? await taskApi.removeWatcher(teamId, task.id, user.id)
                : await taskApi.addWatcher(teamId, task.id, user.id);

            setIsWatching(!isWatching);
            if (onTaskUpdate) {
                onTaskUpdate(updatedTask);
            }

            toast({
                title: isWatching ? "Unwatched" : "Watching",
                description: isWatching
                    ? "You will no longer receive updates for this task"
                    : "You will receive updates for this task"
            });
        } catch (error) {
            console.error('Failed to update watch status:', error);
            toast({
                title: "Error",
                description: "Failed to update watch status",
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogTitle className="sr-only">
                    {task?.title || 'Task Details'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    View and edit task details
                </DialogDescription>
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Column - Main Content */}
                    <div className="flex-1 p-6 overflow-y-auto border-r">
                        {/* Header Section */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-gray-500">
                                    {teamName} • T-{task?.team_ref_number}
                                </div>
                                <Button
                                    variant={isWatching ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={toggleWatch}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    {isWatching ? "Watching" : "Watch"}
                                </Button>
                            </div>
                            {task && (
                                <div className="text-xs text-muted-foreground">
                                    Created {new Date(task.created_at).toLocaleDateString()} by {task.created_by?.full_name || task.created_by?.email}
                                </div>
                            )}
                        </div>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Task title"
                            className="text-xl font-semibold mb-4"
                        />
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Add a description..."
                            className="min-h-[100px] mb-6"
                        />

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
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Comments</h3>
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
                                            <div key={comment.id} className="bg-muted/50 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <UserAvatar
                                                        name={comment.user.full_name || comment.user.email}
                                                        userId={comment.user.id.toString()}
                                                        className="h-8 w-8"
                                                    />
                                                    <div>
                                                        <span className="font-medium">
                                                            {comment.user.full_name || comment.user.email}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground ml-2">
                                                            {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-muted-foreground ml-10">{comment.content}</p>
                                            </div>
                                        ))}
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

                    {/* Right Column - Details */}
                    <div className="w-80 p-6 overflow-y-auto">
                        <div className="space-y-6">
                            <DetailField
                                label="Status"
                                value={
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: TaskStatus) => {
                                            console.log('Setting status to:', value);
                                            setFormData(prev => ({ ...prev, status: value }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>
                                                <StatusBadge status={formData.status} />
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(TaskStatus).map(status => (
                                                <SelectItem key={status} value={status}>
                                                    <StatusBadge status={status} />
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                }
                            />

                            <DetailField
                                label="Priority"
                                value={
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value: TaskPriority) => {
                                            console.log('Setting priority to:', value);
                                            setFormData(prev => ({ ...prev, priority: value }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>
                                                <PriorityBadge priority={formData.priority} />
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(TaskPriority).map(priority => (
                                                <SelectItem key={priority} value={priority}>
                                                    <PriorityBadge priority={priority} />
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                }
                            />

                            <DetailField
                                label="Type"
                                value={
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: TaskType) => {
                                            console.log('Setting type to:', value);
                                            setFormData(prev => ({ ...prev, type: value }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>
                                                {formData.type}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(TaskType).map(type => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                }
                            />

                            <DetailField
                                label="Assignees"
                                value={
                                    <UserCombobox
                                        teamId={teamId}
                                        selectedUsers={formData.assignees.map(a => a.id)}
                                        onSelectionChange={(userIds) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                assignees: userIds.map(id => ({
                                                    id: id,
                                                    email: teamMembers.find(m => m.id === id)?.email || '',
                                                    full_name: teamMembers.find(m => m.id === id)?.full_name
                                                }))
                                            }));
                                        }}
                                        placeholder="Select assignees"
                                    />
                                }
                            />

                            <DetailField
                                label="Due date"
                                value={
                                    <Popover
                                        open={isDueDatePopoverOpen}
                                        onOpenChange={setIsDueDatePopoverOpen}
                                        modal={true}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !dueDate && "text-muted-foreground"
                                                )}
                                            >
                                                {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                            side="bottom"
                                            sideOffset={4}
                                            style={calendarPopoverStyle}
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={dueDate}
                                                onSelect={(date) => {
                                                    handleDateSelect('due_date', date);
                                                    setIsDueDatePopoverOpen(false);
                                                }}
                                                initialFocus
                                            />
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
                                        modal={true}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !startDate && "text-muted-foreground"
                                                )}
                                            >
                                                {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                            side="bottom"
                                            sideOffset={4}
                                            style={calendarPopoverStyle}
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={startDate}
                                                onSelect={(date) => {
                                                    handleDateSelect('start_date', date);
                                                    setIsStartDatePopoverOpen(false);
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                }
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}