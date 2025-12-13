// src/services/authService.js
import { fetchApi } from './api';

/**
 * Register a new creator
 * Backend sends verification email automatically
 */
export const registerCreator = async (credentials) => {
    return fetchApi('/auth/register', 'POST', credentials, false);
};

/**
 * Login creator
 */
export const loginCreator = async (credentials) => {
    return fetchApi('/auth/login', 'POST', credentials, false);
};

/**
 * Verify email using the token sent in email
 * GET /auth/verify/:token
 */
export const verifyEmail = async (token) => {
    return fetchApi(`/auth/verify/${token}`, 'GET', null, false);
};

/**
 * Forgot password - send reset link to email
 * POST /auth/forgot-password
 */
export const forgotPassword = async (email) => {
    return fetchApi('/auth/forgot-password', 'POST', { email }, false);
};

/**
 * Reset password using token
 * POST /auth/reset-password/:token
 */
export const resetPassword = async (token, newPassword) => {
    return fetchApi(`/auth/reset-password/${token}`, 'POST', { password: newPassword }, false);
};

/**
 * Google OAuth login/register
 * POST /auth/google
 */
export const googleAuth = async (credential) => {
    return fetchApi('/auth/google', 'POST', { credential }, false);
};
