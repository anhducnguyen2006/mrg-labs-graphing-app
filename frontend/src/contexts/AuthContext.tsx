import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../services/auth';
import * as authService from '../services/auth';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check authentication status on mount - TEMPORARILY DISABLED FOR DEVELOPMENT
    useEffect(() => {
        // Skip auth check - pretend user is always logged in for development
        setUser({ username: 'Dev User' });
        setIsLoading(false);
        // checkAuthStatus(); // Uncomment to re-enable auth
    }, []);

    const checkAuthStatus = async () => {
        try {
            const isAuth = await authService.checkAuth();
            if (isAuth) {
                // We don't have the username from checkAuth, but we know user is authenticated
                setUser({ username: 'User' }); // Can be improved to fetch actual user data
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        const response = await authService.login({ username, password });
        setUser({ username, id: response.user_id });
    };

    const register = async (username: string, password: string) => {
        const response = await authService.register({ username, password });
        // After registration, automatically log in
        await login(username, password);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
