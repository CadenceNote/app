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
import { Task, TaskStatus, TaskPriority, TaskType } from '@/lib/types/task';
import { taskApi, CreateTaskInput } from '@/services/taskApi';
import { useToast } from '@/hooks/use-toast';


interface TaskDetailProps {
    isOpen: boolean;
    onClose: () => void;
    task?: Task;
    teamId: number;
}

interface DetailFieldProps {
    label: string;
    value: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

interface FormData {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType;
    startDate?: Date;
    dueDate?: Date;
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

export function TaskDetail({ isOpen, onClose, task, teamId }: TaskDetailProps) {
    const [formData, setFormData] = useState<FormData>({
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || TaskStatus.TODO,
        priority: task?.priority || TaskPriority.MEDIUM,
        type: task?.type || TaskType.TASK,
        startDate: task?.startDate,
        dueDate: task?.dueDate,
    });
    const { toast } = useToast();

    const handleSubmit = async () => {
        try {
            const apiData: CreateTaskInput = {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                type: formData.type,
                status: formData.status,
                start_date: formData.startDate?.toISOString(),
                due_date: formData.dueDate?.toISOString(),
            };

            if (task) {
                // Update existing task
                await taskApi.updateTask(teamId, task.id, {
                    title: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                    type: formData.type,
                    status: formData.status,
                    startDate: formData.startDate,
                    dueDate: formData.dueDate,
                });
                toast({
                    title: "Success",
                    description: "Task updated successfully",
                });
            } else {
                // Create new task
                await taskApi.createTask(teamId, apiData);
                toast({
                    title: "Success",
                    description: "Task created successfully",
                });
            }
            onClose();
        } catch (error) {
            console.error('Failed to save task:', error);
            toast({
                title: "Error",
                description: "Failed to save task. Please try again.",
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
                            <div className="text-sm text-gray-500 mb-2">
                                {task ? `T-${task.team_ref_number}` : 'New Task'}
                            </div>
                            <Input
                                placeholder="Task title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="text-xl font-semibold border-0 px-0 focus-visible:ring-0"
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <div className="text-sm font-medium mb-2">Description</div>
                            <Textarea
                                placeholder="Add a description..."
                                className="min-h-[200px] resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        {/* Save Button */}
                        <div className="mt-6">
                            <Button onClick={handleSubmit} className="w-full">
                                {task ? 'Update Task' : 'Create Task'}
                            </Button>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="w-80 flex-shrink-0 p-6 overflow-y-auto bg-gray-50">
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
                                            <SelectItem value={TaskStatus.TODO}>Todo</SelectItem>
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
                                            <SelectItem value={TaskType.EPIC}>Epic</SelectItem>
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
                                                {formData.dueDate ?
                                                    format(formData.dueDate, 'MMM d, yyyy') :
                                                    'None'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.dueDate}
                                                onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date || undefined }))}
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
                                                {formData.startDate ?
                                                    format(formData.startDate, 'MMM d, yyyy') :
                                                    'None'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.startDate}
                                                onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date || undefined }))}
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