import api from './api';

interface User {
    id: number;
    email: string;
    full_name: string;
}

export const userApi = {
    // Get current user's information
    getCurrentUser: async (): Promise<User> => {
        const response = await api.get('/users/me/');
        return response.data;
    },

    // Update user's information
    updateUser: async (data: { full_name: string }): Promise<User> => {
        const response = await api.put('/users/me/update/', data);
        return response.data;
    },
}; 