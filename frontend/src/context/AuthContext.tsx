import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    token: string | null;
    user: string | null;
    credits: number;
    isAuthenticated: boolean;
    login: (token: string, user: string, credits: number) => void;
    logout: () => void;
    updateCredits: (credits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<string | null>(null);
    const [credits, setCredits] = useState<number>(0);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    // Initialize from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedCredits = localStorage.getItem('credits');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(storedUser);
            setCredits(parseFloat(storedCredits || '0'));
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = (newToken: string, newUser: string, newCredits: number) => {
        console.log('AuthContext: Setting authentication', { newUser, newCredits });
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', newUser);
        localStorage.setItem('credits', newCredits.toString());
        setToken(newToken);
        setUser(newUser);
        setCredits(newCredits);
        setIsAuthenticated(true);
    };

    const logout = () => {
        console.log('AuthContext: Logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('credits');
        setToken(null);
        setUser(null);
        setCredits(0);
        setIsAuthenticated(false);
    };

    const updateCredits = (newCredits: number) => {
        localStorage.setItem('credits', newCredits.toString());
        setCredits(newCredits);
    };

    // Don't render children until we've checked localStorage
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ token, user, credits, isAuthenticated, login, logout, updateCredits }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
