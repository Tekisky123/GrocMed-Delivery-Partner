import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenManager } from '../api/axiosInstance';
import { authApi } from '../api/authApi';
import { Partner, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [partner, setPartner] = useState<Partner | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPartner();
    }, []);

    const loadPartner = async () => {
        try {
            const token = await tokenManager.getToken();
            if (token) {
                setIsAuthenticated(true);
                const res = await authApi.getProfile();
                if (res.success && res.data) {
                    // Note: adjust mapping based on actual dashboard-stats response
                    const partnerData: Partner = {
                        id: res.data._id || '',
                        name: res.data.name || '',
                        phone: res.data.phone || '',
                        email: res.data.email,
                        isActive: res.data.isActive ?? true,
                    };
                    setPartner(partnerData);
                } else {
                    await logout();
                }
            }
        } catch (error) {
            console.error('Failed to load partner', error);
            await logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async (credentials: any) => {
        const res = await authApi.login(credentials);
        if (res.success && res.data?.token) {
            await tokenManager.saveToken(res.data.token);
            setIsAuthenticated(true);
            
            // Re-fetch profile to get full partner details
            const profileRes = await authApi.getProfile();
            if (profileRes.success && profileRes.data) {
                const partnerData: Partner = {
                    id: profileRes.data._id || '',
                    name: profileRes.data.name || '',
                    phone: profileRes.data.phone || '',
                    email: profileRes.data.email,
                    isActive: profileRes.data.isActive ?? true,
                };
                setPartner(partnerData);
            }
            return { success: true };
        }
        return { success: false, message: res.message };
    }, []);

    const logout = useCallback(async () => {
        await tokenManager.removeToken();
        setPartner(null);
        setIsAuthenticated(false);
    }, []);

    const updatePartner = useCallback((partnerData: Partial<Partner>) => {
        setPartner((prev) => (prev ? { ...prev, ...partnerData } : null));
    }, []);

    return (
        <AuthContext.Provider value={{ partner, isAuthenticated, isLoading, login, logout, updatePartner }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
