import { cn } from "@/lib/utils"
import { TaskStatus } from "@/lib/types/task"

interface StatusBadgeProps {
    status: TaskStatus;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
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
            statusStyles[status],
            className
        )}>
            {displayStatus}
        </span>
    );
} 