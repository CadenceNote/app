import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useDroppable } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { Task, Meeting } from "@/types/dashboard"


import { CSS } from "@dnd-kit/utilities"
import { Trash2 } from "lucide-react"
export function SortableItem({
    item,
    onDelete,

    type,
}: {
    item: Task | Meeting;
    onDelete: (id: string) => void;
    type: "task" | "meeting";
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: item.id,
        data: {
            type,
            item
        }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        position: 'relative',
        zIndex: isDragging ? 1000 : 1
    }

    if (type === "task") {
        const task = item as Task
        return (
            <li
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={cn(
                    "flex items-center justify-between p-2 rounded-md",
                    isDragging ? "bg-accent/50" : "hover:bg-accent"
                )}
            >
                <div className="flex items-center flex-1 min-w-0">
                    <div className="ml-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                    task.tag === "Feature" && "bg-purple-50 text-purple-700 ring-purple-600/20",
                                    task.tag === "Bug" && "bg-red-50 text-red-700 ring-red-600/20",
                                    task.tag === "Documentation" && "bg-blue-50 text-blue-700 ring-blue-600/20"
                                )}
                            >
                                {task.tag}
                            </span>
                            <span className="font-medium truncate">{task.title}</span>
                            <span
                                className={cn(
                                    "text-xs px-2 py-1 rounded-full",
                                    task.status === "Done" && "bg-green-100 text-green-800",
                                    task.status === "In Progress" && "bg-blue-100 text-blue-800",
                                    task.status === "To Do" && "bg-yellow-100 text-yellow-800"
                                )}
                            >
                                {task.status}
                            </span>
                            <span
                                className={cn(
                                    "text-xs px-2 py-1 rounded-full",
                                    task.priority === "High" && "bg-red-100 text-red-800",
                                    task.priority === "Medium" && "bg-orange-100 text-orange-800",
                                    task.priority === "Low" && "bg-green-100 text-green-800"
                                )}
                            >
                                {task.priority}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </li>
        )
    } else {
        const meeting = item as Meeting
        return (
            <li
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={cn(
                    "flex items-center justify-between p-2 rounded-md",
                    isDragging ? "bg-accent/50" : "hover:bg-accent"
                )}
            >
                <div className="flex items-center flex-1 min-w-0">
                    <div className="ml-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{meeting.title}</span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(meeting.date + 'T' + meeting.time).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{new Date(meeting.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="truncate">{meeting.attendees.join(', ')}</span>
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(meeting.id);
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </li>
        )
    }
}

export function DroppableContainer({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id
    });

    return (
        <div className="h-full w-full">
            <Card className={cn(
                "h-full transition-all duration-150",
                isOver && "ring-2 ring-primary"
            )}>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        ref={setNodeRef}
                        className={cn(
                            "min-h-[200px] rounded-md p-2 transition-colors duration-150",
                            isOver && "bg-accent/10"
                        )}
                    >
                        {children}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}




