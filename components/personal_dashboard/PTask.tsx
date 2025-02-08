import { Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Sheet, SheetTitle, SheetHeader, SheetContent, SheetTrigger, SheetDescription } from "../ui/sheet"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable, pointerWithin, rectIntersection } from "@dnd-kit/core"
import { DroppableContainer, SortableItem } from "./Draggable"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { useState, useEffect } from "react"
import { teamApi } from '@/services/teamApi'
import { taskApi } from '@/services/taskApi'
import { mapPriorityToEnum, mapStatusToEnum } from '@/utils/taskMappings'
import { TaskType } from '@/lib/types/task'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
    ContextMenuLabel,
} from "../ui/context-menu"
import { Checkbox } from "../ui/checkbox"
import {
    CaretSortIcon,
    ChevronDownIcon,
    DotsHorizontalIcon,
} from "@radix-ui/react-icons"
import { TaskDetail } from "@/components/tasks/TaskDetail"
import { Command } from 'cmdk'
import { Calendar, Clock, Filter, Group, Keyboard, Search, User } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from 'date-fns'
import { DialogDescription } from "../ui/dialog"
import { DialogContent } from "../ui/dialog"
import { DialogTitle } from "../ui/dialog"
import { DialogHeader } from "../ui/dialog"
import { Dialog } from "@radix-ui/react-dialog"
import { TaskPriority, TaskStatus } from '@/lib/types/task'
import { toast } from "@/hooks/use-toast"

type Task = {
    id: string;
    taskId: string;
    title: string;
    description?: string;
    category: string;
    status: TaskStatus;
    due_date?: string | null;
    priority: TaskPriority;
    importance: 'important' | 'normal';
    urgency: 'urgent' | 'not-urgent';
    quadrant: 'important-urgent' | 'important-not-urgent' | 'not-important-urgent' | 'not-important-not-urgent' | 'unsorted';
    team_id: number;
    created_at: string;
    updated_at?: string;
    assignee?: {
        id: string;
        email: string;
        full_name?: string;
        avatar_url?: string;
    };
    time_estimates?: {
        original_estimate: number;
        remaining_estimate: number;
        unit: string;
    };
    tag: string;
    order_in_quadrant?: number;
    labels?: string[];
    team_ref_number?: string;
};

type PTaskProps = {
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    searchTerm: string;
};

type GroupBy = 'status' | 'priority' | 'assignee' | 'category' | 'none';

// Status Badge Component
const StatusBadge = ({ status }: { status: TaskStatus }) => {
    const statusStyles = {
        [TaskStatus.TODO]: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
        [TaskStatus.IN_PROGRESS]: "bg-blue-50 text-blue-700 ring-blue-600/20",
        [TaskStatus.IN_REVIEW]: "bg-orange-50 text-orange-700 ring-orange-600/20",
        [TaskStatus.DONE]: "bg-green-50 text-green-700 ring-green-600/20",
        [TaskStatus.BACKLOG]: "bg-gray-50 text-gray-700 ring-gray-600/20",
        [TaskStatus.BLOCKED]: "bg-red-50 text-red-700 ring-red-600/20",
        [TaskStatus.CANCELED]: "bg-purple-50 text-purple-700 ring-purple-600/20",
    };

    // Convert to display format (e.g., "IN_PROGRESS" -> "In Progress")
    const displayStatus = status.split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');

    return (
        <span className={cn(
            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
            statusStyles[status]
        )}>
            {displayStatus}
        </span>
    );
};

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority: Task['priority'] }) => {
    const priorityStyles = {
        [TaskPriority.URGENT]: "bg-purple-50 text-purple-700 ring-purple-600/20",
        [TaskPriority.HIGH]: "bg-red-50 text-red-700 ring-red-600/20",
        [TaskPriority.MEDIUM]: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
        [TaskPriority.LOW]: "bg-green-50 text-green-700 ring-green-600/20",
    };

    // Convert to display format
    const displayPriority = priority.charAt(0) + priority.slice(1).toLowerCase();

    return (
        <span className={cn(
            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
            priorityStyles[priority]
        )}>
            {displayPriority}
        </span>
    );
};

// Task Context Menu Component
const TaskContextMenu = ({ task, onStatusChange, onDelete }) => {
    return (
        <ContextMenu>
            <ContextMenuTrigger onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <DotsHorizontalIcon className="h-4 w-4" />
                </Button>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-[200px]">
                <ContextMenuLabel>Task Actions</ContextMenuLabel>
                <ContextMenuItem onClick={() => window.open(`/tasks/${task.id}`, '_blank')}>
                    Open in new tab
                </ContextMenuItem>
                <ContextMenuItem onClick={() => navigator.clipboard.writeText(task.taskId)}>
                    Copy task ID
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuLabel>Change Status</ContextMenuLabel>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.TODO)}>
                    Mark as To Do
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.IN_PROGRESS)}>
                    Mark as In Progress
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.IN_REVIEW)}>
                    Mark as In Review
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.DONE)}>
                    Mark as Done
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.BACKLOG)}>
                    Move to Backlog
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.BLOCKED)}>
                    Mark as Blocked
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    onClick={() => onDelete(task.id)}
                    className="text-red-600"
                >
                    Delete Task
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};

// Enhanced Filter Dialog Content
const FilterDialogContent = ({ filters, setFilters, onClose }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    return (
        <div className="grid gap-4 py-4">
            <div className="space-y-4">
                <div>
                    <Label>Status</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.values(TaskStatus).map(status => (
                            <div key={status} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`status-${status}`}
                                    checked={localFilters.status.includes(status)}
                                    onCheckedChange={(checked) => {
                                        setLocalFilters(prev => ({
                                            ...prev,
                                            status: checked
                                                ? [...prev.status, status]
                                                : prev.status.filter(s => s !== status)
                                        }));
                                    }}
                                />
                                <Label htmlFor={`status-${status}`}>{status}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <Label>Priority</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {['High', 'Medium', 'Low'].map(priority => (
                            <div key={priority} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`priority-${priority}`}
                                    checked={localFilters.priority.includes(priority)}
                                    onCheckedChange={(checked) => {
                                        setLocalFilters(prev => ({
                                            ...prev,
                                            priority: checked
                                                ? [...prev.priority, priority]
                                                : prev.priority.filter(p => p !== priority)
                                        }));
                                    }}
                                />
                                <Label htmlFor={`priority-${priority}`}>{priority}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button
                    variant="outline"
                    onClick={() => {
                        setLocalFilters({
                            status: [],
                            priority: [],
                            category: [],
                            assignee: [],
                        });
                    }}
                >
                    Reset
                </Button>
                <Button
                    onClick={() => {
                        setFilters(localFilters);
                        onClose();
                    }}
                >
                    Apply Filters
                </Button>
            </div>
        </div>
    );
};

// Add this helper function at the top of the file
const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : format(date, 'MMM d, yyyy');
};

export default function PTask({ tasks, setTasks, searchTerm }: PTaskProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [showCompletedTasks, setShowCompletedTasks] = useState(false);

    const [teams, setTeams] = useState<{ id: number, name: string }[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'taskId', direction: 'asc' });
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
    const [tableFilter, setTableFilter] = useState("");

    const [groupBy, setGroupBy] = useState<GroupBy>('none');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: [] as TaskStatus[],
        priority: [] as string[],
        category: [] as string[],
        assignee: [] as string[],
    });

    const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);

    // Fetch teams on component mount
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const userTeams = await teamApi.getUserTeams();
                setTeams(userTeams);
                if (userTeams.length > 0) {
                    setSelectedTeam(userTeams[0].id);
                }
            } catch (error) {
                console.error('Error fetching teams:', error);
            }
        };

        fetchTeams();
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: {
        active: { id: string };
    }) => {
        const { active } = event;
        setActiveId(active.id);

        const task = tasks.find((t) => t.id === active.id);
        if (task) {
            setActiveTask(task);
        }
    };

    const handleDragEnd = async (event: {
        active: { id: string; data?: { current?: { quadrant?: string } } };
        over: { id: string } | null;
    }) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveTask(null);

        if (!over || !tasks) return;


        const taskId = active.id;
        const task = tasks.find((t) => t?.id === taskId);
        const sourceQuadrant = active.data?.current?.quadrant;

        if (!task) return;

        try {
            // Check if dropping on another task or a container
            const isDroppedOnTask = tasks.some(t => t?.id === over.id);
            const targetQuadrant = isDroppedOnTask
                ? tasks.find(t => t?.id === over.id)?.quadrant
                : over.id as Task['quadrant'];

            if (!targetQuadrant) return;

            if (sourceQuadrant === targetQuadrant) {
                // Get all tasks in this quadrant
                const tasksInQuadrant = tasks
                    .filter(t => t && t.quadrant === targetQuadrant)
                    .sort((a, b) => (a.order_in_quadrant || 0) - (b.order_in_quadrant || 0));


                // Find the dropped position
                const oldIndex = tasksInQuadrant.findIndex(t => t.id === taskId);
                const overClientY = event.over?.rect.top + (event.over?.rect.height ?? 0) / 2;
                const activeClientY = event.active.rect.current.translated?.top ?? 0;

                // Determine if inserting before or after based on cursor position
                let newIndex = tasksInQuadrant.findIndex(t => t.id === over.id);
                if (activeClientY > overClientY) {
                    newIndex += 1; // Insert after if cursor is in the lower half
                }


                if (oldIndex === newIndex) return;

                // Remove from old position and insert at new position
                const newOrder = [...tasksInQuadrant];
                newOrder.splice(oldIndex, 1);
                newOrder.splice(newIndex, 0, task);

                // Update local state
                const updatedTasks = tasks.map(t => {
                    const index = newOrder.findIndex(no => no.id === t.id);
                    if (index === -1) return t;
                    return {
                        ...t,
                        order_in_quadrant: index + 1
                    };
                });

                // Update both local state and parent state
                setTasks(updatedTasks);

            } else {
                // Handle quadrant change (including moves to/from unsorted)
                let importance: Task['importance'] = 'normal';
                let urgency: Task['urgency'] = 'not-urgent';

                switch (targetQuadrant) {
                    case 'important-urgent':
                        importance = 'important';
                        urgency = 'urgent';
                        break;
                    case 'important-not-urgent':
                        importance = 'important';
                        urgency = 'not-urgent';
                        break;
                    case 'not-important-urgent':
                        importance = 'normal';
                        urgency = 'urgent';
                        break;
                    case 'not-important-not-urgent':
                        importance = 'normal';
                        urgency = 'not-urgent';
                        break;
                    case 'unsorted':
                        importance = 'normal';
                        urgency = 'not-urgent';
                        break;
                    default:
                        return;
                }

                // Get the maximum order in the target quadrant
                const tasksInTargetQuadrant = tasks.filter(t => t.quadrant === targetQuadrant);
                const maxOrderInTarget = Math.max(
                    ...tasksInTargetQuadrant.map(t => t.order_in_quadrant ?? 0),
                    0
                );

                const newOrder = maxOrderInTarget + 1;

                // Optimistic update
                const updatedTasks = tasks.map(t => {
                    if (t.id === taskId) {
                        return {
                            ...t,
                            quadrant: targetQuadrant,
                            importance,
                            urgency,
                            order_in_quadrant: newOrder
                        };
                    }
                    return t;
                });

                // Update local state
                setTasks(updatedTasks);

                // Update the database
                try {
                    await taskApi.updatePersonalPreferences(Number(taskId), {
                        importance: importance === 'important',
                        urgency: urgency === 'urgent',
                        quadrant: targetQuadrant,
                        order_in_quadrant: newOrder
                    });
                } catch (error) {
                    console.error('Error updating task:', error);
                    // Revert optimistic update if needed
                    setTasks(tasks);
                }
            }
        } catch (error) {
            console.error('Error in drag end:', error);
            // Revert optimistic update if needed
        }
    };

    const addTask = async (formData: FormData) => {
        if (!selectedTeam) return;

        const title = formData.get("title") as string;
        const category = formData.get("category") as string || 'Other';
        const status = formData.get("status") as Task['status'] || TaskStatus.TODO;
        const dueDate = formData.get("dueDate") as string;
        const priority = formData.get("priority") as Task['priority'] || 'Medium';

        console.log("1. Form data processed:", { title, category, status, dueDate, priority });

        try {
            const apiData = {
                title,
                description: '',
                category,
                status: mapStatusToEnum(status),
                priority: mapPriorityToEnum(priority),
                due_date: dueDate,
                type: TaskType.TASK,
                team_id: selectedTeam,
                task_metadata: {}
            };

            console.log("2. Sending to API:", apiData);

            const response = await taskApi.createTask(selectedTeam, apiData);
            console.log("3. API Response received:", response);

            if (response && response.id) {
                // Get the maximum order in the "unsorted" quadrant
                const maxOrderInUnsorted = Math.max(
                    ...tasks
                        .filter(t => t.quadrant === "unsorted")
                        .map(t => t.order_in_quadrant ?? 0),
                    0
                );

                const newTask: Task = {
                    id: response.id.toString(),
                    taskId: `TASK-${response.team_ref_number}`,
                    title,
                    category,
                    status,
                    due_date: dueDate,
                    priority: priority.toLowerCase(),
                    importance: "normal",
                    urgency: "not-urgent",
                    quadrant: "unsorted",
                    order_in_quadrant: maxOrderInUnsorted + 1,
                    team_id: selectedTeam,
                    tag: category
                };

                console.log("4. Updating local tasks state with:", newTask);

                // Update tasks through the parent component's handler
                const updatedTasks = [...tasks, newTask];
                setTasks(updatedTasks);

                setIsSheetOpen(false);
                console.log("5. Task added successfully");
            } else {
                console.error("Response missing ID:", response);
                throw new Error("Invalid response from server");
            }
        } catch (error) {
            console.error('Error creating task:', error);
            alert(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    const deleteTask = (id: string) => {
        setTasks(tasks.filter(task => task.id !== id));
    };
    const filteredTasks = tasks.filter(
        (task) =>
            task &&
            (task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.priority?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const sortedFilteredTasks = [...filteredTasks]
        .filter(task => showCompletedTasks ? true : task.status !== TaskStatus.DONE)
        .sort((a, b) => {
            if (a.quadrant !== b.quadrant) return 0;
            const orderA = typeof a.order_in_quadrant === 'number' ? a.order_in_quadrant : Infinity;
            const orderB = typeof b.order_in_quadrant === 'number' ? b.order_in_quadrant : Infinity;
            return orderA - orderB;
        });

    const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
        try {
            // Update local state
            const updatedTasks = tasks.map(task =>
                task.id === taskId ? { ...task, status: newStatus } : task
            );
            setTasks(updatedTasks);


        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    // Create a reusable TaskItem component with context menu
    const TaskItem = ({ task, onDelete, onStatusChange }) => (
        <ContextMenu>
            <ContextMenuTrigger>
                <div className={cn(
                    "relative", // Add relative positioning for the overlay
                    task.status === TaskStatus.DONE && "opacity-80" // Reduce opacity for done tasks
                )}>
                    <SortableItem
                        key={task.id}
                        item={task}
                        onDelete={onDelete}
                        type="task"
                    />
                    {task.status === TaskStatus.DONE && (
                        <div className="absolute inset-0 bg-green-50 bg-opacity-40 flex items-center justify-end">
                            <span className="text-green-600 text-xs font-medium">Done</span>
                        </div>
                    )}
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.TODO)}>
                    Mark as To Do
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.IN_PROGRESS)}>
                    Mark as In Progress
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.IN_REVIEW)}>
                    Mark as In Review
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.DONE)}>
                    Mark as Done
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.BACKLOG)}>
                    Move to Backlog
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onStatusChange(task.id, TaskStatus.BLOCKED)}>
                    Mark as Blocked
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
                    Delete Task
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );

    // Add sorting function
    const sortedTasks = [...sortedFilteredTasks].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    // Add header component for sortable columns
    const SortableHeader = ({ column, label }: { column: keyof Task, label: string }) => (
        <Button
            variant="ghost"
            onClick={() => {
                setSortConfig({
                    key: column,
                    direction: sortConfig.key === column && sortConfig.direction === 'asc' ? 'desc' : 'asc',
                });
            }}
        >
            {label}
            <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
    );


    // Update the filtering logic in your sortedTasks
    const filteredAndSortedTasks = sortedTasks
        .filter(task => {
            // Apply text filter
            if (tableFilter && !Object.values(task).some(value =>
                value?.toString().toLowerCase().includes(tableFilter.toLowerCase())
            )) {
                return false;
            }

            // Apply status filter
            if (filters.status.length > 0 && !filters.status.includes(task.status)) {
                return false;
            }

            // Apply priority filter
            if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
                return false;
            }

            // Apply category filter
            if (filters.category.length > 0 && !filters.category.includes(task.category)) {
                return false;
            }

            return true;
        });

    const handleTaskUpdate = async (updatedTask: Task) => {
        if (!selectedTeam) return;

        try {
            if (!updatedTask.id) {
                const createdTask = await taskApi.createTask(selectedTeam, {
                    title: updatedTask.title,
                    description: updatedTask.description || '',
                    status: updatedTask.status,
                    priority: updatedTask.priority,
                    type: updatedTask.type,
                    start_date: updatedTask.start_date,
                    due_date: updatedTask.due_date,
                    assignee_id: updatedTask.assignee?.id,
                    category: updatedTask.category,
                });

                // Add personal preferences
                await taskApi.updatePersonalPreferences(createdTask.id, {
                    importance: updatedTask.importance === 'important',
                    urgency: updatedTask.urgency === 'urgent',
                    quadrant: updatedTask.quadrant,
                    order_in_quadrant: updatedTask.order_in_quadrant || 0
                });

                setTasks([{
                    ...createdTask,
                    importance: updatedTask.importance,
                    urgency: updatedTask.urgency,
                    quadrant: updatedTask.quadrant,
                    order_in_quadrant: updatedTask.order_in_quadrant
                }]);
            } else {
                const updatedTaskData = await taskApi.updateTask(selectedTeam, Number(updatedTask.id), {
                    title: updatedTask.title,
                    description: updatedTask.description,
                    status: updatedTask.status,
                    priority: updatedTask.priority,
                    type: updatedTask.type,
                    start_date: updatedTask.start_date,
                    due_date: updatedTask.due_date,
                    assignee_id: updatedTask.assignee?.id,
                    category: updatedTask.category,
                });

                // Update personal preferences if they changed
                await taskApi.updatePersonalPreferences(updatedTask.id, {
                    importance: updatedTask.importance === 'important',
                    urgency: updatedTask.urgency === 'urgent',
                    quadrant: updatedTask.quadrant,
                    order_in_quadrant: updatedTask.order_in_quadrant || 0
                });

                setTasks(updatedTaskData);
            }

            toast({
                title: updatedTask.id ? "Task updated" : "Task created",
                description: updatedTask.id
                    ? "The task has been updated successfully."
                    : "The new task has been created successfully."
            });
        } catch (error) {
            console.error('Failed to handle task update:', error);
            toast({
                title: "Error",
                description: "Failed to update task. Please try again.",
                variant: "destructive"
            });
        }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Tasks</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">


                    </div>
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button size="sm" className="">
                                <Plus className="h-4 w-4 font-bold" /> New Task
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Add New Task</SheetTitle>
                                <SheetDescription>Fill in the details to add a new task to your list.</SheetDescription>
                            </SheetHeader>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!selectedTeam) {
                                        alert('Please select a team');
                                        return;
                                    }
                                    const form = e.target as HTMLFormElement;
                                    const formData = new FormData(form);

                                    try {
                                        await addTask(formData);
                                        form.reset();
                                    } catch (error) {
                                        console.error('Form submission error:', error);
                                    }
                                }}
                                className="space-y-4 mt-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="team">Team</Label>
                                    <Select
                                        name="team"
                                        value={selectedTeam?.toString() || ''}
                                        onValueChange={(value) => setSelectedTeam(Number(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teams.map((team) => (
                                                <SelectItem key={team.id} value={team.id.toString()}>
                                                    {team.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" name="title" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select name="category" defaultValue="Feature">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Feature">Feature</SelectItem>
                                            <SelectItem value="Bug">Bug</SelectItem>
                                            <SelectItem value="Documentation">Documentation</SelectItem>
                                            <SelectItem value="Research">Research</SelectItem>
                                            <SelectItem value="Design">Design</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select name="status" defaultValue={TaskStatus.TODO}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                                            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                                            <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                                            <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                                            <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
                                            <SelectItem value={TaskStatus.BLOCKED}>Blocked</SelectItem>
                                            <SelectItem value={TaskStatus.CANCELED}>Canceled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input id="dueDate" name="dueDate" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select name="priority" defaultValue={TaskPriority.MEDIUM}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                                            <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                                            <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                                            <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-end mt-6">
                                    <Button
                                        type="submit"
                                        className="bg-indigo-500 hover:bg-indigo-600"
                                    >
                                        Add Task
                                    </Button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <Tabs defaultValue="matrix" className="w-full">

                <div className="flex mb-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="showCompleted"
                            checked={showCompletedTasks}
                            onCheckedChange={(checked) => setShowCompletedTasks(checked as boolean)}
                        />
                        <Label
                            htmlFor="showCompleted"
                            className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Show completed tasks
                        </Label>
                    </div>
                    <TabsList className="ml-auto">
                        <TabsTrigger value="matrix">Matrix View</TabsTrigger>
                        <TabsTrigger value="list">List View</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="matrix">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={pointerWithin}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="grid grid-cols-1 gap-8 h-full">
                                <DroppableContainer id="important-urgent" title="Important & Urgent">
                                    <SortableContext items={sortedFilteredTasks.filter(task =>
                                        task.quadrant === 'important-urgent'
                                    )} strategy={verticalListSortingStrategy}>
                                        <ul className="space-y-2">
                                            {sortedFilteredTasks
                                                .filter(task => task.quadrant === 'important-urgent')
                                                .map((task) => (
                                                    <TaskItem
                                                        key={task.id}
                                                        task={task}
                                                        onDelete={deleteTask}
                                                        onStatusChange={handleStatusChange}
                                                    />
                                                ))}
                                        </ul>
                                    </SortableContext>
                                </DroppableContainer>

                                <DroppableContainer id="important-not-urgent" title="Important & Not Urgent">
                                    <SortableContext items={sortedFilteredTasks.filter(task =>
                                        task.quadrant === 'important-not-urgent'
                                    )} strategy={verticalListSortingStrategy}>
                                        <ul className="space-y-2">
                                            {sortedFilteredTasks
                                                .filter(task => task.quadrant === 'important-not-urgent')
                                                .map((task) => (
                                                    <TaskItem
                                                        key={task.id}
                                                        task={task}
                                                        onDelete={deleteTask}
                                                        onStatusChange={handleStatusChange}
                                                    />
                                                ))}
                                        </ul>
                                    </SortableContext>
                                </DroppableContainer>
                            </div>

                            <div className="grid grid-cols-1 gap-8 h-full">
                                <DroppableContainer id="not-important-urgent" title="Not Important & Urgent">
                                    <SortableContext items={sortedFilteredTasks.filter(task =>
                                        task.quadrant === 'not-important-urgent'
                                    )} strategy={verticalListSortingStrategy}>
                                        <ul className="space-y-2">
                                            {sortedFilteredTasks
                                                .filter(task => task.quadrant === 'not-important-urgent')
                                                .map((task) => (
                                                    <TaskItem
                                                        key={task.id}
                                                        task={task}
                                                        onDelete={deleteTask}
                                                        onStatusChange={handleStatusChange}
                                                    />
                                                ))}
                                        </ul>
                                    </SortableContext>
                                </DroppableContainer>

                                <DroppableContainer id="not-important-not-urgent" title="Not Important & Not Urgent">
                                    <SortableContext items={sortedFilteredTasks.filter(task =>
                                        task.quadrant === 'not-important-not-urgent'
                                    )} strategy={verticalListSortingStrategy}>
                                        <ul className="space-y-2">
                                            {sortedFilteredTasks
                                                .filter(task => task.quadrant === 'not-important-not-urgent')
                                                .map((task) => (
                                                    <TaskItem
                                                        key={task.id}
                                                        task={task}
                                                        onDelete={deleteTask}
                                                        onStatusChange={handleStatusChange}
                                                    />
                                                ))}
                                        </ul>
                                    </SortableContext>
                                </DroppableContainer>
                            </div>
                        </div>

                        {sortedFilteredTasks.some(task => task.quadrant === 'unsorted') && (
                            <div className="mt-4">
                                <DroppableContainer id="unsorted" title="Unsorted Tasks">
                                    <SortableContext items={sortedFilteredTasks.filter(task =>
                                        task.quadrant === 'unsorted'
                                    )} strategy={verticalListSortingStrategy}>
                                        <ul className="space-y-2">
                                            {sortedFilteredTasks
                                                .filter(task => task.quadrant === 'unsorted')
                                                .map((task) => (
                                                    <TaskItem
                                                        key={task.id}
                                                        task={task}
                                                        onDelete={deleteTask}
                                                        onStatusChange={handleStatusChange}
                                                    />
                                                ))}
                                        </ul>
                                    </SortableContext>
                                </DroppableContainer>
                            </div>
                        )}

                        <DragOverlay>
                            {activeTask ? <SortableItem item={activeTask} onDelete={deleteTask} type="task" /> : null}
                        </DragOverlay>
                    </DndContext>
                </TabsContent>

                <TabsContent value="list">
                    <div className="space-y-4">
                        {/* Command Bar */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tasks... (Ctrl+K)"
                                    value={tableFilter}
                                    onChange={(e) => setTableFilter(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(true)}
                                className="gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                Filters
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Group className="h-4 w-4" />
                                        Group by: {groupBy === 'none' ? 'None' : groupBy}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setGroupBy('none')}>
                                        None
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupBy('status')}>
                                        Status
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupBy('priority')}>
                                        Priority
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupBy('assignee')}>
                                        Assignee
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setGroupBy('category')}>
                                        Category
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Keyboard className="h-4 w-4" />
                                Shortcuts
                            </Button>
                        </div>

                        {/* Enhanced Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">
                                            <SortableHeader column="taskId" label="Task ID" />
                                        </TableHead>
                                        <TableHead>
                                            <SortableHeader column="title" label="Title" />
                                        </TableHead>
                                        <TableHead className="w-[120px]">
                                            <SortableHeader column="status" label="Status" />
                                        </TableHead>
                                        <TableHead className="w-[100px]">
                                            <SortableHeader column="priority" label="Priority" />
                                        </TableHead>
                                        <TableHead className="w-[100px]">Assignee</TableHead>
                                        <TableHead className="w-[120px]">
                                            <SortableHeader column="category" label="Category" />
                                        </TableHead>
                                        <TableHead className="w-[120px]">Created</TableHead>
                                        <TableHead className="w-[120px]">Due Date</TableHead>
                                        <TableHead className="w-[100px]">Time Est.</TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedTasks
                                        .map((task) => (
                                            <TableRow
                                                key={task.id}
                                                className={cn(
                                                    "cursor-pointer hover:bg-accent/50",
                                                    task.status === TaskStatus.DONE && 'bg-accent/30'
                                                )}
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setIsTaskDetailOpen(true);
                                                }}
                                            >
                                                <TableCell className="font-medium">
                                                    {task.taskId}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{task.title}</span>
                                                        {task.description && (
                                                            <span className="text-sm text-muted-foreground truncate">
                                                                {task.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={task.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <PriorityBadge priority={task.priority} />
                                                </TableCell>
                                                <TableCell>
                                                    {task.assignee ? (
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={task.assignee.avatar_url} />
                                                                <AvatarFallback>
                                                                    {task.assignee.full_name?.[0] || task.assignee.email[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm truncate">
                                                                {task.assignee.full_name || task.assignee.email}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{task.category || 'Uncategorized'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDate(task.created_at) || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {task.due_date && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar className="h-4 w-4" />
                                                            {formatDate(task.due_date)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {task.time_estimates && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Clock className="h-4 w-4" />
                                                            {task.time_estimates.original_estimate}h
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <TaskContextMenu
                                                        task={task}
                                                        onStatusChange={handleStatusChange}
                                                        onDelete={deleteTask}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Filters Dialog */}
                    <Dialog open={showFilters} onOpenChange={setShowFilters}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Filter Tasks</DialogTitle>
                                <DialogDescription>
                                    Set multiple filters to narrow down your task list.
                                </DialogDescription>
                            </DialogHeader>
                            <FilterDialogContent filters={filters} setFilters={setFilters} onClose={() => setShowFilters(false)} />
                        </DialogContent>
                    </Dialog>

                    {/* Task Detail */}
                    <TaskDetail
                        isOpen={isTaskDetailOpen}
                        onClose={() => {
                            setIsTaskDetailOpen(false);
                            setSelectedTask(undefined);
                        }}
                        teamId={selectedTeam || 0}
                        task={selectedTask}
                        onTaskUpdate={handleTaskUpdate}
                    />
                </TabsContent>
            </Tabs>
        </>
    )
}

