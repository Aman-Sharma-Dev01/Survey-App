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

import { blogPostsMeta } from "./BlogPage.jsx"; // ⭐ NEW IMPORT

// ================= NAVBAR =================
const Navbar = () => {
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

// ================= HERO =================
const Hero = () => (
  <section className="bg-white">
    <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900">
        Get the feedback
        <span className="block text-indigo-600">you need, instantly.</span>
      </h1>

      <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
        Create beautiful, easy-to-use surveys in minutes. Share them instantly and analyze results in real time.
      </p>

      <div className="mt-10 flex justify-center">
        <a href="#register" className="bg-indigo-600 text-white px-8 py-3 rounded-md text-lg hover:bg-indigo-700 shadow-lg">
          Create Your First Survey
        </a>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Free to start &middot; No credit card required
      </p>
    </div>
  </section>
);

// ================= FEATURES =================
const Features = () => {
  const featureList = [
    { name: 'Intuitive Builder', icon: <ClipboardList className="h-10 w-10 text-indigo-600" />, description: 'Drag and drop simplicity with advanced logic options.' },
    { name: 'Share Anywhere', icon: <Share2 className="h-10 w-10 text-indigo-600" />, description: 'Distribute surveys through links, email, social media, or embeds.' },
    { name: 'Real-time Analytics', icon: <BarChart2 className="h-10 w-10 text-indigo-600" />, description: 'Get instant insights with beautiful visual reports.' },
  ];

  return (
    <section id="features" className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Everything you need to get answers</h2>
        <p className="mt-4 text-lg text-gray-600">From survey creation to deep insights — all in one tool.</p>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
          {featureList.map((f) => (
            <div key={f.name} className="text-center">
              <div className="h-20 w-20 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold">{f.name}</h3>
              <p className="mt-2 text-gray-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ================= HOW IT WORKS =================
const HowItWorks = () => {
  const steps = [
    { name: '1. Create', icon: <MousePointerClick className="h-8 w-8 text-indigo-600" />, description: 'Build your survey with our intuitive editor.' },
    { name: '2. Share', icon: <Share2 className="h-8 w-8 text-indigo-600" />, description: 'Share the link anywhere or embed it on your site.' },
    { name: '3. Analyze', icon: <CheckCircle2 className="h-8 w-8 text-indigo-600" />, description: 'Track responses and insights in real-time.' },
  ];

  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Get started in 3 simple steps</h2>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.name} className="p-6 bg-white rounded-lg shadow-sm">
              <div className="h-16 w-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center ring-8 ring-white">
                {step.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold">{step.name}</h3>
              <p className="mt-2 text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ================= LATEST BLOG POSTS (NEW) =================
const LatestBlogPosts = () => {
  const latest = [...blogPostsMeta]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Latest From Our Blog</h2>
          <p className="mt-2 text-gray-600 text-lg">
            Insights on surveys, research, and customer experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {latest.map((post) => (
            <article key={post.slug} className="bg-white p-6 border rounded-xl shadow-sm hover:shadow-md transition">
              <h3 className="text-xl font-semibold">
                <a href={`#/blog/${post.slug}`} className="hover:text-indigo-600">
                  {post.title}
                </a>
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                {new Date(post.date).toLocaleDateString()}
              </p>

              <p className="mt-4 text-gray-700 line-clamp-3">{post.excerpt}</p>

              <a href={`#/blog/${post.slug}`} className="text-indigo-600 hover:underline mt-4 inline-block">
                Read more →
              </a>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <a href="#/blog" className="text-indigo-600 text-lg font-medium hover:underline">
            View all blog posts →
          </a>
        </div>
      </div>
    </section>
  );
};

// ================= FINAL CTA =================
const FinalCTA = () => (
  <section className="bg-indigo-600">
    <div className="max-w-4xl mx-auto text-center py-16 px-4">
      <h2 className="text-3xl font-extrabold text-white">
        Ready to get answers?
      </h2>
      <p className="mt-4 text-indigo-100 text-lg">
        Join thousands of others using SurveyZen to make better decisions.
      </p>

      <a href="#register" className="mt-8 inline-block bg-white text-indigo-600 px-8 py-3 rounded-md text-lg hover:bg-indigo-50">
        Sign Up for Free
      </a>
    </div>
  </section>
);

// ================= FOOTER =================
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
        { name: 'About Us', href: '#about' },
        { name: 'Blog', href: '#/blog' },
        { name: 'Contact', href: '#contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Help Center', href: '#' },
        { name: 'Templates', href: '#' },
        { name: 'Security', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-300 uppercase">{section.title}</h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="hover:text-white">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} SurveyZen. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// ================= MAIN LANDING PAGE =================
export default function LandingPage({ navigate }) {
  return (
    <div className="antialiased text-gray-800 bg-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <LatestBlogPosts /> {/* ⭐ NEW */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
