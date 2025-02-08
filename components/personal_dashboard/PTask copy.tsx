import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { taskApi, TaskQuadrant as ApiTaskQuadrant } from '@/services/taskApi';
import { Task as ApiTask } from '@/lib/types/task';

enum TaskQuadrant {
    IMPORTANT_URGENT = 'important-urgent',
    IMPORTANT_NOT_URGENT = 'important-not-urgent',
    NOT_IMPORTANT_URGENT = 'not-important-urgent',
    NOT_IMPORTANT_NOT_URGENT = 'not-important-not-urgent',
    UNSORTED = 'unsorted',
}

enum TaskStatus {
    TODO = 'To Do',
    IN_PROGRESS = 'In Progress',
    DONE = 'Done',
    BACKLOG = 'Backlog',
    CANCELED = 'Canceled',
}

enum TaskPriority {
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
}

type Task = {
    id: string;
    taskId: string;
    title: string;
    status: TaskStatus;
    dueDate: string;
    priority: TaskPriority;
    quadrant: TaskQuadrant;
    order: number;
};

const SortableTask = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { type: 'task', task },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                'bg-background p-3 rounded-md border mb-2 cursor-grab',
                isDragging && 'shadow-lg ring-2 ring-primary cursor-grabbing'
            )}
        >
            <div className="flex justify-between items-center">
                <span className="font-medium">{task.title}</span>
                <span className="text-sm text-muted-foreground">#{task.taskId}</span>
            </div>
            <div className="mt-2 flex gap-2">
                <span className="text-xs px-2 py-1 bg-accent rounded-full">{task.status}</span>
                <span className="text-xs px-2 py-1 bg-accent rounded-full">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};

const DroppableQuadrant = ({ id, title, tasks }: { id: string; title: string; tasks: Task[] }) => {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: {
            accepts: ['task'],
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "bg-card rounded-lg border p-4 h-full",
                isOver && "ring-2 ring-primary"
            )}
        >
            <h3 className="text-lg font-semibold mb-4 capitalize">{title.replace(/-/g, ' ')}</h3>
            <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                    {tasks.map(task => (
                        <SortableTask key={task.id} task={task} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
};

interface DragStartEvent {
    active: { id: string };
}

interface DragEndEvent {
    active: { id: string };
    over: { id: string } | null;
}

export default function PTask() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
    const [isLoading, setIsLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            setIsLoading(true);
            const apiTasks = await taskApi.listTasks(1); // Replace 1 with actual teamId

            const transformedTasks = apiTasks.map(apiTask => ({
                id: apiTask.id.toString(),
                taskId: `TASK-${apiTask.team_ref_number}`,
                title: apiTask.title,
                status: apiTask.status as TaskStatus,
                dueDate: apiTask.due_date || new Date().toISOString(),
                priority: apiTask.priority as TaskPriority,
                quadrant: (apiTask.task_metadata?.quadrant as TaskQuadrant) || TaskQuadrant.UNSORTED,
                order: apiTask.task_metadata?.order_in_quadrant || 0,
            }));

            setTasks(transformedTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find(t => t.id === event.active.id);
        if (task) setActiveTask(task);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeTask = tasks.find(t => t.id === active.id);
        if (!activeTask) return;

        try {
            // Determine if we're dropping into a quadrant container or on another task
            const targetQuadrant = over.id.toString().startsWith('task-')
                ? tasks.find(t => t.id === over.id)?.quadrant
                : over.id as TaskQuadrant;

            if (!targetQuadrant) return;

            if (activeTask.quadrant === targetQuadrant) {
                // Handle reordering within same quadrant
                const oldIndex = tasks.findIndex(t => t.id === active.id);
                const newIndex = tasks.findIndex(t => t.id === over.id);
                const newTasks = arrayMove(tasks, oldIndex, newIndex);

                setTasks(newTasks);
                await taskApi.reorderTasksInQuadrant(
                    activeTask.quadrant as ApiTaskQuadrant,
                    newTasks
                        .filter(t => t.quadrant === activeTask.quadrant)
                        .map(t => parseInt(t.id))
                );
            } else {
                // Handle moving between quadrants
                const newOrder = tasks.filter(t => t.quadrant === targetQuadrant).length + 1;
                const newTasks = tasks.map(task =>
                    task.id === activeTask.id
                        ? {
                            ...task,
                            quadrant: targetQuadrant,
                            order: newOrder,
                            importance: targetQuadrant.includes('important') ? 'important' : 'normal',
                            urgency: targetQuadrant.includes('urgent') ? 'urgent' : 'not-urgent'
                        }
                        : task
                );

                setTasks(newTasks);
                await taskApi.updatePersonalPreferences(parseInt(activeTask.id), {
                    importance: targetQuadrant.includes('important'),
                    urgency: targetQuadrant.includes('urgent'),
                    quadrant: targetQuadrant as ApiTaskQuadrant,
                    order_in_quadrant: newOrder,
                });
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
        setActiveTask(null);
    };

    const addTask = async (formData: FormData) => {
        try {
            const newApiTask = await taskApi.createTask(1, { // Replace 1 with actual teamId
                title: formData.get('title') as string,
                status: formData.get('status') as TaskStatus || TaskStatus.TODO,
                priority: formData.get('priority') as TaskPriority || TaskPriority.MEDIUM,
                due_date: formData.get('dueDate') as string || new Date().toISOString(),
            });

            const newTask: Task = {
                id: newApiTask.id.toString(),
                taskId: `TASK-${newApiTask.team_ref_number}`,
                title: newApiTask.title,
                status: newApiTask.status as TaskStatus,
                dueDate: newApiTask.due_date || new Date().toISOString(),
                priority: newApiTask.priority as TaskPriority,
                quadrant: TaskQuadrant.UNSORTED,
                order: tasks.filter(t => t.quadrant === TaskQuadrant.UNSORTED).length + 1,
            };

            setTasks([...tasks, newTask]);
            setIsSheetOpen(false);
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Task Manager</h1>
                <div className="flex gap-2">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Task
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Create New Task</SheetTitle>
                                <SheetDescription>Fill in the details for your new task.</SheetDescription>
                            </SheetHeader>
                            <form action={addTask} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" name="title" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select name="status">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(TaskStatus).map(status => (
                                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input id="dueDate" name="dueDate" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select name="priority">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(TaskPriority).map(priority => (
                                                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit">Create Task</Button>
                            </form>
                        </SheetContent>
                    </Sheet>

                    <Tabs value={viewMode} onValueChange={(v: 'matrix' | 'list') => setViewMode(v)}>
                        <TabsList>
                            <TabsTrigger value="matrix">Matrix</TabsTrigger>
                            <TabsTrigger value="list">List</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {viewMode === 'matrix' ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {Object.values(TaskQuadrant).map(quadrant => (
                            <DroppableQuadrant
                                key={quadrant}
                                id={quadrant}
                                title={quadrant}
                                tasks={tasks.filter(t => t.quadrant === quadrant)}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeTask && <SortableTask task={activeTask} />}
                    </DragOverlay>
                </DndContext>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task ID</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map(task => (
                            <TableRow key={task.id}>
                                <TableCell>#{task.taskId}</TableCell>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>{task.status}</TableCell>
                                <TableCell>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                                <TableCell>{task.priority}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
};