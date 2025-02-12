// components/tasks/TaskList.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
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
    Plus,
    AlertTriangle,
    ArrowUpDown,
    MoreVertical,
    Trash2,
    Loader2
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Task, TaskStatus, TaskPriority } from '@/lib/types/task';
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTask } from "@/hooks/useTask";
import { MultiSelect } from "@/components/ui/multi-select";
import { Label } from "@/components/ui/label";

interface TaskListProps {
    tasks: Task[];
    onTaskSelect: (task: Task) => void;
    teamId?: number;
    isLoading?: boolean;
}

type SortField = 'id' | 'title' | 'status' | 'priority' | 'due_date';
type SortDirection = 'asc' | 'desc';

const PRIORITY_RANK = {
    [TaskPriority.LOW]: 0,
    [TaskPriority.MEDIUM]: 1,
    [TaskPriority.HIGH]: 2,
    [TaskPriority.URGENT]: 3,
};

const sortById = (a: Task, b: Task) => {
    const aRef = a.team_ref_number || 0;
    const bRef = b.team_ref_number || 0;
    if (aRef !== bRef) return aRef - bRef;
    const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
    const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
    return aId - bId;
};

export function TaskList({ tasks, onTaskSelect, teamId, isLoading }: TaskListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilters, setStatusFilters] = useState<string[]>([]);
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
    const [sortField, setSortField] = useState<SortField>('id');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    const { deleteTask } = useTask(teamId);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const statusOptions = Object.values(TaskStatus).map(status => ({
        label: status,
        value: status,
        render: (selected: boolean) => (
            <div className="flex items-center gap-2">
                <StatusBadge status={status as TaskStatus} />
            </div>
        ),
        renderInBadge: () => <StatusBadge status={status as TaskStatus} />
    }));
    const handleDelete = async (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
            await deleteTask(task.id);
        }
    };
    const filteredAndSortedTasks = useMemo(() => {
        return tasks
            .filter(task => {
                const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilters.length === 0 || statusFilters.includes(task.status);
                const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
                return matchesSearch && matchesStatus && matchesPriority;
            })
            .sort((a, b) => {
                let comparison = 0;
                switch (sortField) {
                    case 'id': comparison = sortById(a, b); break;
                    case 'title': comparison = (a.title || '').localeCompare(b.title || ''); break;
                    case 'status': comparison = (a.status || '').localeCompare(b.status || ''); break;
                    case 'priority': comparison = (PRIORITY_RANK[a.priority] || 0) - (PRIORITY_RANK[b.priority] || 0); break;
                    case 'due_date':
                        const aDate = a.due_date ? new Date(a.due_date).getTime() : 0;
                        const bDate = b.due_date ? new Date(b.due_date).getTime() : 0;
                        comparison = aDate - bDate;
                        break;
                }
                return sortDirection === 'asc' ? comparison : -comparison;
            });
    }, [tasks, searchTerm, statusFilters, priorityFilter, sortField, sortDirection]);

    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <Button
            variant="ghost"
            onClick={() => handleSort(field)}
            className={cn(
                "h-8 flex items-center gap-1 px-0 font-medium hover:bg-transparent",
            )}
        >
            {children}
            {sortField === field && (
                <ArrowUpDown className={cn(
                    "ml-1 h-4 w-4",
                    sortDirection === 'desc' && "transform rotate-180"
                )} />
            )}
        </Button>
    );

    return (
        <div className="space-y-4 font-medium  text-muted-foreground">
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[280px]">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search task titles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 text-sm text-foreground"
                            />
                        </div>
                    </div>
                </div>
                <div className="min-w-[240px] flex-1">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Status</Label>
                        <MultiSelect
                            options={statusOptions}
                            placeholder="Filter by status"
                            onValueChange={setStatusFilters}
                            defaultValue={statusFilters}
                            className="bg-transparent hover:bg-transparent"
                            showSelectedDelete={true}
                        />
                    </div>
                </div>
                <div className="min-w-[200px]">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Priority</Label>
                        <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | "all")}>
                            <SelectTrigger className="text-sm [&_span]:font-medium">
                                <SelectValue placeholder="All Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                {Object.values(TaskPriority).map((priority) => (
                                    <SelectItem key={priority} value={priority}>
                                        <div className="flex items-center gap-2">
                                            <PriorityBadge priority={priority} />
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[1000px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px] ">
                                <SortButton field="id">ID</SortButton>
                            </TableHead>
                            <TableHead>
                                <SortButton field="title">Title</SortButton>
                            </TableHead>
                            <TableHead className="w-[160px]">
                                <SortButton field="status">Status</SortButton>
                            </TableHead>
                            <TableHead className="w-[160px]">
                                <SortButton field="priority">Priority</SortButton>
                            </TableHead>
                            <TableHead className="w-[120px]">Assignees</TableHead>
                            <TableHead className="w-[160px]">
                                <SortButton field="due_date">Due Date</SortButton>
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading tasks...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredAndSortedTasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <AlertTriangle className="h-8 w-8" />
                                        <p>No tasks found matching your criteria</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedTasks.map((task) => (
                                <TableRow
                                    key={`${task.id}-${task.team_id}`}
                                    className="cursor-pointer hover:bg-accent/50 transition-colors font-medium text-muted-foreground"
                                    onClick={() => onTaskSelect(task)}
                                >
                                    <TableCell className="">
                                        {task.team_ref_number ? `T-${task.team_ref_number}` : task.id}
                                    </TableCell>
                                    <TableCell className="text-foreground font-normal">{task.title}</TableCell>
                                    <TableCell><StatusBadge status={task.status} /></TableCell>
                                    <TableCell>
                                        <PriorityBadge priority={task.priority} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center -space-x-2">
                                            {task.assignees.slice(0, 3).map((assignee) => (
                                                <TooltipProvider key={assignee.id}>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <UserAvatar
                                                                name={assignee.full_name || assignee.email || 'Unknown'}
                                                                userId={assignee.id}
                                                                className="h-6 w-6 ring-2 ring-background"
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {assignee.full_name || assignee.email}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))}
                                            {task.assignees.length > 3 && (
                                                <div className="ring-2 ring-background rounded-full bg-muted text-xs h-6 w-6 flex items-center justify-center">
                                                    +{task.assignees.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={(e) => handleDelete(e, task)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>


        </div>
    );
}