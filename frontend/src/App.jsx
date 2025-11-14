import React, { useState, useEffect } from 'react';

// === Context ===
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// === Pages Imports ===
import Dashboard from './pages/Dashboard';
import SurveyCreate from './pages/SurveyCreate';
import Analysis from './pages/Analysis';
import SurveyRespond from './pages/SurveyRespond';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './components/LandingPage';

// === Component Imports ===
import Navbar from './components/Navbar';

// Helper for navigation (uses hash routing)
const navigate = (path) => {
  // ensure path doesn't accidentally have a leading '#'
  const cleaned = String(path).replace(/^#/, '');
  window.location.hash = cleaned;
};

// --- The Core Routing Component ---
const App = () => {
  // Default path is '/' if hash is empty
  const [currentPath, setCurrentPath] = useState(
    window.location.hash.slice(1) || '/'
  );
  const authState = useAuth();

  // Normalize path helper: removes leading/trailing slashes and returns segments
  const getPathSegments = (rawPath) => {
    // rawPath may be like '/' or 'login' or '/dashboard/123'
    const cleaned = String(rawPath || '/').replace(/^\/+|\/+$/g, ''); // removes leading/trailing slashes
    // if cleaned is empty string, represent as '' (landing root)
    return cleaned === '' ? [''] : cleaned.split('/');
  };

  // 1. Setup Hash Change Listener
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial check
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 2. Authentication Guard
  useEffect(() => {
    const protectedPaths = ['dashboard', 'create', 'analysis'];
    const [pathSegment] = getPathSegments(currentPath);
    if (protectedPaths.includes(pathSegment) && !authState.isAuthenticated) {
      navigate('login');
    }
  }, [currentPath, authState.isAuthenticated]);

  // 3. Decide when to show Navbar
  // These routes are considered part of the landing-page experience and will hide the Navbar
  const landingRoutes = [
    '', // root '/'
    'login',
    'register',
    'features',
    'pricing',
    'how-it-works',
    'about',
    'contact'
  ];

  const [pathRoot, pathId] = getPathSegments(currentPath);

  const shouldShowNavbar = !landingRoutes.includes(pathRoot);

  // 4. Page Renderer
  const renderPage = () => {
    switch (pathRoot) {
      // landing root (/) -> LandingPage
      case '':
        // pass subpage/navigation info to LandingPage if you want it to scroll to sections
        return <LandingPage navigate={navigate} />;
      case 'login':
        // If login is also a landing sub-section, we still render Login component,
        // but navbar remains hidden (because 'login' is in landingRoutes)
        return <Login navigate={navigate} />;
      case 'register':
        return <Register navigate={navigate} />;
      case 'dashboard':
        return <Dashboard navigate={navigate} />;
      case 'create':
        return <SurveyCreate navigate={navigate} />;
      case 'analysis':
        // support '/analysis/:surveyId'
        return pathId ? <Analysis surveyId={pathId} /> : <Dashboard navigate={navigate} />;
      case 'respond':
        // support '/respond/:surveyId'
        return pathId ? (
          <SurveyRespond surveyId={pathId} />
        ) : (
          <div className="text-center p-10 mt-20">
            <h1 className="text-2xl font-bold text-gray-800">Public Survey Entry</h1>
            <p className="text-gray-500">Please use a valid survey link to respond.</p>
          </div>
        );
      // add additional routes here as needed
      default:
        // fallback: treat unknown routes as landing (or you can create a 404)
        return <LandingPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Conditionally render the Navbar: hidden on landing-related routes */}
      {shouldShowNavbar && (
        <Navbar currentPage={pathRoot} handleNavigate={navigate} />
      )}

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
