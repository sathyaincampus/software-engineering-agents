export interface UserProfile {
    userId: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: 'PARENT' | 'CHILD';
    parentId: string | null;
    parent?: {
        userId: string;
        displayName: string;
    };
    children?: Array<{ 
        userId: string;
        displayName: string;
        avatarUrl: string | null;
    }>;
    currentPoints?: number; // Add points if fetched with user profile
}

export interface AuthResponse {
    token: string;
    user: UserProfile;
}

export interface LoginData {
    email: string;
    password?: string; 
}

export interface SignupData {
    email: string;
    password?: string; 
    displayName: string;
}

export interface AuthState {
    token: string | null;
    user: UserProfile | null;
    isAuthenticated: boolean;
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
}
