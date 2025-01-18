// components/tasks/TaskList.tsx
'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    ChevronDown,
    Plus
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task, TaskStatus, TaskPriority } from '@/lib/types/task';
import { TaskDetail } from './TaskDetail';
import { taskApi } from '@/services/taskApi';
import { useToast } from '@/hooks/use-toast';
import { TASK_STATUS_DISPLAY } from '@/lib/config/taskConfig';



interface TaskListProps {
    teamId: number;
}

export function TaskList({ teamId }: TaskListProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        assignee: 'all',
        status: 'all',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { toast } = useToast();

    // Fetch tasks
    const fetchTasks = async () => {
        try {
            setIsLoading(true);
            const statusFilter = filters.status !== 'all' ? [filters.status as TaskStatus] : undefined;
            const assigneeFilter = filters.assignee !== 'all' ? parseInt(filters.assignee) : undefined;

            const fetchedTasks = await taskApi.listTasks(teamId, {
                status: statusFilter,
                assignee_id: assigneeFilter,
                search: searchTerm || undefined
            });
            setTasks(fetchedTasks);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            toast({
                title: "Error",
                description: "Failed to load tasks. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch tasks on mount and when filters change
    useEffect(() => {
        fetchTasks();
    }, [teamId, filters, searchTerm]);

    const handleCreateTask = () => {
        setSelectedTask(null);
        setIsCreateOpen(true);
    };

    const handleTaskUpdate = (updatedTask: Task) => {
        setSelectedTask(updatedTask);
        // Also update the task in the list
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === updatedTask.id ? updatedTask : task
            )
        );
    };

    const handleTaskDelete = async (taskId: number) => {
        try {
            await taskApi.deleteTask(teamId, taskId);
            fetchTasks(); // Refresh the list
            toast({
                title: "Success",
                description: "Task deleted successfully",
            });
        } catch (error) {
            console.error('Failed to delete task:', error);
            toast({
                title: "Error",
                description: "Failed to delete task. Please try again.",
                variant: "destructive"
            });
        }
    };

    const getStatusColor = (status: TaskStatus) => {
        const colors = {
            [TaskStatus.TODO]: 'bg-gray-100 text-gray-800',
            [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
            [TaskStatus.DONE]: 'bg-green-100 text-green-800',
            [TaskStatus.BLOCKED]: 'bg-red-100 text-red-800'
        };
        return colors[status] || colors[TaskStatus.TODO];
    };

    const getPriorityColor = (priority: TaskPriority) => {
        const colors = {
            [TaskPriority.LOW]: 'bg-gray-100 text-gray-800',
            [TaskPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
            [TaskPriority.HIGH]: 'bg-red-100 text-red-800',
            [TaskPriority.URGENT]: 'bg-orange-100 text-orange-800'
        };
        return colors[priority] || colors[TaskPriority.LOW];
    };

    const handleRowClick = (task: Task) => {
        setSelectedTask(task);
        setIsDetailOpen(true);
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {Object.values(TaskStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                                {TASK_STATUS_DISPLAY[status] || status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={handleCreateTask}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                </Button>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Key</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Timeline</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    Loading tasks...
                                </TableCell>
                            </TableRow>
                        ) : tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    No tasks found
                                </TableCell>
                            </TableRow>
                        ) : tasks.map((task) => (
                            <TableRow
                                key={task.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleRowClick(task)}
                            >
                                <TableCell className="font-medium">T-{task.team_ref_number}</TableCell>
                                <TableCell>{task.title}</TableCell>
                                <TableCell>
                                    {task.assignee ? task.assignee.full_name : 'Unassigned'}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                        {task.status}
                                    </span>
                                </TableCell>
                                <TableCell>{task.type}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div>Start: {task.start_date ? task.start_date : 'Not set'}</div>
                                        <div>End: {task.due_date ? task.due_date : 'Not set'}</div>
                                    </div>
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleTaskUpdate(task)}>
                                                Start Progress
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleTaskUpdate(task)}>
                                                Mark as Done
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleTaskDelete(task.id)} className="text-red-600">
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {selectedTask && (
                <TaskDetail
                    isOpen={isDetailOpen}
                    onClose={() => {
                        setIsDetailOpen(false);
                        setSelectedTask(null);
                        fetchTasks(); // Refresh after closing detail view
                    }}
                    task={selectedTask}
                    teamId={teamId}
                    onTaskUpdate={handleTaskUpdate}
                />
            )}

            <TaskDetail
                isOpen={isCreateOpen}
                onClose={() => {
                    setIsCreateOpen(false);
                    fetchTasks(); // Refresh after closing create view
                }}
                teamId={teamId}
                task={undefined}
            />
        </div>
    );
}