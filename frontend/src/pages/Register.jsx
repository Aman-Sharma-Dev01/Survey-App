import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { registerCreator } from '../services/authService';

const RegisterPage = ({ navigate = () => {} }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // API Call: POST /auth/register
            const data = await registerCreator({ name, email, password });

            // Log the user in (optional — can skip if you want manual login)
            login({ email: data.email, name: data.name }, data.token);

            // Show success message
            setSuccess('Registration successful! Redirecting to dashboard...');

            // Redirect after short delay
            setTimeout(() => {
                navigate('dashboard');
            }, 1500);
        } catch (err) {
            setError(err.message || 'Registration failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl border border-indigo-100">
                <h2 className="text-3xl font-bold text-center text-indigo-700">Creator Registration</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <p className="text-red-500 text-center text-sm bg-red-100 p-2 rounded-lg">{error}</p>
                    )}
                    {success && (
                        <p className="text-green-600 text-center text-sm bg-green-100 p-2 rounded-lg">
                            {success}
                        </p>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

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

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('login')}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        Login here
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
