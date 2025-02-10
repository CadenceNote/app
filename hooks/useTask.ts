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
            console.log('[useTask] Starting data fetch', { teamId });
            if (!teamId) {
                console.log('[useTask] Fetching tasks for all teams', teams);
                const allTasks = await Promise.all(
                    teams.map(team => taskApi.listTasks(team.id))
                );
                const flattened = allTasks.flat();
                console.log('[useTask] Fetched tasks for all teams', { count: flattened.length });
                return flattened;
            }
            console.log('[useTask] Fetching tasks for single team', { teamId });
            const tasks = await taskApi.listTasks(teamId);
            console.log('[useTask] Fetched tasks for single team', { count: tasks.length });
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
            operation: () => taskApi.updateTask(teamId!, parseInt(taskId), {
                ...data,
                assignee_ids: data.assignees?.map(a => a.id.toString()) || undefined,
            }),
            optimisticUpdate: (current) =>
                current.map(t =>
                    t.id === taskId ? { ...t, ...data } : t
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

        // Mutation helpers
        mutateTasks,
        mutateTask,
    };
} 