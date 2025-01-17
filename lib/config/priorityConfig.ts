export const TASK_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH'
} as const;

export const TASK_PRIORITY_DISPLAY = {
    [TASK_PRIORITY.LOW]: 'Low',
    [TASK_PRIORITY.MEDIUM]: 'Medium',
    [TASK_PRIORITY.HIGH]: 'High'
} as const; 