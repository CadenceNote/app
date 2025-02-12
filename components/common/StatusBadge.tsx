import { cn } from "@/lib/utils"
import { TaskStatus } from "@/lib/types/task"

interface StatusBadgeProps {
    status: TaskStatus;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const statusStyles = {
        [TaskStatus.TODO]: "",
        [TaskStatus.IN_PROGRESS]: "",
        [TaskStatus.IN_REVIEW]: "",
        [TaskStatus.DONE]: "",
        [TaskStatus.BACKLOG]: "",
        [TaskStatus.BLOCKED]: "",
        [TaskStatus.CANCELED]: "",
    };

    // Convert to display format (e.g., "IN_PROGRESS" -> "In Progress")
    const displayStatus = status.split('_')
        .map(word => word.charAt(0) + word.slice(1))
        .join(' ');

    return (
        <span className={cn(
            "inline-flex items-center justify-center  px-2 py-0.5 text-xs font-medium bg-gray-200 font-medium text-gray-800 ring-0 ",
            statusStyles[status],
            className
        )}>
            {displayStatus}
        </span>
    );
} 