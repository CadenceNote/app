export const TASK_STATUS = {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE',
    BLOCKED: 'BLOCKED'
} as const;

export const TASK_STATUS_DISPLAY = {
    [TASK_STATUS.TODO]: 'Todo',
    [TASK_STATUS.IN_PROGRESS]: 'In Progress',
    [TASK_STATUS.DONE]: 'Done',
    [TASK_STATUS.BLOCKED]: 'Blocked'
} as const;

export const getStatusDisplay = (status: keyof typeof TASK_STATUS) => {
    return TASK_STATUS_DISPLAY[status] || 'Unknown';
}; 