// src/pages/VerifyPage.jsx
import React, { useEffect, useState } from 'react';
import { verifyEmail } from '../services/authService';

// --- Icons Components ---
const SpinnerIcon = () => (
    <svg className="animate-spin h-16 w-16 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SuccessIcon = () => (
    <div className="rounded-full bg-green-100 p-3 mb-4 animate-bounce-short">
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
    </div>
);

const ErrorIcon = () => (
    <div className="rounded-full bg-red-100 p-3 mb-4">
        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
    </div>
);

/**
 * Helper to extract token from hash or query
 */
const getTokenFromLocation = () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const qToken = params.get('token');
        if (qToken) return qToken;
    } catch (e) {}

    const hash = window.location.hash || '';
    const parts = hash.replace(/^#\/?/, '').split('/');
    const verifyIndex = parts.indexOf('verify');
    if (verifyIndex !== -1 && parts.length > verifyIndex + 1) {
        return parts[verifyIndex + 1];
    }

    if (parts[0] === 'verify' && parts[1]) return parts[1];
    return null;
};

const VerifyPage = ({ navigate = () => {} }) => {
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [message, setMessage] = useState('Verifying your account details...');

    useEffect(() => {
        const token = getTokenFromLocation();
        if (!token) {
            setStatus('error');
            setMessage('Verification token not found. Please check your email link.');
            return;
        }

        const doVerify = async () => {
            try {
                const res = await verifyEmail(token);

                if (res && res.redirected && res.url) {
                    window.location.href = res.url;
                    return;
                }

                setStatus('success');
                setMessage(res?.message || 'Your email has been successfully verified. You can now access your dashboard.');
                
                // Optional: Auto redirect visual countdown could be added here, 
                // but usually explicit buttons are better for UX unless requested.
                setTimeout(() => navigate('login'), 3000); 
            } catch (err) {
                setStatus('error');
                setMessage(err.message || 'Verification link is invalid or has expired.');
            }
        };

        // Small delay for visual smoothness so the loading state doesn't flash too fast
        setTimeout(() => doVerify(), 800); 
    }, [navigate]);

    return (
        // Consistent Gradient Background
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-white/50 backdrop-blur-sm p-8 text-center transform transition-all hover:shadow-2xl">
                
                {/* Content Rendering based on Status */}
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                    
                    {/* --- LOADING STATE --- */}
                    {status === 'loading' && (
                        <>
                            <SpinnerIcon />
                            <h2 className="text-2xl font-bold text-gray-900 mt-4">Verifying...</h2>
                            <p className="text-gray-500 mt-2">{message}</p>
                        </>
                    )}

                    {/* --- SUCCESS STATE --- */}
                    {status === 'success' && (
                        <div className="animate-fade-in-up w-full">
                            <div className="flex justify-center"><SuccessIcon /></div>
                            <h2 className="text-2xl font-bold text-gray-900 mt-2">Verified!</h2>
                            <p className="text-gray-600 mt-2 mb-8">{message}</p>
                            
                            <button
                                onClick={() => navigate('login')}
                                className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform transition hover:scale-[1.02] active:scale-95"
                            >
                                Continue to Login
                            </button>
                            <p className="text-xs text-gray-400 mt-4">Redirecting automatically...</p>
                        </div>
                    )}

                    {/* --- ERROR STATE --- */}
                    {status === 'error' && (
                        <div className="animate-fade-in-up w-full">
                            <div className="flex justify-center"><ErrorIcon /></div>
                            <h2 className="text-2xl font-bold text-gray-900 mt-2">Verification Failed</h2>
                            <p className="text-gray-600 mt-2 mb-8">{message}</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('login')}
                                    className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform transition hover:scale-[1.02]"
                                >
                                    Back to Login
                                </button>
                                <button
                                    onClick={() => navigate('register')}
                                    className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                >
                                    Create New Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default VerifyPage;