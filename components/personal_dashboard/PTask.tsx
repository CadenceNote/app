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

type Task = {
    id: string;
    taskId: string;
    title: string;
    category: string;
    status: 'To Do' | 'In Progress' | 'Done' | 'Backlog' | 'Canceled';
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    importance: 'important' | 'normal';
    urgency: 'urgent' | 'not-urgent';
    quadrant: 'important-urgent' | 'important-not-urgent' | 'not-important-urgent' | 'not-important-not-urgent' | 'unsorted';
    team_id: number;
};

type PTaskProps = {
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    updateTaskQuadrant?: (
        taskId: string,
        quadrant: Task['quadrant'],
        importance: Task['importance'],
        urgency: Task['urgency']
    ) => void;
    searchTerm: string;
};

export default function PTask({ tasks, setTasks, updateTaskQuadrant, searchTerm }: PTaskProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const [teams, setTeams] = useState<{ id: number, name: string }[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

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

    const handleDragStart = (event: any) => {
        const { active } = event;
        setActiveId(active.id);

        const task = tasks.find((t) => t.id === active.id);
        if (task) {
            setActiveTask(task);
        }

    };

    // In PTask component
    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id;
        const targetQuadrant = over.id as Task['quadrant'];
        const task = tasks.find((t) => t.id === taskId);

        if (!task || task.quadrant === targetQuadrant) return;

        // Determine updates
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
        }

        // Use dedicated update function
        if (updateTaskQuadrant) {
            updateTaskQuadrant(taskId, targetQuadrant, importance, urgency);
        }

    };


    const addTask = async (formData: FormData) => {
        if (!selectedTeam) return;

        const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            taskId: `TASK-${Math.floor(Math.random() * 10000)}`,
            title: formData.get("title") as string,
            category: formData.get("category") as string || 'Other',
            status: formData.get("status") as Task['status'],
            dueDate: formData.get("dueDate") as string,
            priority: formData.get("priority") as Task['priority'],
            importance: "normal",
            urgency: "not-urgent",
            quadrant: "unsorted",
            team_id: selectedTeam
        };

        setTasks([...tasks, newTask]);
    };
    const deleteTask = (id: string) => {
        setTasks(tasks.filter(task => task.id !== id));
    };
    const filteredTasks = tasks.filter(
        (task) =>
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.priority.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Tasks</h2>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Add Task
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
                                const formData = new FormData(e.currentTarget);
                                await addTask(formData);
                                e.currentTarget.reset();
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
                                <Select name="category" defaultValue="">
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
                                <Select name="status" defaultValue="To Do">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="To Do">To Do</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Done">Done</SelectItem>
                                        <SelectItem value="Backlog">Backlog</SelectItem>
                                        <SelectItem value="Canceled">Canceled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input id="dueDate" name="dueDate" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select name="priority" defaultValue="Medium">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit">Add Task</Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            <Tabs defaultValue="matrix" className="w-full">
                <TabsList>
                    <TabsTrigger value="matrix">Matrix View</TabsTrigger>
                    <TabsTrigger value="list">List View</TabsTrigger>
                </TabsList>

                <TabsContent value="matrix">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={pointerWithin}
                        onDragStart={(event) => handleDragStart(event)}
                        onDragEnd={(event) => handleDragEnd(event)}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            <div className="grid grid-cols-1 gap-8 h-full">
                                <DroppableContainer id="important-urgent" title="Important & Urgent">
                                    <SortableContext items={filteredTasks.filter(task => task.quadrant === 'important-urgent')} strategy={verticalListSortingStrategy}>
                                        <ul className="space-y-2">
                                            {filteredTasks
                                                .filter(task => task.quadrant === 'important-urgent')
                                                .map((task) => (
                                                    <SortableItem key={task.id} item={task} onDelete={deleteTask} type="task" />
                                                ))}
                                        </ul>
                                    </SortableContext>
                                </DroppableContainer>

                                <DroppableContainer id="important-not-urgent" title="Important & Not Urgent">
                                    <SortableContext items={filteredTasks.filter(task => task.quadrant === 'important-not-urgent')} strategy={verticalListSortingStrategy}>
                                        <ul className="space-y-2">
                                            {filteredTasks
                                                .filter(task => task.quadrant === 'important-not-urgent')
                                                .map((task) => (
                                                    <SortableItem key={task.id} item={task} onDelete={deleteTask} type="task" />
                                                ))}
                                        </ul>
                                    </SortableContext>
                                </DroppableContainer>
                            </div>

                            <div className="grid grid-cols-1 gap-8 h-full">
                                <DroppableContainer id="not-important-urgent" title="Not Important & Urgent">
                                    <SortableContext items={filteredTasks.filter(task => task.quadrant === 'not-important-urgent')} strategy={verticalListSortingStrategy}>
                                        <ul className="space-y-2">
                                            {filteredTasks
                                                .filter(task => task.quadrant === 'not-important-urgent')
                                                .map((task) => (
                                                    <SortableItem key={task.id} item={task} onDelete={deleteTask} type="task" />
                                                ))}
                                        </ul>
                                    </SortableContext>
                                </DroppableContainer>

                                <DroppableContainer id="not-important-not-urgent" title="Not Important & Not Urgent">
                                    <SortableContext items={filteredTasks.filter(task => task.quadrant === 'not-important-not-urgent')} strategy={verticalListSortingStrategy}>
                                        <ul className="space-y-2">
                                            {filteredTasks
                                                .filter(task => task.quadrant === 'not-important-not-urgent')
                                                .map((task) => (
                                                    <SortableItem key={task.id} item={task} onDelete={deleteTask} type="task" />
                                                ))}
                                        </ul>
                                    </SortableContext>
                                </DroppableContainer>
                            </div>
                        </div>

                        <div className="mt-4">
                            <DroppableContainer id="unsorted" title="Unsorted Tasks">
                                <SortableContext items={filteredTasks.filter(task => task.quadrant === 'unsorted')} strategy={verticalListSortingStrategy}>
                                    <ul className="space-y-2">
                                        {filteredTasks
                                            .filter(task => task.quadrant === 'unsorted')
                                            .map((task) => (
                                                <SortableItem key={task.id} item={task} onDelete={deleteTask} type="task" />
                                            ))}
                                    </ul>
                                </SortableContext>
                            </DroppableContainer>
                        </div>

                        <DragOverlay>
                            {activeTask ? <SortableItem item={activeTask} onDelete={deleteTask} type="task" /> : null}
                        </DragOverlay>
                    </DndContext>
                </TabsContent>

                <TabsContent value="list">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px] text-xs">Task</TableHead>
                                    <TableHead className="text-xs">Title</TableHead>
                                    <TableHead className="w-[100px] text-xs">Status</TableHead>
                                    <TableHead className="w-[100px] text-xs">Importance</TableHead>
                                    <TableHead className="w-[100px] text-xs">Urgency</TableHead>
                                    <TableHead className="w-[100px] text-xs">Due Date</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium text-sm text-muted-foreground">{task.taskId}</TableCell>
                                        <TableCell className="font-medium text-sm text-foreground/90">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                        "bg-gray-50 text-gray-700 ring-gray-600/20"
                                                    )}
                                                >
                                                    {task.category}
                                                </span>
                                                {task.title}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
                                                    task.status === "Done" && "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
                                                    task.status === "In Progress" && "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
                                                    task.status === "To Do" && "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20",
                                                    task.status === "Backlog" && "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20",
                                                    task.status === "Canceled" && "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                                                )}
                                            >
                                                {task.status}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <span
                                                className={cn(
                                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                    task.importance === "important" && "bg-red-50 text-red-700 ring-red-600/20",
                                                    task.importance === "normal" && "bg-gray-50 text-gray-700 ring-gray-600/20",
                                                )}
                                            >
                                                {task.importance}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                    task.urgency === "urgent" && "bg-red-50 text-red-700 ring-red-600/20",
                                                    task.urgency === "not-urgent" && "bg-gray-50 text-gray-700 ring-gray-600/20"
                                                )}
                                            >
                                                {task.urgency}
                                            </span>
                                        </TableCell>
                                        <TableCell>{task.dueDate}</TableCell>



                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => navigator.clipboard.writeText(task.taskId)}
                                                    >
                                                        Copy task ID
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem>View task details</DropdownMenuItem>
                                                    <DropdownMenuItem>View task history</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </>
    )
}

