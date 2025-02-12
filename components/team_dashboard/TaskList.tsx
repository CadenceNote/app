import { Task } from "@/lib/types/task";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskListProps {
    tasks: Task[];
    onTaskSelect: (task: Task) => void;
}

export function TaskList({ tasks, onTaskSelect }: TaskListProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[100px]">Priority</TableHead>
                        <TableHead className="w-[150px]">Assignees</TableHead>
                        <TableHead className="w-[120px]">Due Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((task) => (
                        <TableRow
                            key={`${task.id}-${task.team_id}`}
                            className="cursor-pointer hover:bg-accent/50"
                            onClick={() => onTaskSelect(task)}
                        >
                            <TableCell>{task.team_ref_number ? `T-${task.team_ref_number}` : task.id}</TableCell>
                            <TableCell>{task.title}</TableCell>
                            <TableCell><StatusBadge status={task.status} /></TableCell>
                            <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                            <TableCell>
                                <div className="flex -space-x-2">
                                    {task.assignees.map((assignee, index) => (
                                        <TooltipProvider key={`${assignee.id}-${index}`}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className={cn(
                                                        "ring-2 ring-background rounded-full",
                                                        index > 0 && "-ml-2"
                                                    )}>
                                                        <UserAvatar
                                                            name={assignee.full_name || assignee.email || 'Unknown User'}
                                                            userId={assignee.id}
                                                            className="h-6 w-6"
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{assignee.full_name || assignee.email || 'Unknown User'}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 