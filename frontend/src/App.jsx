import React, { useState, useEffect } from 'react';

// === Context ===
// Import the AuthProvider to wrap the entire application
import { AuthProvider, useAuth } from './context/AuthContext.jsx'; 

// === Pages Imports ===
// These represent the main views of your application
import Dashboard from './pages/Dashboard';
import SurveyCreate from './pages/SurveyCreate';
import Analysis from './pages/Analysis';
import SurveyRespond from './pages/SurveyRespond';
import Login from './pages/Login';
import Register from './pages/Register';

// === Component Imports ===
import Navbar from './components/Navbar';

// Helper for navigation
const navigate = (path) => {
    window.location.hash = path;
};

// --- The Core Routing Component ---
const App = () => {
    // Uses hash-based routing (e.g., #dashboard, #login)
    const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || 'dashboard');
    // Grab the full auth context object (user, token, isAuthenticated, login, logout, isLoading)
    const authState = useAuth();

    // 1. Setup Hash Change Listener
    useEffect(() => {
        const handleHashChange = () => {
            setCurrentPath(window.location.hash.slice(1) || 'dashboard');
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial path check

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // 2. Authentication Guard
    // Redirects unauthenticated users away from protected routes.
    useEffect(() => {
        const protectedPaths = ['dashboard', 'create', 'analysis'];
        // Split path to handle IDs (e.g., 'analysis/123' -> 'analysis')
        const path = currentPath.split('/')[0];

        if (protectedPaths.includes(path) && !authState.isAuthenticated) {
            navigate('login');
        }
    }, [currentPath, authState.isAuthenticated]);

    // 3. Page Renderer
    const renderPage = () => {
        const [path, id] = currentPath.split('/');

        switch (path) {
            case 'login':
                return <Login navigate={navigate} />;
            case 'register':
                return <Register navigate={navigate} />;
            case 'dashboard':
                // Protected page - Guard handles unauth access
                return <Dashboard navigate={navigate} />;
            case 'create':
                // Protected page
                return <SurveyCreate navigate={navigate} />;
            case 'analysis':
                // Protected page, requires survey ID
                return id ? <Analysis surveyId={id} /> : <Dashboard navigate={navigate} />;
            case 'respond':
                // Public page, requires survey ID
                return id ? <SurveyRespond surveyId={id} /> : (
                    <div className="text-center p-10 mt-20">
                        <h1 className="text-2xl font-bold text-gray-800">Public Survey Entry</h1>
                        <p className="text-gray-500">Please use a valid survey link to respond.</p>
                    </div>
                );
            default:
                // Default route based on auth status
                return authState.isAuthenticated ? <Dashboard navigate={navigate} /> : <Login navigate={navigate} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar currentPage={currentPath.split('/')[0]} handleNavigate={navigate} />
            <main>
                {renderPage()}
            </main>
        </div>
    );
};

// --- Root Application Wrapper ---
// This ensures that AuthProvider is at the highest level, making the context available to App.
const RootApp = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default RootApp;
