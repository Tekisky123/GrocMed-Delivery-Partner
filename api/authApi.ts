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
    },

    sendForgotPasswordOtp: async (phone: string): Promise<{ success: boolean; message: string; phone?: string; maskedPhone?: string; sendCount?: number; maxAttempts?: number; attemptsLeft?: number }> => {
        try {
            const response = await axiosInstance.post('/admin/deliveryPartner/forgot-password/send-otp', { phone });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send WhatsApp OTP. Please try again.',
            };
        }
    },

    verifyForgotPasswordOtp: async (phone: string, otp: string): Promise<{ success: boolean; message: string; resetToken?: string; phone?: string }> => {
        try {
            const response = await axiosInstance.post('/admin/deliveryPartner/forgot-password/verify-otp', { phone, otp });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Invalid or expired OTP. Please try again.',
            };
        }
    },

    resetPasswordWithToken: async (phone: string, resetToken: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await axiosInstance.post('/admin/deliveryPartner/forgot-password/reset-password', { phone, resetToken, newPassword });
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to reset password. Please try again.',
            };
        }
    }
};

