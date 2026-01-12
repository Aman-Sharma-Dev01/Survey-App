import React, { useEffect } from 'react';
import { useState } from 'react';
import {
  ClipboardList,
  Share2,
  BarChart2,
  Menu,
  X,
  MousePointerClick,
  CheckCircle2,
  Rocket,
  Linkedin,
  Github,
  Mail,
  ExternalLink
} from 'lucide-react';
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
/**
 * About page for SurveyZen
 * - Default export a React component
 * - Uses Tailwind CSS utility classes (no imports required)
 * - Follows a clean, modern layout consistent with a SaaS landing theme
 *
 * You can drop this file into your routes/pages folder and render it at /about
 */
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


export default function AboutSurveyZen() {
  // SEO: Set page title and meta tags
  useEffect(() => {
    document.title = 'About SurveyZen - Meet Our Founders | Shivam Kumar Yadav & Aman Sharma';
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn about SurveyZen, the AI-powered survey and quiz builder. Founded by Shivam Kumar Yadav and Aman Sharma - passionate developers building the future of feedback collection.');
    }
    
    // Add structured data for AboutPage
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'about-page-schema';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About SurveyZen",
      "description": "Learn about SurveyZen and its founders",
      "mainEntity": {
        "@type": "Organization",
        "name": "SurveyZen",
        "url": "https://surveyzen.live",
        "founder": [
          {
            "@type": "Person",
            "name": "Shivam Kumar Yadav",
            "jobTitle": "Co-Founder & CEO",
            "url": "https://www.linkedin.com/in/shivamkrydv/",
            "sameAs": ["https://www.linkedin.com/in/shivamkrydv/"]
          },
          {
            "@type": "Person",
            "name": "Aman Sharma",
            "jobTitle": "Co-Founder & CTO",
            "url": "https://www.linkedin.com/in/aman-sharma-dev01/",
            "sameAs": ["https://www.linkedin.com/in/aman-sharma-dev01/"]
          }
        ]
      }
    });
    
    // Only add if not already present
    if (!document.getElementById('about-page-schema')) {
      document.head.appendChild(script);
    }
    
    return () => {
      // Cleanup on unmount
      const existingScript = document.getElementById('about-page-schema');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 antialiased">
      <Navbar/>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold">About SurveyZen</p>
            <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
              Build better surveys. Get honest answers. Learn faster.
            </h1>
            <p className="mt-6 text-lg text-slate-700 max-w-xl">
           SurveyZen is a lightweight, privacy-first platform that lets teams, educators, recruiters, and creators build surveys, quizzes, and online interview sessions with ease. It combines a clean, minimal interface with powerful tools for fast survey creation, interactive quiz making, structured candidate interviews, and real-time response collection. Designed for simplicity, speed, and usability, SurveyZen helps you gather reliable insights without complexity—so you can focus on decisions, not setup.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="/#register" className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700">
                Get started — it’s free
              </a>
              <a href="/#contact" className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50">
                Contact sales
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <h3 className="text-sm font-semibold text-slate-500">Survey at a glance</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <p className="text-sm text-slate-600">Surveys created</p>
                  <p className="mt-1 text-2xl font-bold">1,200+</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-600">Average response time</p>
                  <p className="mt-1 text-2xl font-bold">~4 mins</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-600">Active users</p>
                  <p className="mt-1 text-2xl font-bold">800+</p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-50">
                  <p className="text-sm text-slate-600">Privacy-first</p>
                  <p className="mt-1 text-2xl font-bold">GDPR-friendly</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block absolute -right-8 top-8 w-44 h-44 bg-gradient-to-br from-indigo-200 to-indigo-400 rounded-lg blur-xl opacity-30" />
          </div>
        </div>
      </section>

      {/* Mission & Story */}
      <section className="bg-white border-t border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl font-semibold">Our mission</h2>
              <p className="mt-4 text-slate-700">We believe collecting feedback should be simple, respectful, and actionable. SurveyZen exists to remove the friction — from setup to analysis — so teams can make data‑driven decisions faster.</p>

              <ul className="mt-6 space-y-3">
                <li className="flex gap-3 items-start">
                  <span className="mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold">1</span>
                  <div>
                    <strong className="block">Simplicity</strong>
                    <span className="text-slate-600">Intuitive builder with thoughtful defaults so surveys are ready to send in minutes.</span>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold">2</span>
                  <div>
                    <strong className="block">Privacy</strong>
                    <span className="text-slate-600">We minimize data collection, offer anonymous response options, and provide guidance for compliant surveys.</span>
                  </div>
                </li>

                <li className="flex gap-3 items-start">
                  <span className="mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold">3</span>
                  <div>
                    <strong className="block">Actionable insight</strong>
                    <span className="text-slate-600">Clear exports and simple charts to help you turn responses into decisions — so you can understand insights faster and take action with confidence.</span>
                  </div>
                </li>

                {/* <li className="flex gap-3 items-start">
                  <span className="mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold">3</span>
                  <div>
                    <strong className="block">Actionable insights</strong>
                    <span className="text-slate-600">Clear exports and simple charts to help you turn responses into decisions.</span>
                  </div>
                </li> */}
                
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium">Our story</h3>
              <p className="mt-4 text-slate-700">SurveyZen started as a small project to help a local non‑profit run faster volunteer feedback surveys. Over time we realized many tools were either too complex or expensive for small teams—so we built SurveyZen to be focused, affordable, and privacy-aware.</p>

              <p className="mt-4 text-slate-700">We are a small distributed team of designers and engineers who are passionate about research and user experience. We ship frequent improvements driven by user feedback and try to keep our roadmap transparent to our community.</p>

            </div>
          </div>
        </div>
      </section>

      {/* Features */}
n
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">What makes SurveyZen different</h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">Powerful features without the clutter. Built for educators, product teams, and community managers.</p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <article className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Drag & Drop Builder</h4>
            <p className="mt-2 text-slate-600">Create question flows visually with custom logic and conditionals — no code required.</p>
          </article>

          <article className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Anonymous Responses</h4>
            <p className="mt-2 text-slate-600">Respect respondent privacy with anonymous mode and selective data collection options.</p>
          </article>

          <article className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Export & Integrations</h4>
            <p className="mt-2 text-slate-600">Export CSV, XLSX, or connect to Google Sheets and popular analytics tools for deeper analysis.</p>
          </article>

          <article className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Mobile-friendly</h4>
            <p className="mt-2 text-slate-600">Surveys are responsive and look great on phones and tablets.</p>
          </article>

          <article className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Templates & Best Practices</h4>
            <p className="mt-2 text-slate-600">Start from proven templates for feedback, NPS, event surveys, and more.</p>
          </article>

          <article className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Secure by design</h4>
            <p className="mt-2 text-slate-600">TLS, data export controls, and recommendations for GDPR/CCPA compliance.</p>
          </article>
        </div>
      </section>

      {/* Founders Section */}
      <section className="bg-gradient-to-b from-white to-indigo-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <p className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-4">Our Leadership</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Meet the Founders</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">SurveyZen was founded by two passionate developers who believe in making feedback collection simple, beautiful, and accessible for everyone.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Founder 1 - Shivam Kumar Yadav */}
            <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300" itemScope itemType="https://schema.org/Person">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-24"></div>
              <div className="px-6 pb-6 -mt-12">
                <div className="relative">
                  <img 
                    src="https://media.licdn.com/dms/image/v2/D4D03AQGRxT9dH59vhg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718821044029?e=1742428800&v=beta&t=pChKLLU-HJ9aW0rMwfA9wPa4kkBiNxcb8bZiZaKcKTg" 
                    alt="Shivam Kumar Yadav - Co-Founder & CEO of SurveyZen"
                    className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-gradient-to-br from-indigo-200 to-indigo-400"
                    itemProp="image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%234f46e5" width="100" height="100"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="32" font-weight="bold">SKY</text></svg>';
                    }}
                  />
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-bold text-slate-900" itemProp="name">Shivam Kumar Yadav</h3>
                  <p className="text-indigo-600 font-medium" itemProp="jobTitle">Co-Founder & CEO</p>
                </div>
                <p className="mt-4 text-slate-600 text-sm leading-relaxed" itemProp="description">
                  Full-stack developer with a passion for building products that solve real-world problems. 
                  Shivam leads product vision and strategy at SurveyZen, focusing on creating intuitive 
                  user experiences and driving innovation in the survey and feedback space.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">Product Strategy</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">Full-Stack Development</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">UI/UX</span>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <a 
                    href="https://www.linkedin.com/in/shivamkrydv/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white text-sm font-medium rounded-lg hover:bg-[#004182] transition-colors"
                    itemProp="sameAs"
                    aria-label="Connect with Shivam Kumar Yadav on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                    Connect on LinkedIn
                  </a>
                </div>
                <meta itemProp="url" content="https://www.linkedin.com/in/shivamkrydv/" />
                <link itemProp="sameAs" href="https://www.linkedin.com/in/shivamkrydv/" />
              </div>
            </article>

            {/* Founder 2 - Aman Sharma */}
            <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300" itemScope itemType="https://schema.org/Person">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-24"></div>
              <div className="px-6 pb-6 -mt-12">
                <div className="relative">
                  <img 
                    src="https://media.licdn.com/dms/image/v2/D5603AQFvZWO-0gYKcg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718910974410?e=1742428800&v=beta&t=G9Nj3U5e2btAZO7sVvl5nVVbOkVBuXDUhPE3KyAg6Sg" 
                    alt="Aman Sharma - Co-Founder & CTO of SurveyZen"
                    className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-gradient-to-br from-purple-200 to-purple-400"
                    itemProp="image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%239333ea" width="100" height="100"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="32" font-weight="bold">AS</text></svg>';
                    }}
                  />
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-bold text-slate-900" itemProp="name">Aman Sharma</h3>
                  <p className="text-purple-600 font-medium" itemProp="jobTitle">Co-Founder & CTO</p>
                </div>
                <p className="mt-4 text-slate-600 text-sm leading-relaxed" itemProp="description">
                  Experienced software engineer with expertise in building scalable web applications. 
                  Aman leads the technical architecture at SurveyZen, ensuring robust infrastructure, 
                  security, and seamless performance for millions of survey responses.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">Backend Architecture</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">System Design</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">DevOps</span>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <a 
                    href="https://www.linkedin.com/in/aman-sharma-dev01/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white text-sm font-medium rounded-lg hover:bg-[#004182] transition-colors"
                    itemProp="sameAs"
                    aria-label="Connect with Aman Sharma on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                    Connect on LinkedIn
                  </a>
                </div>
                <meta itemProp="url" content="https://www.linkedin.com/in/aman-sharma-dev01/" />
                <link itemProp="sameAs" href="https://www.linkedin.com/in/aman-sharma-dev01/" />
              </div>
            </article>
          </div>

          {/* Founding Story */}
          <div className="mt-16 max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Founding Story</h3>
            <p className="text-slate-600 leading-relaxed">
              SurveyZen was born from a simple observation: existing survey tools were either too complex 
              for everyday users or lacked the features needed by professionals. Shivam and Aman, having 
              worked together on various projects, decided to build a survey platform that combines 
              simplicity with power. What started as a side project to help educators collect feedback 
              has grown into a full-featured platform used by thousands of users worldwide.
            </p>
          </div>
        </div>
      </section>

     

      {/* Testimonials / Social proof */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center">
          <h3 className="text-xl font-semibold">Loved by researchers & educators</h3>
          <p className="mt-2 text-slate-600">Real customers using SurveyZen to collect feedback and make decisions.</p>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <blockquote className="p-6 bg-white border border-slate-100 rounded-lg">
            <p className="text-slate-700">SurveyZen made it effortless to create post-event feedback surveys — responses doubled and analysis was straightforward.</p>
            <footer className="mt-4 text-sm text-slate-500">— Navneet, Event Manager</footer>
          </blockquote>

          <blockquote className="p-6 bg-white border border-slate-100 rounded-lg">
            <p className="text-slate-700">We love the anonymous mode for sensitive research. Easy to set up and respects participant privacy.</p>
            <footer className="mt-4 text-sm text-slate-500">— Deepti Thakral,University Researcher</footer>
          </blockquote>

          <blockquote className="p-6 bg-white border border-slate-100 rounded-lg">
            <p className="text-slate-700">Straightforward exports and templates saved our team hours every month.</p>
            <footer className="mt-4 text-sm text-slate-500">— Aman, Product Lead</footer>
          </blockquote>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h3 className="text-xl font-semibold">Frequently asked questions</h3>
          <div className="mt-6 space-y-4">
            <details className="p-4 border rounded-lg">
              <summary className="font-medium">Is SurveyZen free?</summary>
              <div className="mt-2 text-slate-600">We offer a free tier for basic surveys and a paid tier for advanced features and team collaboration.</div>
            </details>

            <details className="p-4 border rounded-lg">
              <summary className="font-medium">How do you handle respondent data?</summary>
              <div className="mt-2 text-slate-600">We collect only what you choose to collect. Anonymous mode removes identifying data. See our Privacy Policy for details.</div>
            </details>

            <details className="p-4 border rounded-lg">
              <summary className="font-medium">Can I export responses?</summary>
              <div className="mt-2 text-slate-600">Yes — export CSV/XLSX and connect to Google Sheets or other tools for analysis.</div>
            </details>
          </div>
        </div>
      </section>

      {/* CTA + Contact */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-8 rounded-2xl shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-2xl font-semibold">Ready to start collecting better feedback?</h4>
              <p className="mt-2 text-indigo-100">Create your first survey in minutes — no credit card required.</p>
            </div>
            <div className="flex gap-3">
              <a href="/#register" className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-white text-indigo-600 font-semibold">Create account</a>
              <a href="/#contact" className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-white text-white">Contact us</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with links to legal pages (update URLs to your real paths) */}
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
    </main>
  );
}
