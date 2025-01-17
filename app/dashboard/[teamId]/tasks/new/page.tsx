// app/dashboard/[teamId]/tasks/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
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
    Plus,
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
import { TASK_STATUS, TASK_STATUS_DISPLAY } from '@/lib/config/taskConfig';

interface Task {
    id: number;
    key: string;
    description: string;
    assignee: string;
    status: 'Todo' | 'In Progress' | 'Done' | 'Blocked';
    type: 'Feature' | 'Bug' | 'Task' | 'Epic';
    priority: 'Low' | 'Medium' | 'High';
    start: string;
    end: string;
    created: string;
    updated: string;
    reporter: string;
}


export default function TasksPage() {
    const params = useParams();
    const teamId = params.teamId as string;

    const [tasks, setTasks] = useState<Task[]>();
    const [filters, setFilters] = useState({
        assignee: '',
        status: '',
        type: '',
        priority: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Task;
        direction: 'asc' | 'desc';
    } | null>(null);

    const handleSort = (key: keyof Task) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current?.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

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
        const matchesAssignee = !filters.assignee || task.assignee.toLowerCase() === filters.assignee.toLowerCase();
        const matchesStatus = !filters.status || task.status.toLowerCase() === filters.status.toLowerCase();
        const matchesType = !filters.type || task.type.toLowerCase() === filters.type.toLowerCase();
        const matchesPriority = !filters.priority || task.priority.toLowerCase() === filters.priority.toLowerCase();

        return matchesSearch && matchesAssignee && matchesStatus && matchesType && matchesPriority;
    });

    // Sort tasks if sort config is set
    if (sortConfig) {
        filteredTasks.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Tasks</h1>
                    <p className="text-gray-600">Manage and track team tasks</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                </Button>
            </div>

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
                            {Object.entries(TASK_STATUS).map(([key, value]) => (
                                <SelectItem key={value} value={value}>
                                    {TASK_STATUS_DISPLAY[value]}
                                </SelectItem>
                            ))}
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
                                <TableHead
                                    className="w-[100px] cursor-pointer"
                                    onClick={() => handleSort('key')}
                                >
                                    <div className="flex items-center">
                                        Key
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort('description')}
                                >
                                    <div className="flex items-center">
                                        Description
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort('assignee')}
                                >
                                    <div className="flex items-center">
                                        Assignee
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">{task.key}</TableCell>
                                    <TableCell>{task.description}</TableCell>
                                    <TableCell>{task.assignee}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                            {TASK_STATUS_DISPLAY[task.status as keyof typeof TASK_STATUS]}
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
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>Delete</DropdownMenuItem>
                                                <DropdownMenuItem>Change Status</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}