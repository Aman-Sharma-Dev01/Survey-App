import React from 'react';
import { LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NavButton = ({ Icon, label, target, onClick, current }) => {
    const isActive = current === target;
    return (
        <button
            onClick={onClick}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition duration-150 ease-in-out ${
                isActive
                    ? 'bg-indigo-800 text-white shadow-inner'
                    : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'
            } flex items-center`}
        >
            {Icon && <Icon size={18} className="mr-1" />}
            {label}
        </button>
    );
};

const Navbar = ({ currentPage, handleNavigate }) => {
    const { isAuthenticated, logout, user } = useAuth();
    return (
        <header className="bg-indigo-700 shadow-lg sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                <a href="#dashboard" className="text-2xl font-extrabold text-white tracking-wider">
                    SurveyZen
                </a>
                <nav className="hidden sm:flex space-x-4 items-center">
                    {isAuthenticated ? (
                        <>
                            <NavButton Icon={LayoutDashboard} label="Dashboard" target="dashboard" onClick={() => handleNavigate('dashboard')} current={currentPage} />
                            <NavButton Icon={PlusCircle} label="Create" target="create" onClick={() => handleNavigate('create')} current={currentPage} />
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
                <div className="sm:hidden">
                    {/* Placeholder for mobile menu dropdown, omitted for brevity */}
                    <p className="text-white">Menu</p>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
