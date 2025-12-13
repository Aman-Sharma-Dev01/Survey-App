import React, { useState } from 'react';
import { LogOut, PlusCircle, LayoutDashboard, HelpCircle, Menu, X, Coins, User, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

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
    const { isAuthenticated, logout, user, credits } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdown, setProfileDropdown] = useState(false);

    const handleMobileNavigate = (page) => {
        handleNavigate(page);
        setMobileMenuOpen(false);
    };

    return (
        <header className="bg-indigo-700 shadow-lg sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                <a href="#dashboard" className="text-2xl font-extrabold text-white tracking-wider">
                    SurveyZen
                </a>
                
                {/* Desktop Navigation */}
                <nav className="hidden md:flex space-x-4 items-center">
                    {isAuthenticated ? (
                        <>
                            <NavButton Icon={LayoutDashboard} label="Surveys" target="dashboard" onClick={() => handleNavigate('dashboard')} current={currentPage} />
                            <NavButton Icon={PlusCircle} label="Create Survey" target="create" onClick={() => handleNavigate('create')} current={currentPage} />
                            <NavButton Icon={HelpCircle} label="Quizzes" target="quiz-dashboard" onClick={() => handleNavigate('quiz-dashboard')} current={currentPage} />
                            
                            {/* Credits Display */}
                            <div className="flex items-center px-3 py-1.5 bg-indigo-800 rounded-lg">
                                <Coins size={16} className="text-yellow-400 mr-1" />
                                <span className="text-yellow-400 font-semibold text-sm">{credits}</span>
                            </div>

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setProfileDropdown(!profileDropdown)}
                                    className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
                                >
                                    <User size={18} className="mr-1" />
                                    <span className="hidden lg:inline">{user?.name || 'Profile'}</span>
                                </button>
                                
                                {profileDropdown && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                        </div>
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
                                        <button
                                            onClick={() => { handleNavigate('pricing'); setProfileDropdown(false); }}
                                            className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center"
                                        >
                                            <ShoppingCart size={16} className="mr-2" /> Buy Credits
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
                                    label="Surveys" 
                                    target="dashboard" 
                                    onClick={() => handleMobileNavigate('dashboard')} 
                                    current={currentPage}
                                    mobile
                                />
                                <NavButton 
                                    Icon={PlusCircle} 
                                    label="Create Survey" 
                                    target="create" 
                                    onClick={() => handleMobileNavigate('create')} 
                                    current={currentPage}
                                    mobile
                                />
                                <NavButton 
                                    Icon={HelpCircle} 
                                    label="Quizzes" 
                                    target="quiz-dashboard" 
                                    onClick={() => handleMobileNavigate('quiz-dashboard')} 
                                    current={currentPage}
                                    mobile
                                />
                                <button
                                    onClick={() => handleMobileNavigate('pricing')}
                                    className="w-full px-3 py-2 text-left text-sm font-medium text-yellow-400 hover:bg-indigo-700 rounded-lg flex items-center"
                                >
                                    <ShoppingCart size={18} className="mr-2" /> Buy Credits
                                </button>
                                <div className="pt-2 border-t border-indigo-600">
                                    <p className="text-indigo-300 text-sm mb-2">Welcome, {user?.name || 'Creator'}</p>
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
        </header>
    );
};

export default Navbar;
