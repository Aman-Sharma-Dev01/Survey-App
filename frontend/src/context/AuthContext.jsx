// src/context/AuthContext.jsx
import React, { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react';
import { fetchApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isLoading, setIsLoading] = useState(true);
    const [credits, setCredits] = useState(0);

    const login = useCallback((userData, jwtToken) => {
        localStorage.setItem('token', jwtToken);
        setUser(userData);
        setToken(jwtToken);
        setCredits(userData.credits || 200);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setCredits(0);
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
    }, []);

    // Fetch user profile to get credits
    const fetchProfile = useCallback(async () => {
        try {
            const profile = await fetchApi('/auth/profile', 'GET', null, true);
            setUser(profile);
            setCredits(profile.credits);
            return profile;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }, []);

    // Use credits for AI features
    const useCredits = useCallback(async (amount = 10) => {
        try {
            const result = await fetchApi('/auth/use-credits', 'POST', { amount }, true);
            if (result.success) {
                setCredits(result.credits);
                return { success: true, credits: result.credits };
            }
            return { success: false, message: 'Failed to use credits' };
        } catch (error) {
            if (error.message.includes('Insufficient credits')) {
                return { success: false, message: 'Insufficient credits', needsPurchase: true };
            }
            return { success: false, message: error.message };
        }
    }, []);

    // Refresh credits
    const refreshCredits = useCallback(async () => {
        try {
            const result = await fetchApi('/auth/credits', 'GET', null, true);
            setCredits(result.credits);
            return result.credits;
        } catch (error) {
            console.error('Error fetching credits:', error);
            return credits;
        }
    }, [credits]);

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    const profile = await fetchApi('/auth/profile', 'GET', null, true);
                    setUser(profile);
                    setCredits(profile.credits);
                } catch (error) {
                    console.error('Error initializing auth:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                    setCredits(0);
                }
            } else {
                setUser(null);
                setCredits(0);
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, [token]);

    const value = useMemo(() => ({
        user,
        token,
        credits,
        isAuthenticated: !!token,
        login,
        logout,
        isLoading,
        fetchProfile,
        useCredits,
        refreshCredits,
        setCredits,
    }), [user, token, credits, login, logout, isLoading, fetchProfile, useCredits, refreshCredits]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
