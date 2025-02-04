import { supabase } from '@/lib/supabase';

interface User {
    id: string;  // supabase_uid
    email: string;
    full_name: string | null;
    is_active?: boolean;
}

export const userApi = {
    // Get current user's information
    getCurrentUser: async (): Promise<User> => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('User not authenticated');

        const { data: user, error } = await supabase
            .from('users')
            .select('supabase_uid, email, full_name, is_active')
            .eq('supabase_uid', authUser.id)
            .single();

        if (error) throw error;
        if (!user) throw new Error('User not found');

        return {
            id: user.supabase_uid,
            email: user.email,
            full_name: user.full_name,
            is_active: user.is_active
        };
    },

    // Update user's information
    updateUser: async (data: { full_name: string }): Promise<User> => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('User not authenticated');

        const { data: user, error } = await supabase
            .from('users')
            .update({
                full_name: data.full_name,
                updated_at: new Date().toISOString()
            })
            .eq('supabase_uid', authUser.id)
            .select('supabase_uid, email, full_name, is_active')
            .single();

        if (error) throw error;
        if (!user) throw new Error('User not found');

        return {
            id: user.supabase_uid,
            email: user.email,
            full_name: user.full_name,
            is_active: user.is_active
        };
    }
}; 