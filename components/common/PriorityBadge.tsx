import { cn } from "@/lib/utils"
import { TaskPriority } from "@/lib/types/task"

interface PriorityBadgeProps {
    priority: TaskPriority;
    className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
    const priorityStyles = {
        [TaskPriority.URGENT]: "bg-purple-50 text-purple-700 ring-purple-600/20",
        [TaskPriority.HIGH]: "bg-red-50 text-red-700 ring-red-600/20",
        [TaskPriority.MEDIUM]: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
        [TaskPriority.LOW]: "bg-green-50 text-green-700 ring-green-600/20",
    };

    // Convert to display format (e.g., "HIGH" -> "High")
    const displayPriority = priority.charAt(0) + priority.slice(1).toLowerCase();

    return (
        <span className={cn(
            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
            priorityStyles[priority],
            className
        )}>
            {displayPriority}
        </span>
    );
} 