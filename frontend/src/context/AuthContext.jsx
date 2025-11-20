// src/context/AuthContext.jsx
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
        window.location.hash = '#login';
    }, []);

    // Optional: call this to populate user from token (if you later add /profile endpoint)
    const setUserFromToken = useCallback(async (profile) => {
        if (profile) setUser(profile);
    }, []);

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    // Minimal placeholder: keep existing simple behaviour
                    // Ideally, call backend /api/auth/me or /api/users/profile to get details
                    setUser(prev => prev || { email: 'creator@example.com' });
                } catch (error) {
                    console.error('Error initializing auth:', error);
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
        isLoading,
        setUserFromToken,
    }), [user, token, login, logout, isLoading, setUserFromToken]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
