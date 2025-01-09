import axios from 'axios';
import { supabase } from '@/lib/supabase';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    console.log('Current token:', token); // Debug log

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.log('No token available'); // Debug log
    }
    return config;
});

export const auth = {
    async signup(email: string, password: string, fullName: string) {
        try {
            // 1. Sign up with Supabase
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (!data.session) {
                throw new Error('No session after signup');
            }

            console.log('Supabase signup successful:', data); // Debug log

            // Wait a moment for the session to be properly set
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Manually set the token for this request
            const { data: userData } = await api.post('/users/create/', {
                email,
                full_name: fullName,
            }, {
                headers: {
                    Authorization: `Bearer ${data.session.access_token}`
                }
            });

            return { session: data.session, userData };
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
        await supabase.auth.signOut();
    },

    async getCurrentSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    }
};

export default api;