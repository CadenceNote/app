import { supabase } from '@/lib/supabase';
import { Label } from '@/lib/types/task';

export const labelApi = {
    // List all labels for a team
    listLabels: async (teamId: number): Promise<Label[]> => {
        const { data, error } = await supabase
            .from('labels')
            .select('*')
            .eq('team_id', teamId)
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Create a new label
    createLabel: async (teamId: number, data: { name: string; color: string }): Promise<Label> => {
        const { data: label, error } = await supabase
            .from('labels')
            .insert({
                ...data,
                team_id: teamId,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return label;
    },

    // Update a label
    updateLabel: async (teamId: number, labelId: number, data: { name?: string; color?: string }): Promise<Label> => {
        const { data: label, error } = await supabase
            .from('labels')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', labelId)
            .eq('team_id', teamId)
            .select()
            .single();

        if (error) throw error;
        return label;
    },

    // Delete a label
    deleteLabel: async (teamId: number, labelId: number): Promise<void> => {
        const { error } = await supabase
            .from('labels')
            .delete()
            .eq('id', labelId)
            .eq('team_id', teamId);

        if (error) throw error;
    },

    // Search labels
    searchLabels: async (teamId: number, query: string): Promise<Label[]> => {
        const { data, error } = await supabase
            .from('labels')
            .select('*')
            .eq('team_id', teamId)
            .ilike('name', `%${query}%`)
            .order('name', { ascending: true })
            .limit(10);

        if (error) throw error;
        return data || [];
    }
}; 