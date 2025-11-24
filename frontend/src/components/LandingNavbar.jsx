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


const LandingNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Blog', href: '#blog' }, // ⭐ Added
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center cursor-pointer">
            <Rocket className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900 ml-2">
              SurveyZen
            </span>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <a href="#contact" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
              Contact
            </a>
             <a href="#login" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
              Log In
            </a>
            
            <a href="#register" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
              Sign Up Free
            </a>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-600 hover:bg-gray-50 hover:text-indigo-600 block px-3 py-2 rounded-md text-base"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-gray-200 space-y-3">
            <a href="#register" className="block text-center bg-indigo-600 text-white px-4 py-2 rounded-md text-base hover:bg-indigo-700">
              Sign Up Free
            </a>
            <a href="#login" className="block text-center text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-base">
              Log In
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
export default LandingNavbar;