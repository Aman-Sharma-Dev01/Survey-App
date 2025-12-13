import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, ArrowLeft, ShieldX, TrendingUp, Users, CreditCard, Coins } from 'lucide-react';
import { getAllPayments } from '../services/paymentService';
import { useAuth } from '../context/AuthContext.jsx';

// Admin email allowed to access this page
const ADMIN_EMAIL = 'support@surveyzen.live';

const PaymentHistory = ({ onBack, navigate }) => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, verified, rejected

    // Check if current user is admin
    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        const loadPayments = async () => {
            if (!isAdmin) return;
            try {
                setLoading(true);
                const data = await getAllPayments();
                setPayments(data.payments);
                setStats(data.stats);
            } catch {
                console.error('Failed to fetch payments');
            } finally {
                setLoading(false);
            }
        };
        loadPayments();
    }, [isAdmin]);

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'verified':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                        <CheckCircle size={12} /> Verified
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                        <XCircle size={12} /> Rejected
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                        <Clock size={12} /> Pending
                    </span>
                );
        }
    };

    const filteredPayments = payments.filter(p => {
        if (filter === 'all') return true;
        return p.status === filter;
    });

    // If not admin, show access denied
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <ShieldX size={64} className="mx-auto text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        You don&apos;t have permission to access this page. This area is restricted to administrators only.
                    </p>
                    <button
                        onClick={onBack}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('payment-admin')}
                            className="p-2 hover:bg-gray-200 rounded-lg transition"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <CreditCard size={24} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    <p className="text-xs text-gray-500">Total Payments</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp size={24} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue}</p>
                                    <p className="text-xs text-gray-500">Total Revenue</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Clock size={24} className="text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                                    <p className="text-xs text-gray-500">Pending</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Coins size={24} className="text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalCreditsGiven.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Credits Given</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {['all', 'pending', 'verified', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                filter === status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            {status !== 'all' && stats && (
                                <span className="ml-1 text-xs">
                                    ({stats[status]})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Payments Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <RefreshCw size={32} className="animate-spin mx-auto text-indigo-600" />
                        <p className="mt-2 text-gray-500">Loading payments...</p>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow">
                        <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No payments found</h3>
                        <p className="text-gray-500">No payments match the selected filter</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Credits</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Transaction ID</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredPayments.map((payment) => (
                                        <tr key={payment._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {formatDate(payment.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-900">{payment.user?.name}</p>
                                                <p className="text-xs text-gray-500">{payment.user?.email}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 capitalize font-medium">
                                                {payment.plan}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                ₹{payment.amount}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-green-600 font-medium">
                                                {payment.credits.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {payment.transactionId}
                                                </code>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(payment.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentHistory;
