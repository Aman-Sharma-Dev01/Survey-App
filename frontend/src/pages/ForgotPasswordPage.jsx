// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { forgotPassword } from '../services/authService';

const ForgotPasswordPage = ({ navigate = () => {} }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess('Reset link sent to your email (check spam). The link expires in 15 minutes.');
      setTimeout(() => navigate('login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white border border-indigo-100 shadow p-8 rounded-xl">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Forgot Password</h2>
        <p className="text-sm text-gray-600 mb-4">Enter your account email and we'll send a password reset link.</p>

        {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm bg-green-100 p-2 rounded mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Remembered your password?{' '}
          <button onClick={() => navigate('login')} className="text-indigo-600 font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
