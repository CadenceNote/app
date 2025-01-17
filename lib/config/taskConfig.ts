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

// Type-safe helper functions
export const getStatusDisplay = (status: keyof typeof TASK_STATUS): string => {
    return TASK_STATUS_DISPLAY[TASK_STATUS[status]] || status;
};

export const getStatusKey = (display: string): string => {
    const entry = Object.entries(TASK_STATUS_DISPLAY).find(([_, value]) => value === display);
    return entry ? entry[0] : display.toUpperCase().replace(' ', '_');
}; 