import axiosInstance from './axiosInstance';

export const authApi = {
    login: async (credentials: any) => {
        try {
            const response = await axiosInstance.post('/admin/deliveryPartner/loginDeliveryPartner', credentials);
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    },

    getProfile: async () => {
        try {
            const response = await axiosInstance.get('/admin/deliveryPartner/profile');
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Failed to fetch profile' };
        }
    },

    updateFcmToken: async (fcmToken: string) => {
        try {
            const response = await axiosInstance.post('/admin/deliveryPartner/update-fcm-token', { fcmToken });
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Failed to update FCM token' };
        }
    }
};
