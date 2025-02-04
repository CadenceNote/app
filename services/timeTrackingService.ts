import { supabase } from '@/lib/supabase';
import { TimeEntry, TimeEstimate } from '@/lib/types/task';

export const timeTrackingService = {
    getTimeEntries: async (teamId: number, taskId: number): Promise<TimeEntry[]> => {
        const { data, error } = await supabase
            .from('time_entries')
            .select('*')
            .eq('task_id', taskId)
            .eq('team_id', teamId)
            .order('started_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    addTimeEntry: async (teamId: number, taskId: number, data: { duration: number, description?: string, started_at?: string, ended_at?: string }): Promise<TimeEntry> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: timeEntry, error } = await supabase
            .from('time_entries')
            .insert({
                ...data,
                task_id: taskId,
                team_id: teamId,
                user_id: user.id,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return timeEntry;
    },

    updateTimeEstimate: async (teamId: number, taskId: number, data: { original_estimate: number, remaining_estimate: number }): Promise<TimeEstimate> => {
        const { data: timeEstimate, error } = await supabase
            .from('time_estimates')
            .upsert({
                ...data,
                task_id: taskId,
                team_id: teamId,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return timeEstimate;
    },

    getTimeEstimates: async (teamId: number, taskId: number): Promise<TimeEstimate[]> => {
        const { data, error } = await supabase
            .from('time_estimates')
            .select('*')
            .eq('task_id', taskId)
            .eq('team_id', teamId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
}; 