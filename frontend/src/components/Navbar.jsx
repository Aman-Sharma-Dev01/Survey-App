import React, { useState } from 'react';
import { LogOut, PlusCircle, LayoutDashboard, HelpCircle, Menu, X } from 'lucide-react';
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
    const { isAuthenticated, logout, user } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                            <div className="text-white text-sm opacity-75 hidden lg:block">Welcome, {user?.emails || 'Creator'}</div>
                            <button
                                onClick={logout}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition duration-150 flex items-center shadow-md"
                            >
                                <LogOut size={18} className="mr-1" /> Logout
                            </button>
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
                                <div className="pt-2 border-t border-indigo-600">
                                    <p className="text-indigo-300 text-sm mb-2">Welcome, {user?.emails || 'Creator'}</p>
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
