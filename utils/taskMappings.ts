import { TaskStatus, TaskPriority } from '@/lib/types/task';

export const STATUS_MAP = {
    'To Do': TaskStatus.TODO,
    'In Progress': TaskStatus.IN_PROGRESS,
    'Done': TaskStatus.DONE,
    'Backlog': TaskStatus.BACKLOG,
    'Canceled': TaskStatus.CANCELED
} as const;

export const PRIORITY_MAP = {
    'High': TaskPriority.HIGH,
    'Medium': TaskPriority.MEDIUM,
    'Low': TaskPriority.LOW
} as const;

export function mapStatusToEnum(status: 'To Do' | 'In Progress' | 'Done' | 'Backlog' | 'Canceled'): TaskStatus {
    return STATUS_MAP[status];
}

export function mapPriorityToEnum(priority: 'High' | 'Medium' | 'Low'): TaskPriority {
    return PRIORITY_MAP[priority];
}

export function mapTaskStatus(status: string): 'To Do' | 'In Progress' | 'Done' | 'Backlog' | 'Canceled' {
    const reverseStatusMap = {
        'TODO': 'To Do',
        'IN_PROGRESS': 'In Progress',
        'DONE': 'Done',
        'BACKLOG': 'Backlog',
        'CANCELED': 'Canceled'
    } as const;
    return reverseStatusMap[status as keyof typeof reverseStatusMap] || 'To Do';
}

export function mapTaskPriority(priority: string): 'High' | 'Medium' | 'Low' {
    const reversePriorityMap = {
        'HIGH': 'High',
        'MEDIUM': 'Medium',
        'LOW': 'Low'
    } as const;
    return reversePriorityMap[priority as keyof typeof reversePriorityMap] || 'Medium';
} 