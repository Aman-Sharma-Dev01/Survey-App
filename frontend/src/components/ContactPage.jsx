import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  MapPin,
  Send,
  CheckCircle,
  HelpCircle,
  Menu,
  X,
  Rocket,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { BASE_URL } from '../services/api';

// ================= NAVBAR =================
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'How it Works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Blog', href: '/blog' }, // ⭐ Added
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
            <a href="/contact" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
              Contact
            </a>
             <a href="/login" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
              Log In
            </a>
            
            <a href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
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
            <a href="/register" className="block text-center bg-indigo-600 text-white px-4 py-2 rounded-md text-base hover:bg-indigo-700">
              Sign Up Free
            </a>
            <a href="/login" className="block text-center text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-base">
              Log In
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

// ================= FOOTER =================
const Footer = () => {
  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '/features' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Integrations', href: '/' },
        { name: 'Examples', href: '/' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Help Center', href: '/' },
        { name: 'Templates', href: '/' },
        { name: 'Security', href: '/' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/' },
        { name: 'Terms of Service', href: '/' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Links Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-300 uppercase">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="hover:text-white transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Badges Section - Centered and Side by Side */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
          {/* DMCA Badge */}
          <a
            href="//www.dmca.com/Protection/Status.aspx?ID=3b429a82-a1ac-45e2-8d4e-29804753a560"
            title="DMCA.com Protection Status"
            className="dmca-badge hover:opacity-80  transition-opacity"
          >
            <img
              src="https://images.dmca.com/Badges/DMCA_badge_trn_60w.png?ID=3b429a82-a1ac-45e2-8d4e-29804753a560"
              alt="DMCA.com Protection Status"
            />
          </a>
          
          {/* Note: Script tags inside JSX can be tricky. If this doesn't load, move it to your index.html or useEffect */}
          <script src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js"></script>

          {/* Product Hunt Badge */}
          <a
            href="https://www.producthunt.com/products/surveyzen?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-surveyzen"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1041372&theme=light&t=1763890037404"
              alt="SurveyZen - The minimalist survey builder for modern creators. | Product Hunt"
              style={{ width: '210px', height: '99px' }}
              width="100"
              height="99"
            />
          </a>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-gray-700 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} SurveyZen. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// ================= CONTACT FORM COMPONENT =================
const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // ---------------------------------------------------------
      // REAL BACKEND CONNECTION
      // Ensure your Node.js backend is running on port 5000
      // ---------------------------------------------------------
      const response = await fetch(`${BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        console.log('Success:', data);
      } else {
        setStatus('error');
        console.error('Server Error:', data);
      }
    } catch (error) {
      console.error('Network Error:', error);
      // For demonstration purposes in the preview, we might fail here because 
      // there is no localhost:5000 running in this browser environment.
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Message Sent!</h3>
        <p className="text-gray-600 mt-2 max-w-sm">
          Thank you for reaching out. Our team will get back to you at <strong>{formData.email}</strong> shortly.
        </p>
        <button 
          onClick={() => { setStatus('idle'); setFormData({...formData, message: ''}); }}
          className="mt-8 text-indigo-600 font-medium hover:text-indigo-800"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h3>
      
      {status === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
           <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
           <div className="text-sm text-red-700">
             <p className="font-semibold">Message failed to send.</p>
             <p>Please ensure your backend server is running on port 5000.</p>
           </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              id="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="john@company.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <div className="relative">
            <select
              name="subject"
              id="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white transition-all"
            >
              <option>General Inquiry</option>
              <option>Technical Support</option>
              <option>Billing & Enterprise</option>
              <option>Partnership</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            name="message"
            id="message"
            rows={4}
            required
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
            placeholder="How can we help you today?"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? (
            <span>Sending...</span>
          ) : (
            <>
              <span>Send Message</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// ================= FAQ SECTION =================
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button 
        className="w-full py-4 flex justify-between items-center text-left focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-900 font-medium group-hover:text-indigo-600 transition-colors">{question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        <p className="text-gray-600 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

// ================= MAIN CONTACT PAGE =================
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow">
        {/* Header Section */}
        <div className="bg-indigo-900 text-white py-20 px-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
             </svg>
          </div>
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Get in touch</h1>
            <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto">
              Have questions about our pricing, features, or need support? We're here to help you get the answers you need.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Contact Info & FAQ */}
            <div className="space-y-8">
              {/* Contact Cards */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Us</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-2">For general inquiries and support.</p>
                    <a href="mailto:contact@surveyzen.live" className="text-indigo-600 font-medium hover:underline">
                      contact@surveyzen.live
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Live Chat</h3>
                    <p className="text-sm text-gray-500 mt-1">Available Mon-Fri, 9am - 5pm EST.</p>
                  </div>
                </div>
              </div>

               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Global HQ</h3>
                    <p className="text-sm text-gray-500 mt-1">Fully Remote Team</p>
                  </div>
                </div>
              </div>

              {/* FAQ Mini Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900">Frequently Asked</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  <FAQItem 
                    question="Is there a free trial?" 
                    answer="Yes! SurveyZen offers a generous free tier forever, with no credit card required to start." 
                  />
                   <FAQItem 
                    question="How do I cancel?" 
                    answer="You can cancel your subscription anytime directly from your dashboard settings." 
                  />
                   <FAQItem 
                    question="Do you offer enterprise APIs?" 
                    answer="Yes, our Enterprise plan includes full API access. Contact sales for documentation." 
                  />
                </div>
              </div>
            </div>

            {/* Right Column: The Form */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}