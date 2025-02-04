import { supabase } from '@/lib/supabase';

export interface Category {
    id: number;
    name: string;
    team_id: number;
    created_at: string;
    updated_at?: string;
}

export const categoryApi = {
    // List all categories for a team
    listCategories: async (teamId: number): Promise<Category[]> => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('team_id', teamId)
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Create a new category
    createCategory: async (teamId: number, name: string): Promise<Category> => {
        const { data: category, error } = await supabase
            .from('categories')
            .insert({
                name,
                team_id: teamId,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return category;
    },

    // Update a category
    updateCategory: async (teamId: number, categoryId: number, name: string): Promise<Category> => {
        const { data: category, error } = await supabase
            .from('categories')
            .update({
                name,
                updated_at: new Date().toISOString()
            })
            .eq('id', categoryId)
            .eq('team_id', teamId)
            .select()
            .single();

        if (error) throw error;
        return category;
    },

    // Delete a category
    deleteCategory: async (teamId: number, categoryId: number): Promise<void> => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId)
            .eq('team_id', teamId);

        if (error) throw error;
    },

    // Search categories
    searchCategories: async (teamId: number, query: string): Promise<Category[]> => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('team_id', teamId)
            .ilike('name', `%${query}%`)
            .order('name', { ascending: true })
            .limit(10);

        if (error) throw error;
        return data || [];
    }
}; 