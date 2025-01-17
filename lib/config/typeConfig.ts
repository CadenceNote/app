export const TASK_TYPE = {
    TASK: 'TASK',
    BUG: 'BUG',
    FEATURE: 'FEATURE',
    EPIC: 'EPIC'
} as const;

export const TASK_TYPE_DISPLAY = {
    [TASK_TYPE.TASK]: 'Task',
    [TASK_TYPE.BUG]: 'Bug',
    [TASK_TYPE.FEATURE]: 'Feature',
    [TASK_TYPE.EPIC]: 'Epic'
} as const; 