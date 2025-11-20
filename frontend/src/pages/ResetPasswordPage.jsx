// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { resetPassword } from '../services/authService';

const getTokenFromLocation = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const qToken = params.get('token');
    if (qToken) return qToken;
  } catch (e) {}

  const hash = window.location.hash || '';
  const parts = hash.replace(/^#\/?/, '').split('/');
  const resetIndex = parts.indexOf('reset-password');
  if (resetIndex !== -1 && parts.length > resetIndex + 1) {
    return parts[resetIndex + 1];
  }
  // also try 'reset' or 'reset/<token>'
  if (parts[0] === 'reset' && parts[1]) return parts[1];
  if (parts[0] === 'reset-password' && parts[1]) return parts[1];

  return null;
};

const ResetPasswordPage = ({ navigate = () => {} }) => {
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const t = getTokenFromLocation();
    setToken(t);
    if (!t) setError('Password reset token not found.');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Reset token missing.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('login'), 1800);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white border border-indigo-100 shadow p-8 rounded-xl">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Reset Password</h2>

        {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm bg-green-100 p-2 rounded mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
