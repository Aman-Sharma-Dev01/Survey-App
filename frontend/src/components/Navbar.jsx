import React, { useState, useEffect, useRef } from 'react';
import { LogOut, PlusCircle, LayoutDashboard, HelpCircle, Menu, X, Coins, ShoppingCart, Crown, Gift, Ticket, CheckCircle, Loader, RefreshCw, GraduationCap, Sparkles, Zap, FileText, BarChart3, Users, Shield, PenLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { applyCoupon } from '../services/couponService';

// Check if user email is from Manav Rachna University
const isMRUUser = (email) => {
    if (!email) return false;
    return email.toLowerCase().endsWith('@mru.edu.in');
};

// MRU Badge Component
const MRUBadge = ({ onClick }) => (
    <button
        onClick={onClick}
        className="hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 transition shadow-sm"
        title="Manav Rachna University - Premium Access"
    >
        <GraduationCap size={10} />
        <span>MRU</span>
    </button>
);

// MRU Premium Modal
const MRUPremiumModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    
    const premiumFeatures = [
        { icon: Sparkles, title: 'Unlimited AI Question Generation', desc: 'Generate unlimited survey and quiz questions using AI' },
        { icon: Zap, title: 'Unlimited AI Credits', desc: 'No credit limits for AI-powered features' },
        { icon: FileText, title: 'PDF & Document Upload', desc: 'Upload PDFs and Word documents for AI analysis' },
        { icon: BarChart3, title: 'Advanced Analytics', desc: 'Deep insights and detailed response analytics' },
        { icon: Users, title: 'Unlimited Responses', desc: 'Collect unlimited survey and quiz responses' },
        { icon: Shield, title: 'Priority Support', desc: 'Get priority assistance from our support team' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <GraduationCap size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Manav Rachna University</h2>
                            <p className="text-blue-100 text-sm">Premium Access Enabled</p>
                        </div>
                    </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-4 border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700">
                            <Crown size={18} className="text-blue-600" />
                            <span className="font-semibold">All Premium Features are FREE for MRU Staff & Faculty!</span>
                        </div>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Premium Benefits:</h3>
                    <div className="space-y-3">
                        {premiumFeatures.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <feature.icon size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{feature.title}</p>
                                    <p className="text-xs text-gray-500">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 transition"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

// Avatar component - shows Google avatar or initials
const ProfileAvatar = ({ user, size = 'sm' }) => {
    const sizeClasses = {
        sm: 'w-7 h-7 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    if (user?.avatar) {
        return (
            <img 
                src={user.avatar} 
                alt={user.name || 'Profile'} 
                className={`${sizeClasses[size]} rounded-full object-cover border-2 border-indigo-400`}
                referrerPolicy="no-referrer"
            />
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-indigo-500 flex items-center justify-center font-semibold text-white border-2 border-indigo-400`}>
            {getInitials(user?.name)}
        </div>
    );
};

const NavButton = ({ Icon, label, target, onClick, current, mobile = false }) => {
    const isActive = current === target;
    return (
        <button
            onClick={onClick}
            className={`${mobile ? 'w-full text-left' : ''} px-3 py-2 rounded-lg text-sm font-medium transition duration-150 ease-in-out ${
                isActive
                    ? 'bg-indigo-800 text-white shadow-inner'
                    : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'
            } flex items-center`}
        >
            {Icon && <Icon size={18} className="mr-2" />}
            {label}
        </button>
    );
};

const Navbar = ({ currentPage, handleNavigate }) => {
    const { isAuthenticated, logout, user, credits, fetchProfile } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdown, setProfileDropdown] = useState(false);
    const profileRef = useRef(null);
    const [couponInput, setCouponInput] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });
    const [showMRUModal, setShowMRUModal] = useState(false);

    // Check if user is from MRU
    const isFromMRU = isMRUUser(user?.email);

    // Clear coupon message after 5 seconds
    useEffect(() => {
        if (couponMessage.text) {
            const timer = setTimeout(() => setCouponMessage({ type: '', text: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [couponMessage]);

    const handleApplyCoupon = async () => {
        const codeToApply = couponInput.trim() || user?.couponCode;
        if (!codeToApply) {
            setCouponMessage({ type: 'error', text: 'Please enter a coupon code' });
            return;
        }
        
        setCouponLoading(true);
        setCouponMessage({ type: '', text: '' });
        
        try {
            const result = await applyCoupon(codeToApply);
            setCouponMessage({ type: 'success', text: result.message });
            setCouponInput('');
            // Refresh user profile to get updated plan status
            if (fetchProfile) {
                await fetchProfile();
            }
        } catch (error) {
            setCouponMessage({ type: 'error', text: error.message || 'Failed to apply coupon' });
        } finally {
            setCouponLoading(false);
        }
    };

    const handleMobileNavigate = (page) => {
        handleNavigate(page);
        setMobileMenuOpen(false);
    };

    // Close profile dropdown when clicking outside or pressing Escape
    useEffect(() => {
        if (!profileDropdown) return;

        const onDocClick = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileDropdown(false);
            }
        };

        const onKeyDown = (e) => {
            if (e.key === 'Escape') setProfileDropdown(false);
        };

        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [profileDropdown]);

    return (
        <header className="bg-indigo-700 shadow-lg sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                <a href="#home" className="text-2xl font-extrabold text-white tracking-wider">
                    SurveyZen
                </a>
                
                {/* Desktop Navigation */}
                <nav className="hidden md:flex space-x-4 items-center">
                    {isAuthenticated ? (
                        <>
                            <NavButton Icon={LayoutDashboard} label="Home" target="home" onClick={() => handleNavigate('home')} current={currentPage} />
                            <NavButton Icon={PenLine} label="Write Blog" target="blog-create" onClick={() => handleNavigate('blog-create')} current={currentPage} />
                            
                            {/* Credits Display */}
                            <div className="flex items-center px-3 py-1.5 bg-indigo-800 rounded-lg">
                                <Coins size={16} className="text-yellow-400 mr-1" />
                                <span className="text-yellow-400 font-semibold text-sm">{credits}</span>
                            </div>

                            {/* MRU Badge */}
                            {isFromMRU && <MRUBadge onClick={() => setShowMRUModal(true)} />}

                            {/* Profile Dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileDropdown(!profileDropdown)}
                                    className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
                                >
                                    <ProfileAvatar user={user} size="sm" />
                                    <span className="hidden lg:inline">{user?.name || 'Profile'}</span>
                                    {user?.isPlanActive && user?.plan && user?.plan !== 'free' && (
                                        <span className={`hidden lg:inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                                            user.plan === 'power' 
                                                ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white'
                                                : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                                        }`}>
                                            <Crown size={10} />
                                            {user.plan === 'power' ? 'POWER' : 'PRO'}
                                        </span>
                                    )}
                                </button>
                                
                                {profileDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                                            <ProfileAvatar user={user} size="md" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                                                    {user?.isPlanActive && user?.plan && user?.plan !== 'free' && (
                                                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ${
                                                            user.plan === 'power' 
                                                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                                                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                                        }`}>
                                                            <Crown size={10} />
                                                            {user.plan.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                        </div>
                                        {/* Plan Status */}
                                        {user?.isPlanActive && user?.plan && user?.plan !== 'free' && user?.planExpiresAt && (
                                            <div className="px-4 py-2 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                                                <div className="flex items-center gap-2">
                                                    <Crown size={14} className="text-amber-600" />
                                                    <span className="text-xs text-amber-700 font-medium">
                                                        Premium until {new Date(user.planExpiresAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {/* MRU Premium Status */}
                                        {isFromMRU && (
                                            <button
                                                onClick={() => { setShowMRUModal(true); setProfileDropdown(false); }}
                                                className="w-full px-4 py-2 border-b border-gray-100 bg-gradient-to-r from-amber-500 to-orange-500   text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap size={24} className="text-white " />
                                                    <span className="text-xs text-white font-bold">Manav Rachna University - Premium Access</span>
                                                </div>
                                            </button>
                                        )}
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">AI Credits</span>
                                                <div className="flex items-center">
                                                    <Coins size={16} className="text-yellow-500 mr-1" />
                                                    <span className="font-bold text-gray-800">{credits}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">20 credits per AI generation</p>
                                        </div>
                                        
                                        {/* Coupon Section */}
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            {/* Display assigned coupon if user has one */}
                                            {user?.couponCode && !user?.couponUsed && (
                                                <div className="mb-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Gift size={14} className="text-green-600" />
                                                        <span className="text-xs font-semibold text-green-700">Your Coupon Code</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-green-200 text-green-800">
                                                            {user.couponCode}
                                                        </code>
                                                        <button
                                                            onClick={() => {
                                                                setCouponInput(user.couponCode);
                                                                handleApplyCoupon();
                                                            }}
                                                            disabled={couponLoading}
                                                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                                                        >
                                                            {couponLoading ? <Loader size={12} className="animate-spin" /> : 'Apply'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Apply coupon input */}
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                                                    <Ticket size={12} />
                                                    Apply Coupon Code
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={couponInput}
                                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                        placeholder="Enter code"
                                                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                    <button
                                                        onClick={handleApplyCoupon}
                                                        disabled={couponLoading || !couponInput.trim()}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {couponLoading ? <Loader size={14} className="animate-spin" /> : 'Apply'}
                                                    </button>
                                                </div>
                                                {couponMessage.text && (
                                                    <p className={`text-xs mt-1 flex items-center gap-1 ${
                                                        couponMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {couponMessage.type === 'success' ? <CheckCircle size={12} /> : null}
                                                        {couponMessage.text}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => { handleNavigate('pricing'); setProfileDropdown(false); }}
                                            className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center"
                                        >
                                            <ShoppingCart size={16} className="mr-2" /> {user?.isPlanActive && user?.plan !== 'free' ? 'Manage Plan' : 'Upgrade to Pro'}
                                        </button>
                                        <button
                                            onClick={() => { logout(); setProfileDropdown(false); }}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                        >
                                            <LogOut size={16} className="mr-2" /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <NavButton label="Login" target="login" onClick={() => handleNavigate('login')} current={currentPage} />
                            <NavButton label="Register" target="register" onClick={() => handleNavigate('register')} current={currentPage} />
                        </>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <button 
                    className="md:hidden text-white p-2 rounded-lg hover:bg-indigo-600 transition"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-indigo-800 border-t border-indigo-600">
                    <div className="px-4 py-3 space-y-2">
                        {isAuthenticated ? (
                            <>
                                {/* MRU Badge - Mobile */}
                                {isFromMRU && (
                                    <button
                                        onClick={() => { setShowMRUModal(true); setMobileMenuOpen(false); }}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg mb-2"
                                    >
                                        <GraduationCap size={16} />
                                        <span className="text-sm font-semibold">Manav Rachna University</span>
                                    </button>
                                )}
                                
                                {/* Credits Display - Mobile */}
                                <div className="flex items-center justify-between px-3 py-2 bg-indigo-900 rounded-lg mb-2">
                                    <span className="text-indigo-300 text-sm">AI Credits</span>
                                    <div className="flex items-center">
                                        <Coins size={16} className="text-yellow-400 mr-1" />
                                        <span className="text-yellow-400 font-bold">{credits}</span>
                                    </div>
                                </div>
                                
                                <NavButton 
                                    Icon={LayoutDashboard} 
                                    label="Home" 
                                    target="home" 
                                    onClick={() => handleMobileNavigate('home')} 
                                    current={currentPage}
                                    mobile
                                />
                                <NavButton 
                                    Icon={PenLine} 
                                    label="Write Blog" 
                                    target="blog-create" 
                                    onClick={() => handleMobileNavigate('blog-create')} 
                                    current={currentPage}
                                    mobile
                                />
                                <button
                                    onClick={() => handleMobileNavigate('pricing')}
                                    className="w-full px-3 py-2 text-left text-sm font-medium text-yellow-400 hover:bg-indigo-700 rounded-lg flex items-center"
                                >
                                    <ShoppingCart size={18} className="mr-2" /> 
                                    {user?.isPlanActive && user?.plan !== 'free' ? 'Manage Plan' : 'Buy Credits'}
                                </button>
                                <div className="pt-2 border-t border-indigo-600">
                                    <div className="flex items-center gap-3 mb-3">
                                        <ProfileAvatar user={user} size="md" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-white text-sm font-medium truncate">{user?.name || 'Creator'}</p>
                                                {user?.isPlanActive && user?.plan && user?.plan !== 'free' && (
                                                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                                                        user.plan === 'power' 
                                                            ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white'
                                                            : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                                                    }`}>
                                                        <Crown size={10} />
                                                        {user.plan === 'power' ? 'POWER' : 'PRO'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-indigo-300 text-xs truncate">{user?.email}</p>
                                            {user?.isPlanActive && user?.plan && user?.plan !== 'free' && user?.planExpiresAt && (
                                                <p className="text-amber-300 text-xs mt-0.5 flex items-center gap-1">
                                                    <Crown size={10} />
                                                    Premium until {new Date(user.planExpiresAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Mobile Coupon Section */}
                                    <div className="mb-3 bg-indigo-900 rounded-lg p-3">
                                        {/* Display assigned coupon if user has one */}
                                        {user?.couponCode && !user?.couponUsed && (
                                            <div className="mb-3 p-2 bg-green-900/30 rounded-lg border border-green-600/30">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Gift size={14} className="text-green-400" />
                                                    <span className="text-xs font-semibold text-green-400">Your Coupon</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm font-mono bg-indigo-800 px-2 py-1 rounded text-green-300">
                                                        {user.couponCode}
                                                    </code>
                                                    <button
                                                        onClick={() => {
                                                            setCouponInput(user.couponCode);
                                                            handleApplyCoupon();
                                                        }}
                                                        disabled={couponLoading}
                                                        className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                                                    >
                                                        {couponLoading ? <Loader size={12} className="animate-spin" /> : 'Apply'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <label className="text-xs text-indigo-300 mb-1 block flex items-center gap-1">
                                            <Ticket size={12} />
                                            Apply Coupon Code
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponInput}
                                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                placeholder="Enter code"
                                                className="flex-1 px-2 py-1.5 text-sm bg-indigo-800 border border-indigo-600 rounded text-white placeholder-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={couponLoading || !couponInput.trim()}
                                                className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {couponLoading ? <Loader size={14} className="animate-spin" /> : 'Apply'}
                                            </button>
                                        </div>
                                        {couponMessage.text && (
                                            <p className={`text-xs mt-1 flex items-center gap-1 ${
                                                couponMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {couponMessage.type === 'success' ? <CheckCircle size={12} /> : null}
                                                {couponMessage.text}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <button
                                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                                        className="w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition flex items-center"
                                    >
                                        <LogOut size={18} className="mr-2" /> Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <NavButton 
                                    label="Login" 
                                    target="login" 
                                    onClick={() => handleMobileNavigate('login')} 
                                    current={currentPage}
                                    mobile
                                />
                                <NavButton 
                                    label="Register" 
                                    target="register" 
                                    onClick={() => handleMobileNavigate('register')} 
                                    current={currentPage}
                                    mobile
                                />
                            </>
                        )}
                    </div>
                </div>
            )}
            
            {/* MRU Premium Modal */}
            <MRUPremiumModal isOpen={showMRUModal} onClose={() => setShowMRUModal(false)} />
        </header>
    );
};

export default Navbar;
