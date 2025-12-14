import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, UserPlus, Trash2, RefreshCw, ShieldX, Calendar, Mail, User } from 'lucide-react';
import { getPremiumUsers, grantPlan, revokePlan } from '../services/paymentService';
import { useAuth } from '../context/AuthContext.jsx';

// Admin email allowed to access this page
const ADMIN_EMAIL = 'support@surveyzen.live';

const PlanAdmin = ({ onBack }) => {
    const { user } = useAuth();
    const [premiumUsers, setPremiumUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Form state
    const [email, setEmail] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('power');
    const [customDuration, setCustomDuration] = useState('');

    // Check if current user is admin
    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        if (isAdmin) {
            fetchPremiumUsers();
        }
    }, [isAdmin]);

    const fetchPremiumUsers = async () => {
        try {
            setLoading(true);
            const data = await getPremiumUsers();
            setPremiumUsers(data);
        } catch {
            setMessage({ type: 'error', text: 'Failed to fetch premium users' });
        } finally {
            setLoading(false);
        }
    };

    const handleGrantPlan = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setMessage({ type: 'error', text: 'Please enter an email address' });
            return;
        }

        try {
            setActionLoading(true);
            setMessage({ type: '', text: '' });
            
            const duration = customDuration ? parseInt(customDuration) : null;
            const result = await grantPlan(email.trim(), selectedPlan, duration);
            
            setMessage({ type: 'success', text: result.message });
            setEmail('');
            setCustomDuration('');
            
            // Refresh list
            fetchPremiumUsers();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to grant plan' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevokePlan = async (userEmail) => {
        if (!confirm(`Are you sure you want to revoke the plan from ${userEmail}?`)) return;

        try {
            setActionLoading(true);
            const result = await revokePlan(userEmail);
            setMessage({ type: 'success', text: result.message });
            
            // Remove from list
            setPremiumUsers(premiumUsers.filter(u => u.email !== userEmail));
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to revoke plan' });
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            dateStyle: 'medium'
        });
    };

    const isExpired = (expiresAt) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    // Access denied screen for non-admins
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldX size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-3">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        This page is only accessible to administrators.
                    </p>
                    <button
                        onClick={onBack}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-200 rounded-lg transition"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Crown className="text-amber-500" />
                                Plan Management
                            </h1>
                            <p className="text-gray-500 text-sm">Grant or revoke premium plans manually</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchPremiumUsers}
                        disabled={loading}
                        className="p-2 hover:bg-gray-200 rounded-lg transition"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Message */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        message.type === 'success' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Grant Plan Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <UserPlus size={20} className="text-indigo-600" />
                        Grant Premium Plan
                    </h2>
                    
                    <form onSubmit={handleGrantPlan} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    User Email *
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Plan Type
                                </label>
                                <select
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="power">Power (2 years default)</option>
                                    <option value="pro">Pro (3 months default)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Custom Duration (months) - Optional
                            </label>
                            <input
                                type="number"
                                value={customDuration}
                                onChange={(e) => setCustomDuration(e.target.value)}
                                placeholder="Leave empty for default duration"
                                min="1"
                                max="120"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Default: Pro = 3 months, Power = 24 months (2 years)
                            </p>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {actionLoading ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Granting...
                                </>
                            ) : (
                                <>
                                    <Crown size={18} />
                                    Grant Plan
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Premium Users List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Premium Users ({premiumUsers.length})
                        </h2>
                    </div>
                    
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">
                            <RefreshCw size={32} className="animate-spin mx-auto mb-2" />
                            Loading...
                        </div>
                    ) : premiumUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Crown size={48} className="mx-auto mb-3 text-gray-300" />
                            <p>No premium users yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {premiumUsers.map((u) => (
                                <div key={u._id} className={`p-4 hover:bg-gray-50 transition ${isExpired(u.planExpiresAt) ? 'bg-red-50' : ''}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User size={16} className="text-gray-400" />
                                                <span className="font-medium text-gray-800 truncate">{u.name}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                    u.plan === 'power' 
                                                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                                                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                                }`}>
                                                    {u.plan?.toUpperCase()}
                                                </span>
                                                {isExpired(u.planExpiresAt) && (
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-600">
                                                        EXPIRED
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Mail size={14} />
                                                    {u.email}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    Expires: {formatDate(u.planExpiresAt)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleRevokePlan(u.email)}
                                            disabled={actionLoading}
                                            className="px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition flex items-center gap-2 text-sm font-medium"
                                        >
                                            <Trash2 size={16} />
                                            Revoke
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlanAdmin;
