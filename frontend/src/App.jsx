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
import AboutUs from './components/AboutUs.jsx';
import BlogPage from './components/BlogPage.jsx';


// === Component Imports ===
import Navbar from './components/Navbar';

// Helper for navigation (uses hash routing)
const navigate = (path) => {
  const cleaned = String(path).replace(/^#/, '');
  window.location.hash = cleaned;
};

// --- The Core Routing Component ---
const App = () => {
  const [currentPath, setCurrentPath] = useState(
    window.location.hash.slice(1) || '/'
  );

  const authState = useAuth();

  // Normalize path segments
  const getPathSegments = (rawPath) => {
    const cleaned = String(rawPath || '/').replace(/^\/+|\/+$/g, '');
    return cleaned === '' ? [''] : cleaned.split('/');
  };

  // 1. Setup Hash Change Listener
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
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

  // 3. Navbar visibility handling
  const landingRoutes = [
    '',
    'login',
    'register',
    'features',
    'pricing',
    'how-it-works',
    'contact',
    'respond'
  ];

  const [pathRoot, pathId] = getPathSegments(currentPath);

  const shouldShowNavbar = !landingRoutes.includes(pathRoot);

  // 4. Page Renderer
  const renderPage = () => {
    switch (pathRoot) {
      case '':
        return <LandingPage navigate={navigate} />;

      case 'login':
        return <Login navigate={navigate} />;

      case 'register':
        return <Register navigate={navigate} />;

      case 'about':
        return <AboutUs navigate={navigate} />;

      case 'blog':                      // ⭐ FULL BLOG ROUTE
        return pathId
          ? <BlogPage slug={pathId} navigate={navigate} />   // blog post view
          : <BlogPage navigate={navigate} />;                // blog list view

      case 'dashboard':
        return <Dashboard navigate={navigate} />;

      case 'create':
        return <SurveyCreate navigate={navigate} />;

      case 'analysis':
        return pathId ? (
          <Analysis surveyId={pathId} />
        ) : (
          <Dashboard navigate={navigate} />
        );

      case 'respond':
        return pathId ? (
          <SurveyRespond surveyId={pathId} />
        ) : (
          <div className="text-center p-10 mt-20">
            <h1 className="text-2xl font-bold text-gray-800">Public Survey Entry</h1>
            <p className="text-gray-500">Please use a valid survey link to respond.</p>
          </div>
        );

      default:
        return <LandingPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar only on non-landing pages */}
      {shouldShowNavbar && (
        <Navbar currentPage={pathRoot} handleNavigate={navigate} />
      )}

      <main>{renderPage()}</main>
    </div>
  );
};

// --- Wrapper ---
const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default RootApp;
