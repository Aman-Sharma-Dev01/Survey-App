import React, { useState } from 'react';
import {
  ClipboardList,
  Share2,
  BarChart2,
  Menu,
  X,
  MousePointerClick,
  CheckCircle2,
  Rocket
} from 'lucide-react';

// --- Navbar Component ---
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#' },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Rocket className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900 ml-2">
              SurveyZen
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="#login"
              className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Log In
            </a>
            <a
              href="#register"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-shadow shadow-sm"
            >
              Sign Up Free
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-600 hover:bg-gray-50 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 space-y-3">
            <a
              href="#register"
              className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-md text-base font-medium hover:bg-indigo-700"
            >
              Sign Up Free
            </a>
            <a
              href="#login"
              className="block w-full text-center text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-base font-medium"
            >
              Log In
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

// --- Hero Component ---
const Hero = () => {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
          Get the feedback
          <span className="block text-indigo-600">you need, instantly.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          Create beautiful, easy-to-use surveys in minutes. Share them with
          anyone and get powerful, real-time analytics.
        </p>
        <div className="mt-10 flex justify-center">
          <a
            href="#register"
            className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-indigo-700 transition-shadow shadow-lg"
          >
            Create Your First Survey
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Free to start &middot; No credit card required
        </p>
      </div>
    </section>
  );
};

// --- Features ---
const Features = () => {
  const featureList = [
    {
      name: 'Intuitive Builder',
      description:
        'Our drag-and-drop builder makes it simple to add questions, apply logic, and match your brand.',
      icon: <ClipboardList className="h-10 w-10 text-indigo-600" />,
    },
    {
      name: 'Share Anywhere',
      description:
        'Get a simple link to share your survey via email, social media, or embed it directly on your website.',
      icon: <Share2 className="h-10 w-10 text-indigo-600" />,
    },
    {
      name: 'Real-time Analytics',
      description:
        'Watch responses roll in live. Our dashboard visualizes your data with clean charts and graphs.',
      icon: <BarChart2 className="h-10 w-10 text-indigo-600" />,
    },
  ];

  return (
    <section id="features" className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Everything you need to get answers
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From creation to analysis, we’ve got you covered.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
          {featureList.map((feature) => (
            <div key={feature.name} className="text-center">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 text-indigo-600 mx-auto">
                {feature.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900">
                {feature.name}
              </h3>
              <p className="mt-2 text-base text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- How It Works ---
const HowItWorks = () => {
  const steps = [
    {
      name: '1. Create',
      description: 'Build your survey with our easy-to-use editor.',
      icon: <MousePointerClick className="h-8 w-8 text-indigo-600" />,
    },
    {
      name: '2. Share',
      description: 'Send your survey link to your audience on any platform.',
      icon: <Share2 className="h-8 w-8 text-indigo-600" />,
    },
    {
      name: '3. Analyze',
      description: 'Review your results in our real-time dashboard.',
      icon: <CheckCircle2 className="h-8 w-8 text-indigo-600" />,
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Get started in 3 simple steps
          </h2>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, index) => (
            <div key={step.name} className="relative">
              {index < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gray-200 -translate-x-0"
                  style={{
                    width: 'calc(100% - 2.5rem)',
                    left: 'calc(50% + 1.25rem)',
                  }}
                />
              )}
              <div className="relative flex flex-col items-center text-center p-6 bg-white rounded-lg">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto ring-8 ring-white">
                  {step.icon}
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">
                  {step.name}
                </h3>
                <p className="mt-2 text-base text-gray-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Final CTA ---
const FinalCTA = () => {
  return (
    <section className="bg-indigo-600">
      <div className="max-w-4xl mx-auto text-center py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Ready to get answers?
        </h2>
        <p className="mt-4 text-lg text-indigo-100">
          Join thousands of others getting the insights they need.
        </p>
        <a
          href="#register"
          className="mt-8 w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
        >
          Sign Up for Free
        </a>
      </div>
    </section>
  );
};

// --- Footer Component (Updated) ---
const Footer = () => {
  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'Integrations', href: '#' },
        { name: 'Examples', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#about' }, // ⭐ FIXED
        { name: 'Careers', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Contact', href: '#contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Help Center', href: '#' },
        { name: 'Templates', href: '#' },
        { name: 'Security', href: '#' },
        { name: 'Webinars', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#privacy' },
        { name: 'Terms of Service', href: '#terms' },
        { name: 'Cookie Policy', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-base hover:text-white">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-base">
            &copy; {new Date().getFullYear()} SurveyZen. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// --- Main Landing Page ---
export default function LandingPage({ navigate }) {
  return (
    <div className="antialiased text-gray-800 bg-white">
      <Navbar navigate={navigate} />
      <main>
        <Hero navigate={navigate} />
        <Features />
        <HowItWorks />
        <FinalCTA navigate={navigate} />
      </main>
      <Footer />
    </div>
  );
}
