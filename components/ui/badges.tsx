import { Badge } from './badge';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { TaskBadge, UserBadge, TaskStatus } from '@/lib/types/task';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface TaskBadgeProps {
    task: TaskBadge;
    onClick?: () => void;
}

interface UserBadgeProps {
    user: UserBadge;
    onClick?: () => void;
}

// Function to get task status display
const getTaskStatusDisplay = (status: TaskStatus): string => {
    switch (status) {
        case TaskStatus.TODO:
            return "Todo";
        case TaskStatus.IN_PROGRESS:
            return "In Progress";
        case TaskStatus.DONE:
            return "Done";
        case TaskStatus.BLOCKED:
            return "Blocked";
        default:
            return "Todo";
    }
};

// Function to get task status styles
const getTaskStatusStyles = (status: TaskStatus): string => {
    switch (status) {
        case TaskStatus.TODO:
            return "bg-yellow-100 text-yellow-700";
        case TaskStatus.IN_PROGRESS:
            return "bg-blue-100 text-blue-700";
        case TaskStatus.DONE:
            return "bg-green-100 text-green-700";
        case TaskStatus.BLOCKED:
            return "bg-red-100 text-red-700";
        default:
            return "bg-yellow-100 text-yellow-700";
    }
};

export function TaskBadgeComponent({ task, onClick }: TaskBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 cursor-pointer hover:bg-muted/80 transition-colors",
                "border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-50"
            )}
            onClick={onClick}
        >
            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                TASK-{task.team_ref_number.padStart(3, '0')}
            </span>
            <span className="font-medium truncate max-w-[200px]">{task.title}</span>
            <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                getTaskStatusStyles(task.status)
            )}>
                {getTaskStatusDisplay(task.status)}
            </span>
            {task.isNew && (
                <Sparkles className="h-3 w-3 text-blue-500" />
            )}
        </Badge>
    );
}

export function UserBadgeComponent({ user, onClick }: UserBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn(
                "inline-flex items-center gap-1.5 px-1.5 py-0.5 cursor-pointer hover:bg-muted/80 transition-colors",
                "border-purple-200 bg-purple-50/50 text-purple-700 hover:bg-purple-50"
            )}
            onClick={onClick}
        >
            <Avatar className="h-4 w-4">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-[10px]">
                    {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
            </Avatar>
            <span className="font-medium">{user.name}</span>
        </Badge>
    );
} 