import React, { useState, useEffect } from 'react';
import { 
    CreditCard, 
    History, 
    Crown, 
    Award, 
    LayoutDashboard, 
    HelpCircle, 
    PlusCircle,
    Users,
    Settings,
    ShieldCheck,
    Gift,
    Mail,
    MailCheck,
    MailX,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api';

// Admin email allowed to access this page
const ADMIN_EMAIL = 'support@surveyzen.live';

const AdminCard = ({ icon: Icon, title, description, color, onClick }) => {
    const colorClasses = {
        indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
        purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
        amber: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
        green: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
        blue: 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
        pink: 'from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700',
        teal: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
    };

    return (
        <button
            onClick={onClick}
            className={`group relative bg-gradient-to-br ${colorClasses[color]} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-white text-left w-full`}
        >
            <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition">
                    <Icon size={28} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold mb-1">{title}</h3>
                    <p className="text-sm text-white/80">{description}</p>
                </div>
            </div>
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition">
                <Icon size={60} />
            </div>
        </button>
    );
};

const AdminDashboard = ({ navigate }) => {
    const { user } = useAuth();
    const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(true);
    const [autoGrantMruPro, setAutoGrantMruPro] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isTogglingVerification, setIsTogglingVerification] = useState(false);
    const [isTogglingAutoGrant, setIsTogglingAutoGrant] = useState(false);
    const [isRunningGrantNow, setIsRunningGrantNow] = useState(false);
    
    // Check if current user is admin
    const isAdmin = user?.email === ADMIN_EMAIL;

    // Fetch system settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/auth/system-settings');
                // `api.get` returns the response body directly
                setEmailVerificationEnabled(response.emailVerificationEnabled);
                setAutoGrantMruPro(Boolean(response.autoGrantMruPro));
            } catch (error) {
                console.error('Error fetching system settings:', error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        if (isAdmin) {
            fetchSettings();
        }
    }, [isAdmin]);

    // Toggle email verification
    const toggleEmailVerification = async () => {
        setIsTogglingVerification(true);
        try {
            // This route requires admin/auth, send protected request
            const result = await api.put('/auth/system-settings', {
                emailVerificationEnabled: !emailVerificationEnabled
            }, true);
            setEmailVerificationEnabled(result.emailVerificationEnabled);
        } catch (error) {
            console.error('Error updating system settings:', error);
                alert(error?.message || 'Failed to update setting');
        } finally {
            setIsTogglingVerification(false);
        }
    };

    // Toggle auto-grant for mru.edu.in users
    const toggleAutoGrant = async () => {
        setIsTogglingAutoGrant(true);
        try {
            const result = await api.put('/auth/system-settings', {
                autoGrantMruPro: !autoGrantMruPro
            }, true);
            setAutoGrantMruPro(Boolean(result.autoGrantMruPro));
            alert(`Auto-grant for mru.edu.in is now ${result.autoGrantMruPro ? 'ENABLED' : 'DISABLED'}`);
        } catch (error) {
            console.error('Error updating auto-grant setting:', error);
            alert(error?.message || 'Failed to update auto-grant setting');
        } finally {
            setIsTogglingAutoGrant(false);
        }
    };

    // Run immediate grant for existing MRU users (admin-only)
    const runGrantNow = async () => {
        if (!confirm('This will grant lifetime pro to all existing @mru.edu.in users. Proceed?')) return;
        setIsRunningGrantNow(true);
        try {
            // Backend accepts `runGrantNow: true` and will perform the one-off update
            const result = await api.put('/auth/system-settings', {
                runGrantNow: true
            }, true);
            alert(result.message || 'Grant operation started. Check backend logs.');
        } catch (error) {
            console.error('Error running grant now:', error);
            alert(error?.message || 'Failed to run grant operation');
        } finally {
            setIsRunningGrantNow(false);
        }
    };

    // Access denied screen for non-admins
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} className="text-red-500" />
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

    const adminFeatures = [
        {
            icon: CreditCard,
            title: 'Payment Verification',
            description: 'Review and approve pending payment requests',
            color: 'green',
            route: 'payment-admin'
        },
        {
            icon: History,
            title: 'Payment History',
            description: 'View all payment transactions and history',
            color: 'purple',
            route: 'payment-history'
        },
        {
            icon: Crown,
            title: 'Plan Management',
            description: 'Manually grant or revoke premium plans',
            color: 'amber',
            route: 'plan-admin'
        },
        {
            icon: Award,
            title: 'Certificate Manager',
            description: 'Create and manage quiz certificates',
            color: 'blue',
            route: 'certificate-admin'
        },
        {
            icon: Gift,
            title: 'Offers & Coupons',
            description: 'Manage promotional offers and vouchers',
            color: 'pink',
            route: 'offer-admin'
        }
    ];

    const quickLinks = [
        {
            icon: LayoutDashboard,
            title: 'Surveys',
            description: 'View and manage surveys',
            color: 'indigo',
            route: 'dashboard'
        },
        {
            icon: HelpCircle,
            title: 'Quizzes',
            description: 'View and manage quizzes',
            color: 'teal',
            route: 'quiz-dashboard'
        },
        {
            icon: PlusCircle,
            title: 'Create Survey',
            description: 'Create a new survey',
            color: 'pink',
            route: 'create'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <ShieldCheck size={18} />
                        Admin Access
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Welcome back, {user?.name}! Manage your platform from here.
                    </p>
                </div>

                {/* Admin Features Grid */}
                <div className="mb-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Settings size={22} className="text-gray-600" />
                        Admin Tools
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {adminFeatures.map((feature, index) => (
                            <AdminCard
                                key={index}
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                color={feature.color}
                                onClick={() => navigate(feature.route)}
                            />
                        ))}
                    </div>
                </div>

                {/* System Settings */}
                <div className="mb-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Mail size={22} className="text-gray-600" />
                        System Settings
                    </h2>
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${emailVerificationEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    {emailVerificationEnabled ? (
                                        <MailCheck size={28} className="text-green-600" />
                                    ) : (
                                        <MailX size={28} className="text-gray-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Email Verification</h3>
                                    <p className="text-sm text-gray-500">
                                        {emailVerificationEnabled 
                                            ? 'Users must verify their email after registration'
                                            : 'Users are auto-verified upon registration'
                                        }
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleEmailVerification}
                                disabled={isLoadingSettings || isTogglingVerification}
                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                    emailVerificationEnabled ? 'bg-green-500' : 'bg-gray-300'
                                } ${(isLoadingSettings || isTogglingVerification) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {isTogglingVerification ? (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 size={16} className="animate-spin text-white" />
                                    </span>
                                ) : (
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                                            emailVerificationEnabled ? 'translate-x-8' : 'translate-x-1'
                                        }`}
                                    />
                                )}
                            </button>
                        </div>
                        <div className={`mt-4 p-3 rounded-lg ${emailVerificationEnabled ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                            <p className={`text-sm ${emailVerificationEnabled ? 'text-green-700' : 'text-amber-700'}`}>
                                {emailVerificationEnabled 
                                    ? '✓ Email verification is enabled. New users will receive a verification email.'
                                    : '⚠ Email verification is disabled. Users will be auto-verified on registration.'
                                }
                            </p>
                        </div>
                        {/* Auto-grant MRU Pro setting */}
                        <div className="mt-6 border-t pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${autoGrantMruPro ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                                        <Crown size={28} className={autoGrantMruPro ? 'text-indigo-600' : 'text-gray-500'} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">Auto-grant MRU Pro</h3>
                                        <p className="text-sm text-gray-500">
                                            {autoGrantMruPro
                                                ? 'New users signing up with @mru.edu.in will be granted lifetime Pro.'
                                                : 'Auto-grant is disabled. MRU users will not receive Pro automatically.'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={toggleAutoGrant}
                                        disabled={isLoadingSettings || isTogglingAutoGrant}
                                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                            autoGrantMruPro ? 'bg-indigo-600' : 'bg-gray-300'
                                        } ${(isLoadingSettings || isTogglingAutoGrant) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        {isTogglingAutoGrant ? (
                                            <span className="absolute inset-0 flex items-center justify-center">
                                                <Loader2 size={16} className="animate-spin text-white" />
                                            </span>
                                        ) : (
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                                                    autoGrantMruPro ? 'translate-x-8' : 'translate-x-1'
                                                }`}
                                            />
                                        )}
                                    </button>
                                    <button
                                        onClick={runGrantNow}
                                        disabled={isRunningGrantNow}
                                        className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100 hover:bg-indigo-100 transition"
                                    >
                                        {isRunningGrantNow ? 'Running…' : 'Run now'}
                                    </button>
                                </div>
                            </div>
                            <div className={`mt-3 p-3 rounded-lg ${autoGrantMruPro ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50 border border-gray-100'}`}>
                                <p className={`text-sm ${autoGrantMruPro ? 'text-indigo-700' : 'text-gray-700'}`}>
                                    {autoGrantMruPro
                                        ? '✓ Auto-grant is ON. Existing users are unaffected unless you run the one-off grant.'
                                        : 'Auto-grant is OFF. Use "Run now" to grant existing MRU users manually.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={22} className="text-gray-600" />
                        Quick Links
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {quickLinks.map((link, index) => (
                            <AdminCard
                                key={index}
                                icon={link.icon}
                                title={link.title}
                                description={link.description}
                                color={link.color}
                                onClick={() => navigate(link.route)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
