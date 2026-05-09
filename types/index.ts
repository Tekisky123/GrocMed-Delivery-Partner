export interface Partner {
    id: string;
    name: string;
    phone: string;
    email?: string;
    isActive: boolean;
    vehicleType?: string;
    vehicleNumber?: string;
}

export interface AuthContextType {
    partner: Partner | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: any) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    updatePartner: (partnerData: Partial<Partner>) => void;
}
