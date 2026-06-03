import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const TOKEN_KEY = 'delivery_partner_auth_token';

const BASE_URL = 'https://grocmed-backend-production.up.railway.app/api';
// const BASE_URL = 'http://localhost:3000/api';

export const tokenManager = {
    saveToken: async (token: string) => {
        try {
            if (!AsyncStorage) return;
            await AsyncStorage.setItem(TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving token:', error);
        }
    },
    getToken: async () => {
        try {
            if (!AsyncStorage) {
                console.warn('AsyncStorage is not available');
                return null;
            }
            return await AsyncStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },
    removeToken: async () => {
        try {
            if (!AsyncStorage) return;
            await AsyncStorage.removeItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error removing token:', error);
        }
    }
};

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await tokenManager.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Set default Content-Type to application/json only if not already set (e.g. for FormData)
        if (!config.headers['Content-Type'] && !config.data?._parts) {
            config.headers['Content-Type'] = 'application/json';
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;
