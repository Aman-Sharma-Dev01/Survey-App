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
import LandingPage from './components/LandingPage'; 

// === Component Imports ===
import Navbar from './components/Navbar';

// Helper for navigation
const navigate = (path) => {
    window.location.hash = path;
};

// --- The Core Routing Component ---
const App = () => {
    // Default path is '/'
    const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');
    const authState = useAuth();

    // 1. Setup Hash Change Listener
    useEffect(() => {
        const handleHashChange = () => {
            setCurrentPath(window.location.hash.slice(1) || '/');
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial path check

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // 2. Authentication Guard
    useEffect(() => {
        const protectedPaths = ['dashboard', 'create', 'analysis'];
        const path = currentPath.split('/')[0];

        if (protectedPaths.includes(path) && !authState.isAuthenticated) {
            navigate('login');
        }
    }, [currentPath, authState.isAuthenticated]);

    // 3. Page Renderer
    const renderPage = () => {
        const [path, id] = currentPath.split('/');

        switch (path) {
            case '/':
                return <LandingPage navigate={navigate} />;
            case 'login':
                return <Login navigate={navigate} />;
            case 'register':
                return <Register navigate={navigate} />;
            case 'dashboard':
                return <Dashboard navigate={navigate} />;
            case 'create':
                return <SurveyCreate navigate={navigate} />;
            case 'analysis':
                return id ? <Analysis surveyId={id} /> : <Dashboard navigate={navigate} />;
            case 'respond':
                return id ? <SurveyRespond surveyId={id} /> : (
                    <div className="text-center p-10 mt-20">
                        <h1 className="text-2xl font-bold text-gray-800">Public Survey Entry</h1>
                        <p className="text-gray-500">Please use a valid survey link to respond.</p>
                    </div>
                );
            default:
                // Default for any unknown route is to go to the LandingPage
                return <LandingPage navigate={navigate} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* CHANGED: Conditionally render the Navbar.
              It will only show if the currentPath is NOT '/'
            */}
            {currentPath !== '/' && <Navbar currentPage={currentPath.split('/')[0]} handleNavigate={navigate} />}
            <main>
                {renderPage()}
            </main>
        </div>
    );
};

// --- Root Application Wrapper ---
const RootApp = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default RootApp;