import axiosInstance, { tokenManager } from './axiosInstance';
import { Platform } from 'react-native';

export const orderApi = {
    getAssignedOrders: async () => {
        try {
            const response = await axiosInstance.get('/admin/deliveryPartner/assigned-orders');
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Failed to fetch assigned orders' };
        }
    },

    updateOrderStatus: async (orderId: string, status: string, codMethod?: string) => {
        try {
            const response = await axiosInstance.put(`/admin/deliveryPartner/update-order-status/${orderId}`, {
                status,
                codMethod,
            });
            return response.data;
        } catch (error: any) {
            console.error('Update Error:', error);
            return { success: false, message: error.response?.data?.message || error.message || 'Failed to update order status' };
        }
    },

    getNotifications: async () => {
        try {
            const response = await axiosInstance.get('/admin/deliveryPartner/notifications');
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Failed to fetch notifications' };
        }
    },
    
    getDashboardStats: async () => {
        try {
            const response = await axiosInstance.get('/admin/deliveryPartner/dashboard-stats');
            return response.data;
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Failed to fetch dashboard stats' };
        }
    }
};
