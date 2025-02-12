import useSWR, { mutate } from 'swr';
import { taskApi } from '@/services/taskApi';
import { Task, TaskStatus, TaskPriority, CreateTaskInput } from '@/lib/types/task';
import { useTeams } from './useTeams';

// Cache keys for tasks
export const taskKeys = {
    all: () => ['tasks'],
    allTeams: () => [...taskKeys.all(), 'all_teams'],
    teamTasks: (teamId?: number) => teamId ? [...taskKeys.all(), 'team', teamId] : taskKeys.allTeams(),
    taskDetail: (teamId?: number, taskId?: string) => [...taskKeys.teamTasks(teamId), 'detail', taskId],
};

export function useTask(teamId?: number, taskId?: string) {
    const { teams } = useTeams();

    // Main tasks query for the team
    const {
        data: tasks = [],
        error: tasksError,
        isLoading: isLoadingTasks,
        mutate: mutateTasks
    } = useSWR<Task[], Error>(
        teams?.length ? taskKeys.teamTasks(teamId) : null,
        async () => {
            if (!teamId) {
                const allTasks = await Promise.all(
                    teams.map(team => taskApi.listTasks(team.id))
                );
                const flattened = allTasks.flat();
                return flattened;
            }
            const tasks = await taskApi.listTasks(teamId);
            return tasks;
        },
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 30000,
            shouldRetryOnError: false,
            revalidateIfStale: false,
            revalidateOnMount: true,
            isPaused: () => !teams?.length
        }
    );

    // Individual task query if taskId is provided
    const {
        data: task,
        error: taskError,
        isLoading: isLoadingTask,
        mutate: mutateTask
    } = useSWR<Task | undefined, Error>(
        teamId && taskId ? taskKeys.taskDetail(teamId, taskId) : null,
        async () => {
            if (!teamId || !taskId) return undefined;
            return taskApi.getTask(teamId, parseInt(taskId));
        },
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 30000,
            shouldRetryOnError: false,
            revalidateIfStale: false,
            revalidateOnMount: true,
            isPaused: () => !teams?.length
        }
    );

    // Modify the mutation handler to be more selective about revalidation
    const handleMutation = async <T>({
        operation,
        optimisticUpdate,
    }: {
        operation: () => Promise<T>;
        optimisticUpdate?: (current: Task[]) => Task[];
    }) => {
        if (!teamId) return;

        try {
            // Optimistic update if provided
            if (optimisticUpdate && tasks) {
                // Update the list view for current team
                await mutate(
                    taskKeys.teamTasks(teamId),
                    optimisticUpdate(tasks),
                    false
                );

                // Always update the all teams view as well
                await mutate(
                    taskKeys.allTeams(),
                    (currentTasks: Task[] | undefined) => {
                        if (!currentTasks) return currentTasks;
                        return optimisticUpdate(currentTasks);
                    },
                    false
                );
            }

            // Perform operation
            const result = await operation();

            // Revalidate all relevant caches
            await Promise.all([
                mutate(taskKeys.teamTasks(teamId)),
                mutate(taskKeys.allTeams()),
                taskId ? mutate(taskKeys.taskDetail(teamId, taskId)) : null
            ].filter(Boolean));

            return result;
        } catch (error) {
            // Rollback on error by revalidating all caches
            await Promise.all([
                mutate(taskKeys.teamTasks(teamId)),
                mutate(taskKeys.allTeams()),
                taskId ? mutate(taskKeys.taskDetail(teamId, taskId)) : null
            ].filter(Boolean));
            throw error;
        }
    };

    // Create task
    const createTask = async (data: CreateTaskInput) => {
        return handleMutation({
            operation: () => taskApi.createTask(teamId!, {
                ...data,
                assignee_ids: data.assignees?.map(a => a.id.toString()) || [],
            }),
            optimisticUpdate: (current) => [
                {
                    ...data,
                    id: Date.now().toString(),
                    taskId: `T-${Date.now()}`,
                    team_id: teamId!,
                    created_at: new Date().toISOString(),
                    assignees: data.assignees || [],
                    watchers: [],
                } as Task,
                ...current,
            ],
        });
    };

    // Update task
    const updateTask = async (taskId: string, data: Partial<CreateTaskInput>) => {
        return handleMutation({
            operation: () => {
                // Get current task data
                const currentTask = tasks?.find(t => t.id === taskId);
                if (!currentTask) {
                    throw new Error("Task not found");
                }

                // Compare current and new assignees to determine changes
                const currentAssigneeIds = new Set(currentTask.assignees.map(a => a.id));
                const newAssigneeIds = new Set(data.assignees?.map(a =>
                    typeof a === 'string' ? a : a.id
                ));

                // Only include assignee_ids if they've actually changed
                const assigneeIdsChanged =
                    currentAssigneeIds.size !== newAssigneeIds.size ||
                    ![...currentAssigneeIds].every(id => newAssigneeIds.has(id));

                return taskApi.updateTask(teamId!, parseInt(taskId), {
                    ...data,
                    assignee_ids: assigneeIdsChanged ?
                        [...newAssigneeIds].filter(id => id !== '') :
                        undefined
                });
            },
            optimisticUpdate: (current) =>
                current.map(t =>
                    t.id === taskId ? {
                        ...t,
                        ...data,
                        assignees: data.assignees?.map(a => {
                            if (typeof a === 'string') {
                                const existingAssignee = t.assignees.find(existing => existing.id === a);
                                return existingAssignee || { id: a, email: '', full_name: '' };
                            }
                            return a;
                        }) || t.assignees
                    } : t
                ),
        });
    };

    // Delete task
    const deleteTask = async (taskId: string) => {
        return handleMutation({
            operation: () => taskApi.deleteTask(teamId!, parseInt(taskId)),
            optimisticUpdate: (current) =>
                current.filter(t => t.id !== taskId),
        });
    };

    // Add comment mutation
    const addComment = async (content: string, parentId?: number) => {
        if (!teamId || !taskId) return null;
        return handleMutation({
            operation: async () => {
                const newComment = await taskApi.addComment(teamId, parseInt(taskId), content, parentId);
                return newComment;
            },
            optimisticUpdate: (current) => {
                if (!task) return current;
                return current.map(t => {
                    if (t.id === taskId) {
                        return {
                            ...t,
                            comments: [...(t.comments || []), {
                                id: Date.now(),
                                content,
                                parent_id: parentId,
                                created_at: new Date().toISOString(),
                                user: task.created_by!
                            }]
                        };
                    }
                    return t;
                });
            }
        });
    };

    // Delete comment mutation
    const deleteComment = async (commentId: number) => {
        if (!teamId || !taskId) return null;
        return handleMutation({
            operation: async () => {
                await taskApi.deleteComment(teamId, parseInt(taskId), commentId);
                return commentId;
            },
            optimisticUpdate: (current) => {
                return current.map(t => {
                    if (t.id === taskId) {
                        return {
                            ...t,
                            comments: t.comments?.filter(c => c.id !== commentId) || []
                        };
                    }
                    return t;
                });
            }
        });
    };

    // Toggle watch mutation
    const toggleWatch = async () => {
        if (!teamId || !taskId) return null;
        return handleMutation({
            operation: async () => {
                const updatedTask = await taskApi.toggleWatch(teamId, parseInt(taskId));
                return updatedTask;
            },
            optimisticUpdate: (current) => {
                return current.map(t => {
                    if (t.id === taskId) {
                        return {
                            ...t,
                            is_watching: !t.is_watching
                        };
                    }
                    return t;
                });
            }
        });
    };

    return {
        // Data
        tasks,
        task,

        // Loading states
        isLoadingTasks,
        isLoadingTask,

        // Errors
        tasksError,
        taskError,

        // Mutations
        createTask,
        updateTask,
        deleteTask,
        addComment,
        deleteComment,
        toggleWatch,

        // Mutation helpers
        mutateTasks,
        mutateTask,
    };
} 