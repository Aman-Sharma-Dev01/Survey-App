// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { loginCreator, googleAuth } from '../services/authService';
import { BASE_URL } from '../services/api.js';

// Google Client ID
const GOOGLE_CLIENT_ID = '776337724732-4j8psg32dgr5upg1jajekjflrfc25on7.apps.googleusercontent.com';

// Admin email - redirects to admin page instead of dashboard
const ADMIN_EMAIL = 'support@surveyzen.live';

// Simple SVG Icons components to keep the file self-contained
const MailIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);
const LockIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
);
const EyeIcon = () => (
  <svg className="w-5 h-5 text-gray-500 hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
);
const EyeOffIcon = () => (
  <svg className="w-5 h-5 text-gray-500 hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
);
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const LoginPage = ({ navigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { login, user, token } = useAuth();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken || token) {
            // Check if admin email to redirect appropriately
            const storedUser = user?.email;
            if (storedUser === ADMIN_EMAIL) {
                navigate('admin-dashboard');
            } else {
                navigate('dashboard');
            }
        }
    }, [token, user, navigate]);

    const handleGoogleCallback = async (credential) => {
        setGoogleLoading(true);
        setError('');
        try {
            const data = await googleAuth(credential);
            login({ email: data.email, name: data.name, avatar: data.avatar }, data.token);
            // Redirect admin to admin dashboard, others to regular dashboard
            navigate(data.email === ADMIN_EMAIL ? 'admin-dashboard' : 'dashboard');
        } catch (err) {
            setError(err.message || 'Google sign-in failed. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    // Initialize Google OAuth2 client for popup flow
    const googleClientRef = React.useRef(null);
    
    useEffect(() => {
        // Load Google's OAuth2 client library if not already loaded
        const initGoogleClient = () => {
            if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                googleClientRef.current = window.google.accounts.oauth2.initCodeClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: 'email profile',
                    ux_mode: 'popup',
                    callback: async (response) => {
                        if (response.code) {
                            // Exchange auth code for credential on backend
                            setGoogleLoading(true);
                            setError('');
                            try {
                                const res = await fetch(`${BASE_URL}/auth/google/code`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ code: response.code }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message || 'Google sign-in failed');
                                login({ email: data.email, name: data.name, avatar: data.avatar }, data.token);
                                navigate(data.email === ADMIN_EMAIL ? 'admin-dashboard' : 'dashboard');
                            } catch (err) {
                                setError(err.message || 'Google sign-in failed. Please try again.');
                            } finally {
                                setGoogleLoading(false);
                            }
                        }
                    },
                });
            }
        };
        
        // Check if library is already loaded
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            initGoogleClient();
        } else {
            // Wait for library to load
            const checkInterval = setInterval(() => {
                if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                    initGoogleClient();
                    clearInterval(checkInterval);
                }
            }, 100);
            // Cleanup after 10 seconds
            setTimeout(() => clearInterval(checkInterval), 10000);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGoogleClick = () => {
        if (googleClientRef.current) {
            googleClientRef.current.requestCode();
        } else if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            // Fallback: reinitialize and request
            const client = window.google.accounts.oauth2.initCodeClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'email profile',
                ux_mode: 'popup',
                callback: async (response) => {
                    if (response.code) {
                        setGoogleLoading(true);
                        setError('');
                        try {
                            const res = await fetch(`${BASE_URL}/auth/google/code`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ code: response.code }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.message || 'Google sign-in failed');
                            login({ email: data.email, name: data.name, avatar: data.avatar }, data.token);
                            navigate(data.email === ADMIN_EMAIL ? 'admin-dashboard' : 'dashboard');
                        } catch (err) {
                            setError(err.message || 'Google sign-in failed. Please try again.');
                        } finally {
                            setGoogleLoading(false);
                        }
                    }
                },
            });
            client.requestCode();
        } else {
            setError('Google Sign-In is not available. Please try again later.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await loginCreator({ email, password });
            login({ email: data.email, name: data.name, avatar: data.avatar }, data.token);
            // Redirect admin to admin dashboard, others to regular dashboard
            navigate(data.email === ADMIN_EMAIL ? 'admin-dashboard' : 'dashboard');
        } catch (err) {
            const msg = err.message || 'Login failed. Check your credentials.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Container with Gradient Background
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-white/50 backdrop-blur-sm transform transition-all hover:shadow-2xl">
                
                {/* Header Section */}
                <div className="px-8 pt-8 pb-6 text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to your creator dashboard
                    </p>
                </div>

                <div className="px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Error Alert */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-pulse">
                                <div className="flex">
                                    <div className="flex-shrink-0 text-red-500">⚠️</div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MailIcon />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm outline-none"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-semibold text-gray-700">Password</label>
                                <button
                                    type="button"
                                    onClick={() => navigate('forgot-password')}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockIcon />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm outline-none"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={loading || googleLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition hover:scale-[1.02] active:scale-95"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : 'Sign In'}
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        {/* Google Sign-In Button */}
                        <div>
                            <button
                                type="button"
                                onClick={handleGoogleClick}
                                disabled={loading || googleLoading}
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {googleLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in with Google...
                                    </span>
                                ) : (
                                    <>
                                        <GoogleIcon />
                                        Sign in with Google
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <a 
                                href="#register" 
                                onClick={(e) => { e.preventDefault(); navigate('register'); }} 
                                className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                Create free account
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;