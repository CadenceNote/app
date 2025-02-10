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
import { Task, TaskStatus, TaskPriority, TaskType, Label } from '@/lib/types/task';
import { CreateTaskInput, taskApi } from '@/services/taskApi';
import { teamApi } from '@/services/teamApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Eye } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { useUser } from '@/hooks/useUser';
import { UserCombobox } from "@/components/common/UserCombobox";
import useSWR, { mutate } from 'swr';
import { taskKeys } from '@/hooks/useTask';

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

interface CommentNode {
    comment: Comment;
    replies: CommentNode[];
}

function organizeCommentsIntoTree(comments: Comment[]): CommentNode[] {
    const commentMap = new Map<number, CommentNode>();
    const rootComments: CommentNode[] = [];

    // First, create all comment nodes
    comments.forEach(comment => {
        commentMap.set(comment.id, { comment, replies: [] });
    });

    // Then, organize them into a tree
    comments.forEach(comment => {
        const node = commentMap.get(comment.id)!;
        if (comment.parent_id) {
            const parentNode = commentMap.get(comment.parent_id);
            if (parentNode) {
                parentNode.replies.push(node);
            } else {
                rootComments.push(node);
            }
        } else {
            rootComments.push(node);
        }
    });

    return rootComments;
}

const CommentThread: React.FC<{
    commentNode: CommentNode;
    level: number;
    onReply: (comment: Comment) => void;
    onDelete: (commentId: number) => void;
    currentUserId?: string;
}> = ({ commentNode, level, onReply, onDelete, currentUserId }) => {
    const { comment, replies } = commentNode;
    const maxIndentationLevel = 5; // Maximum level of indentation
    const effectiveLevel = Math.min(level, maxIndentationLevel);

    return (
        <div className={cn("relative", level > 0 && "ml-4 pl-4 border-l border-muted")}>
            <div className="bg-muted/50 rounded-lg p-4 mb-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
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
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onReply(comment)}
                        >
                            Reply
                        </Button>
                        {comment.user.id === currentUserId && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(comment.id)}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                </div>
                <p className="text-muted-foreground">
                    {comment.content}
                </p>
            </div>
            {replies.length > 0 && (
                <div className="space-y-2">
                    {replies.map(reply => (
                        <CommentThread
                            key={reply.comment.id}
                            commentNode={reply}
                            level={level + 1}
                            onReply={onReply}
                            onDelete={onDelete}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

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

// Add this helper function to check if a comment has replies
const hasReplies = (commentId: number, comments: Comment[]): boolean => {
    return comments.some(comment => comment.parent_id === commentId);
};

export function TaskDetail({ isOpen, onClose, task, teamId, onTaskUpdate }: TaskDetailProps) {
    const [formData, setFormData] = useState(defaultFormData);
    const [newComment, setNewComment] = useState('');
    const [replyToComment, setReplyToComment] = useState<{ id: number; content: string } | null>(null);
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [isDueDatePopoverOpen, setIsDueDatePopoverOpen] = useState(false);
    const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
    const [teamMembers, setTeamMembers] = useState<{ id: string; email: string; full_name: string; avatar_url: string }[]>([]);
    const [teamName, setTeamName] = useState('');
    const [isWatching, setIsWatching] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();

    // Query for fetching complete task data
    const { data: fullTaskData, isLoading, mutate: mutateTask } = useSWR(
        isOpen && task?.id && teamId ? `tasks/${teamId}/${task.id}` : null,
        () => {
            if (!task?.id || !teamId) return null;
            return taskApi.getTask(teamId, parseInt(task.id.toString()));
        }
    );

    // Update task function
    const updateTask = async (data: Partial<CreateTaskInput>) => {
        if (!task?.id || !teamId || !fullTaskData) {
            throw new Error('Missing required task or team ID');
        }
        const taskId = parseInt(task.id.toString());
        if (isNaN(taskId)) {
            throw new Error('Invalid task ID');
        }

        try {
            // Optimistically update both the detail view and the list view
            const optimisticData = { ...fullTaskData, ...data };

            // Update the detail view cache
            await mutate(
                taskKeys.taskDetail(teamId, task.id.toString()),
                optimisticData,
                false
            );

            // Update the list view cache
            await mutate(
                taskKeys.teamTasks(teamId),
                (currentTasks: Task[] | undefined) => {
                    if (!currentTasks) return currentTasks;
                    return currentTasks.map(t =>
                        t.id === task.id ? { ...t, ...data } : t
                    );
                },
                false
            );

            // Also update the all teams view if we're in that mode
            await mutate(
                taskKeys.allTeams(),
                (currentTasks: Task[] | undefined) => {
                    if (!currentTasks) return currentTasks;
                    return currentTasks.map(t =>
                        t.id === task.id ? { ...t, ...data } : t
                    );
                },
                false
            );

            // Make the API call
            const updatedTask = await taskApi.updateTask(teamId, taskId, data);

            // Update all caches with the server response
            await Promise.all([
                mutate(taskKeys.taskDetail(teamId, task.id.toString()), updatedTask),
                mutate(taskKeys.teamTasks(teamId)),
                mutate(taskKeys.allTeams())
            ]);

            // Call the onTaskUpdate callback if provided
            if (onTaskUpdate) {
                onTaskUpdate(updatedTask);
            }

            return updatedTask;
        } catch (error) {
            // Revalidate on error to ensure we have the correct data
            await Promise.all([
                mutate(taskKeys.taskDetail(teamId, task.id.toString())),
                mutate(taskKeys.teamTasks(teamId)),
                mutate(taskKeys.allTeams())
            ]);
            throw error;
        }
    };

    // Add comment function
    const addComment = async (content: string, parentId?: number) => {
        if (!task?.id || !teamId) {
            throw new Error('Missing required task or team ID');
        }

        try {
            const newComment = await taskApi.addComment(teamId, parseInt(task.id.toString()), content, parentId);

            // Revalidate the task data to include the new comment
            await mutate(`tasks/${teamId}/${task.id}`);

            return newComment;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add comment",
                variant: "destructive"
            });
            throw error;
        }
    };

    // Delete comment function
    const deleteComment = async (commentId: number) => {
        if (!task?.id || !teamId) {
            throw new Error('Missing required task or team ID');
        }

        try {
            await taskApi.deleteComment(teamId, parseInt(task.id.toString()), commentId);
            // Revalidate the task data to remove the deleted comment
            await mutate(`tasks/${teamId}/${task.id}`);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete comment",
                variant: "destructive"
            });
            throw error;
        }
    };

    // Toggle watch function
    const toggleWatch = async () => {
        if (!task?.id || !teamId) {
            throw new Error('Missing required task or team ID');
        }

        try {
            const updatedTask = await taskApi.toggleWatch(teamId, parseInt(task.id.toString()));
            // Update the cache with the new watch status
            await mutate(`tasks/${teamId}/${task.id}`, updatedTask);
            setIsWatching(updatedTask.is_watching || false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update watch status",
                variant: "destructive"
            });
            throw error;
        }
    };

    // Effect to refetch data when modal opens
    useEffect(() => {
        if (isOpen && task?.id && teamId) {
            mutateTask();
        }
    }, [isOpen, task?.id, teamId, mutateTask]);

    // Effect to update form data when task data changes
    useEffect(() => {
        if (fullTaskData) {
            setFormData({
                title: fullTaskData.title || '',
                description: fullTaskData.description || '',
                status: fullTaskData.status,
                priority: fullTaskData.priority,
                type: fullTaskData.type || TaskType.TASK,
                start_date: fullTaskData.start_date,
                due_date: fullTaskData.due_date,
                assignees: fullTaskData.assignees || [],
                category: fullTaskData.category || '',
            });

            setStartDate(fullTaskData.start_date ? new Date(fullTaskData.start_date) : undefined);
            setDueDate(fullTaskData.due_date ? new Date(fullTaskData.due_date) : undefined);
            setIsWatching(fullTaskData.is_watching || false);
        }
    }, [fullTaskData]);

    // Handle form submission with loading state
    const handleSubmit = () => {
        if (isLoading) {
            console.log("Already submitting, returning");
            return;
        }

        if (!task?.id) {
            toast({
                title: "Error",
                description: "Cannot update task: No task ID available",
                variant: "destructive"
            });
            return;
        }

        const submitData = {
            ...formData,
            start_date: startDate?.toISOString(),
            due_date: dueDate?.toISOString(),
            assignees: formData.assignees.map(a => a.id.toString()),
        };
        console.log("submitData", submitData);

        try {
            updateTask(submitData);
            console.log("SUBMITTED TO MUTATION");
        } catch (error) {
            console.error("Error submitting mutation:", error);
            toast({
                title: "Error",
                description: "Failed to start update. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Show loading state
    if (isLoading) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogTitle>
                    Loading Task
                </DialogTitle>
                <DialogDescription>
                    Please wait while we load the task details
                </DialogDescription>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-600">Loading task details...</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Handle comment addition with loading state
    const handleAddComment = () => {
        if (isLoading || !newComment.trim()) return;

        addComment(newComment, replyToComment?.id);
    };

    // Handle comment deletion with loading state
    const handleDeleteComment = async (commentId: number) => {
        if (isLoading || !fullTaskData) return;

        const hasChildComments = hasReplies(commentId, fullTaskData.comments || []);

        if (hasChildComments) {
            const confirmed = window.confirm(
                "This comment has replies. Deleting it will also delete all replies. Are you sure you want to continue?"
            );
            if (!confirmed) return;
        }

        deleteComment(commentId);
    };

    // Handle watch toggle with loading state
    const toggleWatchWithLoading = () => {
        if (isLoading) return;
        toggleWatch();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTitle>
                {fullTaskData?.title || 'Task Details'}
            </DialogTitle>
            <DialogDescription>
                Task details and configuration
            </DialogDescription>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Column - Main Content */}
                    <div className="flex-1 p-6 overflow-y-auto border-r">
                        {/* Header Section */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-gray-500">
                                    {teamName} • T-{fullTaskData?.team_ref_number}
                                </div>
                                <Button
                                    variant={isWatching ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={toggleWatchWithLoading}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    {isWatching ? "Watching" : "Watch"}
                                </Button>
                            </div>
                            {fullTaskData && (
                                <div className="text-xs text-muted-foreground">
                                    Created {new Date(fullTaskData.created_at).toLocaleDateString()} by {fullTaskData.created_by?.full_name || fullTaskData.created_by?.email}
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
                        {(fullTaskData?.source_meeting_id || fullTaskData?.source_note_id || fullTaskData?.parent_id) && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium mb-2">Related Items</h3>
                                <div className="space-y-2">
                                    {fullTaskData.source_meeting_id && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Source Meeting:</span>
                                            <Button variant="link" className="h-auto p-0">
                                                Meeting #{fullTaskData.source_meeting_id}
                                            </Button>
                                        </div>
                                    )}
                                    {fullTaskData.source_note_id && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Source Note:</span>
                                            <Button variant="link" className="h-auto p-0">
                                                Note #{fullTaskData.source_note_id}
                                            </Button>
                                        </div>
                                    )}
                                    {fullTaskData.parent_id && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">Parent Task:</span>
                                            <Button variant="link" className="h-auto p-0">
                                                Task #{fullTaskData.parent_id}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Activity Section */}
                        {/* <div className="space-y-6">
                            {fullTaskData && <h2 className="text-lg font-semibold">Activity</h2>}

                            {fullTaskData && fullTaskData.comments && (
                                <div className="space-y-4 mt-6">
                                    <h3 className="text-sm font-medium">Comments</h3>
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder={replyToComment ? `Reply to: ${replyToComment.content}` : "Add a comment..."}
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="flex-1"
                                        />
                                        <div className="flex flex-col gap-2">
                                            <Button onClick={handleAddComment}>
                                                {replyToComment ? 'Reply' : 'Add'}
                                            </Button>
                                            {replyToComment && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setReplyToComment(null)}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {organizeCommentsIntoTree(fullTaskData.comments).map((commentNode) => (
                                            <CommentThread
                                                key={commentNode.comment.id}
                                                commentNode={commentNode}
                                                level={0}
                                                onReply={(comment) => setReplyToComment({ id: comment.id, content: comment.content })}
                                                onDelete={handleDeleteComment}
                                                currentUserId={user?.id}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div> */}

                        {/* Save Button */}
                        <div className="mt-6">
                            <Button
                                onClick={handleSubmit}
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    fullTaskData ? 'Update Task' : 'Create Task'
                                )}
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
                                                    setDueDate(date);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        due_date: date?.toISOString().split('T')[0]
                                                    }));
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
                                                    setStartDate(date);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        start_date: date?.toISOString().split('T')[0]
                                                    }));
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