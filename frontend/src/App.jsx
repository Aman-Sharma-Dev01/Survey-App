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

// ⭐ Coding Test (JS-only, browser)
import CodingTest from './pages/CodingTest.jsx';

// ⭐ Quiz Pages
import QuizCreate from './pages/QuizCreate.jsx';
import QuizDashboard from './pages/QuizDashboard.jsx';
import QuizTake from './pages/QuizTake.jsx';
import QuizAnalytics from './pages/QuizAnalytics.jsx';
import QuizEdit from './pages/QuizEdit.jsx';
import QueuedSubmissionsPage from './pages/QueuedSubmissionsPage.jsx';

// ⭐ Payment Admin
import PaymentAdmin from './pages/PaymentAdmin.jsx';
import PaymentHistory from './pages/PaymentHistory.jsx';
import PlanAdmin from './pages/PlanAdmin.jsx';

// ⭐ Admin Dashboard
import AdminDashboard from './pages/AdminDashboard.jsx';

// ⭐ Certificate Verification
import CertificateVerify from './pages/CertificateVerify.jsx';
import CertificateAdmin from './pages/CertificateAdmin.jsx';

// ⭐ Offer Admin
import OfferAdmin from './pages/OfferAdmin.jsx';

// ⭐ Contact Admin
import ContactAdmin from './pages/ContactAdmin.jsx';

// ⭐ Home Page - Feature Hub
import HomePage from './pages/HomePage.jsx';

// ⭐ Coding Tests
import CodingTestDashboard from './pages/CodingTestDashboard.jsx';
import CodingTestCreate from './pages/CodingTestCreate.jsx';
import CodingTestTake from './pages/CodingTestTake.jsx';
import CodingTestAnalytics from './pages/CodingTestAnalytics.jsx';

// Admin email
const ADMIN_EMAIL = 'support@surveyzen.live';

// === Components ===
import Navbar from './components/Navbar';
import OfflineBanner from './components/OfflineBanner';

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
    const protectedPaths = ['home', 'dashboard', 'create', 'analysis', 'quiz-dashboard', 'quiz-create', 'quiz-edit', 'quiz-analytics', 'coding-dashboard', 'coding-create', 'coding-analytics', 'payment-admin', 'payment-history', 'certificate-admin', 'plan-admin', 'admin-dashboard', 'offer-admin', 'contact-admin'];
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
    'quiz', // Public quiz taking page
    'verify-certificate', // Public certificate verification page
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

      case 'home':
        return <HomePage navigate={navigate} />;

      case 'coding-test':
        return <CodingTest navigate={navigate} />;

      case 'dashboard':
        return <Dashboard navigate={navigate} />;


            case 'pricing':
        return <PricingPage navigate={navigate} />;

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

      // ⭐ Quiz Routes
      case 'quiz-dashboard':
        return <QuizDashboard navigate={navigate} />;

      case 'quiz-create':
        return <QuizCreate navigate={navigate} />;

      case 'quiz-edit':
        return pathId ? (
          <QuizEdit quizId={pathId} navigate={navigate} />
        ) : (
          <QuizDashboard navigate={navigate} />
        );

      case 'quiz-analytics':
        return pathId ? (
          <QuizAnalytics quizId={pathId} navigate={navigate} />
        ) : (
          <QuizDashboard navigate={navigate} />
        );

      case 'coding-dashboard':
        return <CodingTestDashboard navigate={navigate} />;

      case 'coding-create':
        return <CodingTestCreate navigate={navigate} />;

      case 'coding-analytics':
        return pathId ? (
          <CodingTestAnalytics codingTestId={pathId} navigate={navigate} />
        ) : (
          <CodingTestDashboard navigate={navigate} />
        );

      case 'quiz':
        return pathId ? (
          <QuizTake quizId={pathId} />
        ) : (
          <div className="text-center p-10 mt-20">
            <h1 className="text-2xl font-bold text-gray-800">Quiz</h1>
            <p className="text-gray-500">Please use a valid quiz link to participate.</p>
          </div>
        );

      case 'coding':
        return pathId ? (
          <CodingTestTake codingTestId={pathId} />
        ) : (
          <div className="text-center p-10 mt-20">
            <h1 className="text-2xl font-bold text-gray-800">Coding Test</h1>
            <p className="text-gray-500">Please use a valid coding test link to participate.</p>
          </div>
        );

      case 'queued-submissions':
        return <QueuedSubmissionsPage navigate={navigate} />;

      // ⭐ Payment Admin (only for you)
      case 'payment-admin':
        return <PaymentAdmin onBack={() => navigate('admin-dashboard')} navigate={navigate} />;

      case 'payment-history':
        return <PaymentHistory onBack={() => navigate('admin-dashboard')} navigate={navigate} />;

      // ⭐ Plan Admin (manually grant premium plans)
      case 'plan-admin':
        return <PlanAdmin onBack={() => navigate('admin-dashboard')} />;

      // ⭐ Admin Dashboard (admin only)
      case 'admin-dashboard':
        return <AdminDashboard navigate={navigate} />;

      // ⭐ Certificate Verification (Public route for QR scanning)
      case 'verify-certificate':
        return pathId ? (
          <CertificateVerify certificateId={pathId} navigate={navigate} />
        ) : (
          <div className="text-center p-10 mt-20">
            <h1 className="text-2xl font-bold text-gray-800">🎓 Certificate Verification</h1>
            <p className="text-gray-500">Please use a valid certificate link or scan the QR code on your certificate.</p>
          </div>
        );

      // ⭐ Certificate Admin (Admin only)
      case 'certificate-admin':
        return <CertificateAdmin navigate={navigate} />;

      // ⭐ Offer Admin (Admin only)
      case 'offer-admin':
        return <OfferAdmin navigate={navigate} />;

      // ⭐ Contact Admin (Admin only - view contact form submissions)
      case 'contact-admin':
        return <ContactAdmin navigate={navigate} />;

      default:
        return <LandingPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans w-full overflow-x-hidden">
      {/* Offline Banner - shows when user is offline */}
      <OfflineBanner />
      
      {/* Show navbar on internal pages only */}
      {shouldShowNavbar && (
        <Navbar currentPage={pathRoot} handleNavigate={navigate} />
      )}

      <main className="w-full">{renderPage()}</main>
    </div>
  );
};

const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default RootApp;
