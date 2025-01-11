// components/tasks/TaskList.tsx
'use client';

import { useState } from 'react';
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
    ArrowUpDown,
    ChevronDown,
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
import { TaskDetail } from './TaskDetail';
interface Task {
    id: number;
    key: string;
    description: string;
    assignee: string;
    status: 'Todo' | 'In Progress' | 'Done' | 'Blocked';
    reporter: string;
    type: 'Feature' | 'Bug' | 'Task' | 'Epic';
    priority: 'Low' | 'Medium' | 'High';
    start: string;
    end: string;
}

// Mock data
const mockTasks: Task[] = [
    {
        id: 1,
        key: "FE-101",
        description: "Implement user dashboard",
        assignee: "John Doe",
        status: "In Progress",
        type: "Feature",
        start: "2025-01-01",
        end: "2025-01-15",
        reporter: "Alice Johnson",
        priority: 'Low'
    },
    {
        id: 2,
        key: "BE-203",
        description: "API Authentication endpoints",
        assignee: "Jane Smith",
        status: "Todo",
        start: "2025-01-15",
        end: "2025-01-30",
        reporter: "Bob Brown",
        type: 'Feature',
        priority: 'Low'
    },
    {
        id: 3,
        key: "FE-102",
        description: "Fix navigation responsiveness",
        assignee: "John Doe",
        start: "2025-01-05",
        end: "2025-01-12",
        reporter: "Charlie Davis",
        priority: "High",
        status: 'Todo',
        type: 'Feature'
    }
];

interface TaskListProps {
    teamId: string;
}

export function TaskList({ teamId }: TaskListProps) {
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [filters, setFilters] = useState({
        assignee: 'all',
        status: 'all',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const getStatusColor = (status: Task['status']) => {
        const colors = {
            'Todo': 'bg-gray-100 text-gray-800',
            'In Progress': 'bg-blue-100 text-blue-800',
            'Done': 'bg-green-100 text-green-800',
            'Blocked': 'bg-red-100 text-red-800'
        };
        return colors[status] || colors['Todo'];
    };

    const getPriorityColor = (priority: Task['priority']) => {
        const colors = {
            'Low': 'bg-gray-100 text-gray-800',
            'Medium': 'bg-yellow-100 text-yellow-800',
            'High': 'bg-red-100 text-red-800'
        };
        return colors[priority] || colors['Low'];
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.key.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAssignee = filters.assignee === 'all' || task.assignee.toLowerCase() === filters.assignee.toLowerCase();
        const matchesStatus = filters.status === 'all' || task.status.toLowerCase() === filters.status.toLowerCase();

        return matchesSearch && matchesAssignee && matchesStatus;
    });
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
                        <SelectItem value="todo">Todo</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={filters.assignee}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by assignee" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Assignees</SelectItem>
                        <SelectItem value="john doe">John Doe</SelectItem>
                        <SelectItem value="jane smith">Jane Smith</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Key</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Timeline</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTasks.map((task) => (
                            <TableRow
                                key={task.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleRowClick(task)}
                            >
                                <TableCell className="font-medium">{task.key}</TableCell>
                                <TableCell>{task.description}</TableCell>
                                <TableCell>{task.assignee}</TableCell>
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
                                        <div>Start: {task.start}</div>
                                        <div>End: {task.end}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem>Change Status</DropdownMenuItem>
                                            <DropdownMenuItem>Delete</DropdownMenuItem>
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
                    }}
                    task={selectedTask}
                />
            )}

            <TaskDetail
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                isEditing={true}
            />
        </div>

    );
}