import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, ArrowLeft, ShieldX, History, Crown } from 'lucide-react';
import { getPendingPayments, approvePayment, rejectPayment } from '../services/paymentService';
import { useAuth } from '../context/AuthContext.jsx';

// Admin email allowed to access this page
const ADMIN_EMAIL = 'support@surveyzen.live';

const PaymentAdmin = ({ onBack, navigate }) => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Check if current user is admin
    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        const loadPayments = async () => {
            if (!isAdmin) return;
            try {
                setLoading(true);
                const data = await getPendingPayments();
                setPayments(data);
            } catch {
                setMessage({ type: 'error', text: 'Failed to fetch payments' });
            } finally {
                setLoading(false);
            }
        };
        loadPayments();
    }, [isAdmin]);

    const fetchPayments = async () => {
        if (!isAdmin) return;
        try {
            setLoading(true);
            const data = await getPendingPayments();
            setPayments(data);
        } catch {
            setMessage({ type: 'error', text: 'Failed to fetch payments' });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (paymentId) => {
        try {
            setActionLoading(paymentId);
            const result = await approvePayment(paymentId);
            setMessage({ type: 'success', text: result.message });
            // Remove from list
            setPayments(payments.filter(p => p._id !== paymentId));
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to approve' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (paymentId) => {
        if (!confirm('Are you sure you want to reject this payment?')) return;
        
        try {
            setActionLoading(paymentId);
            await rejectPayment(paymentId);
            setMessage({ type: 'success', text: 'Payment rejected' });
            setPayments(payments.filter(p => p._id !== paymentId));
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to reject' });
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

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
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-200 rounded-lg transition"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Payment Admin</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('plan-admin')}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition"
                        >
                            <Crown size={18} />
                            Plans
                        </button>
                        <button
                            onClick={() => navigate('payment-history')}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            <History size={18} />
                            History
                        </button>
                        <button
                            onClick={fetchPayments}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-4 p-4 rounded-lg ${
                        message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {message.text}
                        <button 
                            onClick={() => setMessage({ type: '', text: '' })}
                            className="float-right font-bold"
                        >
                            ×
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12">
                        <RefreshCw size={32} className="animate-spin mx-auto text-indigo-600" />
                        <p className="mt-2 text-gray-500">Loading payments...</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow">
                        <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No pending payments</h3>
                        <p className="text-gray-500">All payments have been processed</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payments.map((payment) => (
                            <div key={payment._id} className="bg-white rounded-xl shadow p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                                                PENDING
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {formatDate(payment.createdAt)}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">User</p>
                                                <p className="font-medium text-gray-900">{payment.user?.name}</p>
                                                <p className="text-sm text-gray-600">{payment.user?.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Plan</p>
                                                <p className="font-medium text-gray-900 capitalize">{payment.plan}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Amount</p>
                                                <p className="font-medium text-gray-900">₹{payment.amount}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Credits</p>
                                                <p className="font-medium text-green-600">{payment.credits.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase">Transaction ID</p>
                                            <p className="font-mono text-sm text-gray-900 break-all">{payment.transactionId}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex md:flex-col gap-2">
                                        <button
                                            onClick={() => handleApprove(payment._id)}
                                            disabled={actionLoading === payment._id}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                            <CheckCircle size={18} />
                                            {actionLoading === payment._id ? 'Approving...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleReject(payment._id)}
                                            disabled={actionLoading === payment._id}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                                        >
                                            <XCircle size={18} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentAdmin;
