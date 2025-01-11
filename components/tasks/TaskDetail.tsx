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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
    CalendarIcon,
    Plus,
    CheckSquare,
    MessageSquare,
    History,
    Timer,
    Settings2,
    Share2
} from 'lucide-react';
import { UserAvatar } from "@/components/common/UserAvatar";

interface TaskDetailProps {
    isOpen: boolean;
    onClose: () => void;
    task?: {
        id?: number;
        key?: string;
        title: string;
        description?: string;
        assignee?: string;
        status?: 'To Do' | 'In Progress' | 'Done';
        priority?: 'Low' | 'Medium' | 'High';
        startDate?: Date;
        dueDate?: Date;
        reporter?: string;
        labels?: string[];
        category?: string;
        team?: string;
        timeTracking?: {
            logged: string;
            remaining: string;
        };
    };
}

interface DetailFieldProps {
    label: string;
    value: React.ReactNode;
    onClick?: () => void;
    className?: string;
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

export function TaskDetail({ isOpen, onClose, task }: TaskDetailProps) {
    const [currentTab, setCurrentTab] = useState('all');
    const currentUser = {
        name: 'Some user',
        avatar: '/avatar-placeholder.png'
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                <DialogTitle className="sr-only">
                    {task?.title || 'Task Details'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    View and edit task details, add comments, and track progress
                </DialogDescription>
                <div className="flex-1 flex">
                    {/* Left Column - Main Content */}
                    <div className="flex-1 p-6 overflow-y-auto border-r">
                        {/* Title Section */}
                        <div className="mb-6">
                            <div className="text-sm text-gray-500 mb-2">
                                {task?.key || 'New Task'}
                            </div>
                            <Input
                                placeholder="Task title"
                                defaultValue={task?.title}
                                className="text-xl font-semibold border-0 px-0 focus-visible:ring-0"
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <div className="text-sm font-medium mb-2">Description</div>
                            <Textarea
                                placeholder="Add a description..."
                                className="min-h-[200px] resize-none"
                                defaultValue={task?.description}
                            />
                        </div>

                        {/* Activity Tabs */}
                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="comments">Comments</TabsTrigger>
                                <TabsTrigger value="history">History</TabsTrigger>
                                <TabsTrigger value="work-log">Work log</TabsTrigger>
                            </TabsList>
                            <TabsContent value="all">
                                <div className="py-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <UserAvatar name={currentUser.name} />
                                        <Textarea
                                            placeholder="Add a comment..."
                                            className="resize-none"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Column - Details */}
                    <div className="w-80 flex-shrink-0 p-6 overflow-y-auto bg-gray-50">
                        <div className="space-y-1 mb-6">
                            <div className="text-sm font-medium">Details</div>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <Settings2 className="h-4 w-4 mr-2" />
                                Configure
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <DetailField
                                label="Assignee"
                                value={
                                    <div className="flex items-center gap-2">
                                        <UserAvatar name="Unassigned" className="h-6 w-6" />
                                        <span>Unassigned</span>
                                    </div>
                                }
                                onClick={() => { }}
                            />

                            <DetailField
                                label="Reporter"
                                value={
                                    <div className="flex items-center gap-2">
                                        <UserAvatar name={currentUser.name} className="h-6 w-6" />
                                        <span>{currentUser.name}</span>
                                    </div>
                                }
                            />

                            <DetailField
                                label="Priority"
                                value={
                                    <Select defaultValue={task?.priority || "Medium"}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                }
                            />

                            <DetailField
                                label="Labels"
                                value={task?.labels?.join(', ')}
                                onClick={() => { }}
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
                                                {task?.dueDate ?
                                                    format(task.dueDate, 'MMM d, yyyy') :
                                                    'None'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={task?.dueDate}
                                                onSelect={() => { }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                }
                            />

                            <DetailField
                                label="Time tracking"
                                value={
                                    <Button variant="ghost" className="p-0 h-auto">
                                        <Timer className="h-4 w-4 mr-2" />
                                        No time logged
                                    </Button>
                                }
                            />

                            <DetailField
                                label="Start date"
                                value={task?.startDate ?
                                    format(task.startDate, 'MMM d, yyyy') :
                                    'None'}
                            />

                            <DetailField
                                label="Category"
                                value={task?.category}
                            />

                            <DetailField
                                label="Team"
                                value={task?.team}
                            />
                        </div>

                        <div className="mt-6 pt-6 border-t">
                            <Button variant="secondary" className="w-full">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}