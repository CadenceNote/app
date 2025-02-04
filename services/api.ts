import { supabase } from '@/lib/supabase';

export const auth = {
    async signup(email: string, password: string, fullName: string) {
        try {
            // 1. Sign up with Supabase Auth
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (!data.session) {
                throw new Error('No session after signup');
            }

            // 2. Create user record in our users table
            const { error: userError } = await supabase
                .from('users')
                .insert({
                    supabase_uid: data.user!.id,
                    email: email,
                    full_name: fullName,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (userError) {
                // If user creation fails, we should probably delete the auth user
                // but Supabase doesn't provide a way to do this directly via client
                throw userError;
            }

            return { session: data.session, user: data.user };
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    },

    async login(email: string, password: string) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async logout() {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    async getCurrentSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    }
};

// Export auth as default since we removed the api object
export default auth;