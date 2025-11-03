import React, { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isLoading, setIsLoading] = useState(true);

    const login = useCallback((userData, jwtToken) => {
        localStorage.setItem('token', jwtToken);
        setUser(userData);
        setToken(jwtToken);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        // Navigate via hash change to trigger router refresh
        window.location.hash = '#login';
    }, []);

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    // For now, using placeholder data
                    // In a real app, you would validate the token with your backend
                    setUser({ email: 'creator@example.com' });
                } catch (error) {
                    console.error('Error initializing auth:', error);
                    // If there's an error, clear the invalid token
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, [token]);

    const value = useMemo(() => ({
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        isLoading
    }), [user, token, login, logout, isLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
