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
import ContactPage from './components/ContactPage.jsx';
import PricingPage from './components/PricingPage.jsx';

// ⭐ New Pages
import VerifyPage from './pages/VerifyPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';

// ⭐ NEW — Public Share Results Page
import ShareResultsPage from './pages/ShareResultsPage.jsx';

// === Components ===
import Navbar from './components/Navbar';

// Helper for navigation (hash routing)
const navigate = (path) => {
  const cleaned = String(path).replace(/^#/, '');
  window.location.hash = cleaned;
};

const App = () => {
  const [currentPath, setCurrentPath] = useState(
    window.location.hash.slice(1) || '/'
  );

  const authState = useAuth();

  const getPathSegments = (rawPath) => {
    const cleaned = String(rawPath || '/').replace(/^\/+|\/+$/g, '');
    return cleaned === '' ? [''] : cleaned.split('/');
  };

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () =>
      window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Protect private pages
  useEffect(() => {
    const protectedPaths = ['dashboard', 'create', 'analysis'];
    const [pathSegment] = getPathSegments(currentPath);

    if (protectedPaths.includes(pathSegment) && !authState.isAuthenticated) {
      navigate('login');
    }
  }, [currentPath, authState.isAuthenticated]);

  const [pathRoot, pathId] = getPathSegments(currentPath);

  // ▢ Pages where navbar should NOT show
  const landingRoutes = [
    '',
    'login',
    'register',
    'verify',
    'forgot-password',
    'reset-password',
    'features',
    'pricing',
    'how-it-works',
    'contact',
    'respond',
    'share',  
    'about',
    'blog',

  ];

  const shouldShowNavbar = !landingRoutes.includes(pathRoot);

  // Router logic
  const renderPage = () => {
    switch (pathRoot) {
      case '':
        return <LandingPage navigate={navigate} />;

      case 'login':
        return <Login navigate={navigate} />;

      case 'register':
        return <Register navigate={navigate} />;

      case 'verify':
        return <VerifyPage navigate={navigate} />;

      case 'forgot-password':
        return <ForgotPasswordPage navigate={navigate} />;

      case 'reset-password':
        return <ResetPasswordPage navigate={navigate} />;

      case 'about':
        return <AboutUs navigate={navigate} />;

 case 'contact':
        return <ContactPage navigate={navigate} />;


      case 'blog':
        return pathId
          ? <BlogPage slug={pathId} navigate={navigate} />
          : <BlogPage navigate={navigate} />;

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

      // ⭐ NEW — Public shareable survey results
      case 'share':
  return <ShareResultsPage surveyId={pathId} />;


      default:
        return <LandingPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Show navbar on internal pages only */}
      {shouldShowNavbar && (
        <Navbar currentPage={pathRoot} handleNavigate={navigate} />
      )}

      <main>{renderPage()}</main>
    </div>
  );
};

const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default RootApp;
