// src/pages/VerifyPage.jsx
import React, { useEffect, useState } from 'react';
import { verifyEmail } from '../services/authService';

/**
 * This component supports either:
 * - Hash routing like #verify/<token>
 * - Query param like ?token=...
 * - Path-like usage if your router passes token as prop (not implemented here)
 */
const getTokenFromLocation = () => {
  // Check query param
  try {
    const params = new URLSearchParams(window.location.search);
    const qToken = params.get('token');
    if (qToken) return qToken;
  } catch (e) {}

  // Check hash style: #verify/<token> or #/verify/<token>
  const hash = window.location.hash || '';
  const parts = hash.replace(/^#\/?/, '').split('/');
  // If hash begins with verify then token is next segment
  const verifyIndex = parts.indexOf('verify');
  if (verifyIndex !== -1 && parts.length > verifyIndex + 1) {
    return parts[verifyIndex + 1];
  }

  // If hash is like #verify:token or #verify/<token> simple splitting
  if (parts[0] === 'verify' && parts[1]) return parts[1];

  // If path-like (#/verify?token=) fallback to query extraction above
  return null;
};

const VerifyPage = ({ navigate = () => {} }) => {
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = getTokenFromLocation();
    if (!token) {
      setStatus('error');
      setMessage('Verification token not found.');
      return;
    }

    const doVerify = async () => {
      try {
        const res = await verifyEmail(token);

        // If backend returned redirected:true (we detected redirect), navigate to dashboard
        if (res && res.redirected && res.url) {
          // try to navigate to dashboard; if redirect is cross-origin the browser may already have followed it
          window.location.href = res.url;
          return;
        }

        setStatus('success');
        setMessage(res?.message || 'Your account has been verified. You can now log in.');
        // optionally, navigate to login after a short delay
        setTimeout(() => navigate('login'), 1800);
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification failed or token expired.');
      }
    };

    doVerify();
  }, [navigate]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white border border-indigo-100 shadow p-8 rounded-xl text-center">
        {status === 'loading' && <p className="text-indigo-600">Verifying your account...</p>}
        {status === 'success' && (
          <>
            <h3 className="text-2xl font-semibold text-green-600">Verified!</h3>
            <p className="mt-2 text-gray-700">{message}</p>
            <button
              onClick={() => navigate('login')}
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Go to Login
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <h3 className="text-2xl font-semibold text-red-600">Verification failed</h3>
            <p className="mt-2 text-gray-700">{message}</p>
            <div className="mt-4">
              <button onClick={() => navigate('login')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg mr-2">
                Go to Login
              </button>
              <button onClick={() => navigate('register')} className="px-4 py-2 border rounded-lg">
                Register
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyPage;
