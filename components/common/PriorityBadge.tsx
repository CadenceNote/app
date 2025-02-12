import { TaskPriority } from "@/lib/types/task"
import { cn } from "@/lib/utils"

interface PriorityBadgeProps {
    priority: TaskPriority;
    className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
    if (priority === TaskPriority.URGENT) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <div className="h-1.5 w-12 rounded-full bg-red-500" />
                {/* <span className="text-xs font-medium">{priority}</span> */}
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "h-1.5 w-3 rounded-full",
                        i < (
                            priority === TaskPriority.HIGH ? 3 :
                                priority === TaskPriority.MEDIUM ? 2 :
                                    priority === TaskPriority.LOW ? 1 : 0
                        )
                            ? priority === TaskPriority.HIGH
                                ? "bg-orange-500"
                                : priority === TaskPriority.MEDIUM
                                    ? "bg-blue-400"
                                    : "bg-green-500"
                            : "bg-muted"
                    )}
                />
            ))}
            {/* <span className="text-xs font-medium">{priority}</span> */}
        </div>
    );
} 