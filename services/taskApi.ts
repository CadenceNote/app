import { Task, TaskStatus, TaskPriority, TaskType, TimeUnit, Comment } from '@/lib/types/task';

// Initialize Supabase client
import { supabase } from '@/lib/supabase';

export interface CreateTaskInput {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType;
    start_date?: string;
    due_date?: string;
    assignee_id?: string;
    parent_id?: number;
    order_index?: number;
    category?: string;
    labels?: number[];
    task_metadata?: any;
    team?: {
        id: number;
        name: string;
    };
}

export interface TaskFilters {
    status?: TaskStatus[];
    assignee_id?: string;
    search?: string;
    parent_id?: number;
    skip?: number;
    limit?: number;
}

export interface PersonalTaskPreference {
    importance: boolean;
    urgency: boolean;
    quadrant: Task['quadrant'];
}

export const taskApi = {
    // List tasks with filters
    listTasks: async (teamId: number, filters?: TaskFilters): Promise<Task[]> => {
        let query = supabase
            .from('tasks')
            .select(`
                *,
                assignee:assignee_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                created_by:created_by_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                parent:parent_id(*),
                watchers:task_watchers!task_id(
                    user:user_id(
                        supabase_uid,
                        email,
                        full_name
                    )
                ),
                comments:task_comments!task_id(
                    id,
                    content,
                    created_at,
                    updated_at,
                    parent_id,
                    user:user_id(
                        supabase_uid,
                        email,
                        full_name
                    )
                )
            `)
            .eq('team_id', teamId)
            .order('order_index', { ascending: true });

        // Apply filters
        if (filters?.status?.length) {
            query = query.in('status', filters.status);
        }
        if (filters?.assignee_id) {
            query = query.eq('assignee_id', filters.assignee_id);
        }
        if (filters?.search) {
            query = query.ilike('title', `%${filters.search}%`);
        }
        if (filters?.parent_id) {
            query = query.eq('parent_id', filters.parent_id);
        }
        if (filters?.skip && filters?.limit) {
            query = query.range(filters.skip, filters.skip + filters.limit - 1);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Transform the response to use supabase_uid as id
        return data.map(task => ({
            ...task,
            assignee: task.assignee ? {
                id: task.assignee.supabase_uid,
                email: task.assignee.email,
                full_name: task.assignee.full_name
            } : null,
            created_by: {
                id: task.created_by.supabase_uid,
                email: task.created_by.email,
                full_name: task.created_by.full_name
            },
            watchers: task.watchers.map(w => ({
                id: w.user.supabase_uid,
                email: w.user.email,
                full_name: w.user.full_name
            })),
            comments: task.comments.map(c => ({
                ...c,
                user: {
                    id: c.user.supabase_uid,
                    email: c.user.email,
                    full_name: c.user.full_name
                }
            }))
        }));
    },

    // Get a single task
    getTask: async (teamId: number, taskId: number): Promise<Task> => {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                assignee:assignee_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                created_by:created_by_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                parent:parent_id(*),
                watchers:task_watchers!task_id(
                    user:user_id(
                        supabase_uid,
                        email,
                        full_name
                    )
                ),
                comments:task_comments!task_id(
                    id,
                    content,
                    created_at,
                    updated_at,
                    parent_id,
                    user:user_id(
                        supabase_uid,
                        email,
                        full_name
                    )
                )
            `)
            .eq('team_id', teamId)
            .eq('id', taskId)
            .single();

        if (error) throw error;

        // Transform the response to use supabase_uid as id
        return {
            ...data,
            assignee: data.assignee ? {
                id: data.assignee.supabase_uid,
                email: data.assignee.email,
                full_name: data.assignee.full_name
            } : null,
            created_by: {
                id: data.created_by.supabase_uid,
                email: data.created_by.email,
                full_name: data.created_by.full_name
            },
            watchers: data.watchers.map(w => ({
                id: w.user.supabase_uid,
                email: w.user.email,
                full_name: w.user.full_name
            })),
            comments: data.comments.map(c => ({
                ...c,
                user: {
                    id: c.user.supabase_uid,
                    email: c.user.email,
                    full_name: c.user.full_name
                }
            }))
        };
    },

    // Create a new task
    createTask: async (teamId: number, data: CreateTaskInput): Promise<Task> => {
        const { data: maxRefNumber } = await supabase
            .from('tasks')
            .select('team_ref_number')
            .eq('team_id', teamId)
            .order('team_ref_number', { ascending: false })
            .limit(1)
            .single();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const taskData = {
            ...data,
            team_id: teamId,
            team_ref_number: (maxRefNumber?.team_ref_number || 0) + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by_id: user.id,
            status: data.status || TaskStatus.TODO,
            type: data.type || TaskType.TASK
        };

        // First create the task
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert([taskData])
            .select(`
                *,
                assignee:assignee_id(
                    supabase_uid,
                    email,
                    full_name
                ),
                created_by:created_by_id(
                    supabase_uid,
                    email,
                    full_name
                )
            `)
            .single();

        if (taskError) throw taskError;

        // Then create the label associations if any
        if (data.labels?.length) {
            const labelAssociations = data.labels.map(labelId => ({
                task_id: task.id,
                label_id: labelId
            }));

            const { error: labelError } = await supabase
                .from('task_labels')
                .insert(labelAssociations);

            if (labelError) throw labelError;
        }

        // Transform the response to use supabase_uid as id
        return {
            ...task,
            assignee: task.assignee ? {
                id: task.assignee.supabase_uid,
                email: task.assignee.email,
                full_name: task.assignee.full_name
            } : null,
            created_by: {
                id: task.created_by.supabase_uid,
                email: task.created_by.email,
                full_name: task.created_by.full_name
            }
        };
    },

    // Update a task
    updateTask: async (teamId: number, taskId: number, data: Partial<CreateTaskInput>): Promise<Task> => {
        // Create a copy of data without labels to update the task
        const { labels: _labels, ...taskUpdateData } = data;

        const updateData = {
            ...taskUpdateData,
            updated_at: new Date().toISOString()
        };

        // Get current task state for history
        const { data: oldTask } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        // Update task
        const { error: taskError } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', taskId)
            .eq('team_id', teamId);


        if (taskError) throw taskError;

        // Create history records
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const changes = [];
        for (const [key, newValue] of Object.entries(updateData)) {
            if (oldTask && oldTask[key] !== newValue) {
                changes.push({
                    task_id: taskId,
                    user_id: user.id,
                    field_name: key,
                    old_value: oldTask[key]?.toString(),
                    new_value: newValue?.toString(),
                    change_type: 'UPDATE',
                    created_at: new Date().toISOString()
                });
            }
        }

        if (changes.length > 0) {
            const { error: historyError } = await supabase
                .from('task_history')
                .insert(changes);

            if (historyError) throw historyError;
        }
        const { data: updatedTask } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();
        // Return updated task
        return updatedTask as Task;
    },


    // Delete a task
    deleteTask: async (teamId: number, taskId: number): Promise<void> => {
        // First, delete related task comments
        const { error: commentsError } = await supabase
            .from('task_comments')
            .delete()
            .eq('task_id', taskId);

        if (commentsError) throw commentsError;

        // Then, delete related task history records
        const { error: historyError } = await supabase
            .from('task_history')
            .delete()
            .eq('task_id', taskId);

        if (historyError) throw historyError;

        // Finally delete the task
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)
            .eq('team_id', teamId);

        if (error) throw error;
    },

    // Add a comment to a task
    addComment: async (teamId: number, taskId: number, content: string, parentId?: number): Promise<Comment> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: comment, error } = await supabase
            .from('task_comments')
            .insert({
                task_id: taskId,
                user_id: user.id,
                content,
                parent_id: parentId,
                created_at: new Date().toISOString()
            })
            .select(`
                *,
                user:user_id(
                    supabase_uid,
                    email,
                    full_name
                )
            `)
            .single();

        if (error) throw error;

        return {
            ...comment,
            user: {
                id: comment.user.supabase_uid,
                email: comment.user.email,
                full_name: comment.user.full_name
            }
        };
    },

    // Update a comment
    updateComment: async (teamId: number, taskId: number, commentId: number, content: string): Promise<Comment> => {
        const { data: comment, error } = await supabase
            .from('task_comments')
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq('id', commentId)
            .eq('task_id', taskId)
            .select(`
                *,
                user:user_id(
                    supabase_uid,
                    email,
                    full_name
                )
            `)
            .single();

        if (error) throw error;

        return {
            ...comment,
            user: {
                id: comment.user.supabase_uid,
                email: comment.user.email,
                full_name: comment.user.full_name
            }
        };
    },

    // Delete a comment
    deleteComment: async (teamId: number, taskId: number, commentId: number): Promise<void> => {
        const { error } = await supabase
            .from('task_comments')
            .delete()
            .eq('id', commentId)
            .eq('task_id', taskId);

        if (error) throw error;
    },

    // Get personal preferences for a task
    getPersonalPreferences: async (taskId: number): Promise<PersonalTaskPreference> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('personal_task_preferences')
            .select('*')
            .eq('task_id', taskId)
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return data || {
            importance: false,
            urgency: false,
            quadrant: 'unsorted'
        };
    },

    // Update personal preferences for a task
    updatePersonalPreferences: async (taskId: number, preferences: PersonalTaskPreference): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('personal_task_preferences')
            .upsert({
                task_id: taskId,
                user_id: user.id,
                importance: preferences.importance,
                urgency: preferences.urgency,
                quadrant: preferences.quadrant,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'task_id,user_id',  // Specify the unique constraint
                ignoreDuplicates: false  // We want to update existing records
            });

        if (error) throw error;
    }
}; 