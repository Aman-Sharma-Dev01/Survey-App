import React, { useState, useEffect } from 'react';
import { 
    Gift, 
    ToggleLeft, 
    ToggleRight, 
    Mail, 
    Send, 
    Loader, 
    CheckCircle, 
    XCircle,
    Ticket,
    Users,
    TrendingUp,
    ArrowLeft,
    Trash2,
    Copy,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
    getOfferSettings, 
    toggleNewUserOffer, 
    createManualVoucher, 
    getAllCoupons, 
    getCouponStats,
    deleteCoupon 
} from '../services/couponService';

const ADMIN_EMAIL = 'support@surveyzen.live';

const OfferAdmin = ({ navigate }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isOfferActive, setIsOfferActive] = useState(false);
    const [stats, setStats] = useState(null);
    const [coupons, setCoupons] = useState([]);
    const [email, setEmail] = useState('');
    const [premiumDays, setPremiumDays] = useState(7);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('settings');
    const [copiedCode, setCopiedCode] = useState(null);

    const isAdmin = user?.email === ADMIN_EMAIL;

    // Fetch initial data
    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [isAdmin]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [settingsData, statsData, couponsData] = await Promise.all([
                getOfferSettings(),
                getCouponStats(),
                getAllCoupons({ limit: 50 })
            ]);
            
            setIsOfferActive(settingsData.isNewUserOfferActive);
            setStats(statsData);
            setCoupons(couponsData.coupons || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage({ type: 'error', text: 'Failed to load data' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOffer = async () => {
        setActionLoading(true);
        try {
            const result = await toggleNewUserOffer();
            setIsOfferActive(result.isNewUserOfferActive);
            setMessage({ type: 'success', text: result.message });
            // Refresh stats
            const statsData = await getCouponStats();
            setStats(statsData);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to toggle offer' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateVoucher = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setMessage({ type: 'error', text: 'Please enter an email address' });
            return;
        }

        setActionLoading(true);
        try {
            const result = await createManualVoucher(email.trim(), premiumDays);
            setMessage({ type: 'success', text: result.message });
            setEmail('');
            setPremiumDays(7);
            // Refresh coupons and stats
            const [statsData, couponsData] = await Promise.all([
                getCouponStats(),
                getAllCoupons({ limit: 50 })
            ]);
            setStats(statsData);
            setCoupons(couponsData.coupons || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to create voucher' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCoupon = async (couponId) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        
        try {
            await deleteCoupon(couponId);
            setCoupons(prev => prev.filter(c => c._id !== couponId));
            setMessage({ type: 'success', text: 'Coupon deleted successfully' });
            const statsData = await getCouponStats();
            setStats(statsData);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete coupon' });
        }
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Access denied screen for non-admins
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-3">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        This page is only accessible to administrators.
                    </p>
                    <button
                        onClick={() => navigate('dashboard')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader size={40} className="animate-spin text-indigo-600 mb-4" />
                    <p className="text-gray-600">Loading offer settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('admin-dashboard')}
                        className="flex items-center text-indigo-600 hover:text-indigo-700 mb-4 transition"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Admin Dashboard
                    </button>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <Gift className="text-indigo-600" />
                                Offer Management
                            </h1>
                            <p className="text-gray-600 mt-1">Manage coupon codes and promotional offers</p>
                        </div>
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                        message.type === 'success' 
                            ? 'bg-green-50 text-green-800 border border-green-200' 
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        <span>{message.text}</span>
                        <button 
                            onClick={() => setMessage({ type: '', text: '' })}
                            className="ml-auto hover:opacity-70"
                        >
                            <XCircle size={18} />
                        </button>
                    </div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Ticket size={20} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{stats.totalCoupons}</p>
                                    <p className="text-sm text-gray-500">Total Coupons</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{stats.usedCoupons}</p>
                                    <p className="text-sm text-gray-500">Used</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <TrendingUp size={20} className="text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{stats.unusedCoupons}</p>
                                    <p className="text-sm text-gray-500">Available</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Users size={20} className="text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{stats.manualCoupons}</p>
                                    <p className="text-sm text-gray-500">Manual</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 font-medium transition ${
                            activeTab === 'settings'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`px-4 py-2 font-medium transition ${
                            activeTab === 'manual'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Create Voucher
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-4 py-2 font-medium transition ${
                            activeTab === 'list'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        All Coupons
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    {activeTab === 'settings' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Automatic Offer Settings</h2>
                            
                            {/* Toggle Switch */}
                            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">New User Welcome Offer</h3>
                                    <p className="text-gray-600 mt-1">
                                        When enabled, new users will automatically receive a coupon code for 7 days of free premium access.
                                    </p>
                                    <p className="text-sm text-indigo-600 mt-2 flex items-center gap-1">
                                        <Gift size={14} />
                                        Current Status: <span className="font-semibold">{isOfferActive ? 'Active' : 'Inactive'}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleToggleOffer}
                                    disabled={actionLoading}
                                    className={`p-2 rounded-full transition transform hover:scale-110 ${
                                        isOfferActive 
                                            ? 'text-green-600 hover:bg-green-100' 
                                            : 'text-gray-400 hover:bg-gray-100'
                                    }`}
                                >
                                    {actionLoading ? (
                                        <Loader size={40} className="animate-spin" />
                                    ) : isOfferActive ? (
                                        <ToggleRight size={48} />
                                    ) : (
                                        <ToggleLeft size={48} />
                                    )}
                                </button>
                            </div>

                            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                                    <Gift size={18} />
                                    How it works
                                </h4>
                                <ul className="mt-2 text-sm text-amber-700 space-y-1">
                                    <li>• When active, every new registered user gets a unique coupon code</li>
                                    <li>• Users can see their coupon in the profile dropdown</li>
                                    <li>• Applying the coupon gives 7 days of premium (Pro) features</li>
                                    <li>• After redemption, the coupon disappears from the profile</li>
                                    <li>• Premium features expire automatically after 7 days</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'manual' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Create Manual Voucher</h2>
                            <p className="text-gray-600 mb-6">
                                Create a voucher for a specific user by their email address. The voucher will appear in their profile.
                            </p>

                            <form onSubmit={handleCreateVoucher} className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        User Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="user@example.com"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Premium Days
                                    </label>
                                    <select
                                        value={premiumDays}
                                        onChange={(e) => setPremiumDays(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value={7}>7 days</option>
                                        <option value={14}>14 days</option>
                                        <option value={30}>30 days</option>
                                        <option value={90}>90 days</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50"
                                >
                                    {actionLoading ? (
                                        <Loader size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Create & Assign Voucher
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <h4 className="font-semibold text-blue-800">Note</h4>
                                <p className="mt-1 text-sm text-blue-700">
                                    If the user already exists, the voucher will appear in their profile immediately. 
                                    If they haven't registered yet, the voucher will be assigned when they register with this email.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'list' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-6">All Coupons</h2>
                            
                            {coupons.length === 0 ? (
                                <div className="text-center py-12">
                                    <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">No coupons created yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Code</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Assigned To</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Days</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Created</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {coupons.map((coupon) => (
                                                <tr key={coupon._id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                                                {coupon.code}
                                                            </code>
                                                            <button
                                                                onClick={() => copyToClipboard(coupon.code)}
                                                                className="text-gray-400 hover:text-indigo-600 transition"
                                                                title="Copy code"
                                                            >
                                                                {copiedCode === coupon.code ? (
                                                                    <CheckCircle size={16} className="text-green-500" />
                                                                ) : (
                                                                    <Copy size={16} />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                            coupon.type === 'auto' 
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                            {coupon.type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {coupon.assignedTo?.email || coupon.assignedEmail || '-'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                            coupon.isUsed 
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {coupon.isUsed ? 'Used' : 'Available'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {coupon.premiumDays}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-500">
                                                        {new Date(coupon.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {!coupon.isUsed && (
                                                            <button
                                                                onClick={() => handleDeleteCoupon(coupon._id)}
                                                                className="text-red-500 hover:text-red-700 transition"
                                                                title="Delete coupon"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfferAdmin;
