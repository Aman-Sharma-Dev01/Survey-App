import React from 'react';
import { useState } from 'react';
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
              SurveyZen is a lightweight, privacy-first survey builder for teams, educators,
              and creators who want beautiful, usable surveys without the complexity.
              We combine a minimal interface with powerful features so you can collect
              reliable responses quickly and focus on what matters — the insights.
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

      {/* Team & Values */}
      <section className="bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Meet the team</h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">Small team, big focus — designers, engineers and community folks who care about research and privacy.</p>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/** Example team cards - replace with real photos & names */}
            <div className="p-6 bg-slate-50 rounded-lg text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400 flex items-center justify-center text-white font-bold">SKY</div>
              <h4 className="mt-4 font-semibold">Shivam kumar Yadav</h4>
              <p className="text-sm text-slate-600">Founder & Product</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-lg text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400 flex items-center justify-center text-white font-bold">AS</div>
              <h4 className="mt-4 font-semibold">Aman Sharma</h4>
              <p className="text-sm text-slate-600">Product Lead</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-lg text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400 flex items-center justify-center text-white font-bold">KS</div>
              <h4 className="mt-4 font-semibold">Karan Sharma</h4>
              <p className="text-sm text-slate-600">Research</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-lg text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400 flex items-center justify-center text-white font-bold">AS</div>
              <h4 className="mt-4 font-semibold">Aryan Singh</h4>
              <p className="text-sm text-slate-600">Community</p>
            </div>
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
