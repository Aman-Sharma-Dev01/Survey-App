import React from 'react';

/**
 * About page for SurveyZen
 * - Default export a React component
 * - Uses Tailwind CSS utility classes (no imports required)
 * - Follows a clean, modern layout consistent with a SaaS landing theme
 *
 * You can drop this file into your routes/pages folder and render it at /about
 */

export default function AboutSurveyZen() {
  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 antialiased">
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
              <a href="/signup" className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700">
                Get started — it’s free
              </a>
              <a href="/contact" className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50">
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
                    <strong className="block">Actionable insights</strong>
                    <span className="text-slate-600">Clear exports and simple charts to help you turn responses into decisions.</span>
                  </div>
                </li>
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
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400 flex items-center justify-center text-white font-bold">AS</div>
              <h4 className="mt-4 font-semibold">Asha Roy</h4>
              <p className="text-sm text-slate-600">Founder & Product</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-lg text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400 flex items-center justify-center text-white font-bold">MK</div>
              <h4 className="mt-4 font-semibold">Milan Kapoor</h4>
              <p className="text-sm text-slate-600">Engineering</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-lg text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400 flex items-center justify-center text-white font-bold">SR</div>
              <h4 className="mt-4 font-semibold">Siddharth Rana</h4>
              <p className="text-sm text-slate-600">Design</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-lg text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-400 flex items-center justify-center text-white font-bold">LP</div>
              <h4 className="mt-4 font-semibold">Lina Patel</h4>
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
            <p className="text-slate-700">“SurveyZen made it effortless to create post-event feedback surveys — responses doubled and analysis was straightforward.”</p>
            <footer className="mt-4 text-sm text-slate-500">— Priya, Event Manager</footer>
          </blockquote>

          <blockquote className="p-6 bg-white border border-slate-100 rounded-lg">
            <p className="text-slate-700">“We love the anonymous mode for sensitive research. Easy to set up and respects participant privacy.”</p>
            <footer className="mt-4 text-sm text-slate-500">— Raj, University Researcher</footer>
          </blockquote>

          <blockquote className="p-6 bg-white border border-slate-100 rounded-lg">
            <p className="text-slate-700">“Straightforward exports and templates saved our team hours every month.”</p>
            <footer className="mt-4 text-sm text-slate-500">— Kavita, Product Lead</footer>
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
              <a href="/signup" className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-white text-indigo-600 font-semibold">Create account</a>
              <a href="/contact" className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-white text-white">Contact us</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with links to legal pages (update URLs to your real paths) */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600">© {new Date().getFullYear()} SurveyZen — All rights reserved.</div>
          <div className="flex gap-4 text-sm">
            <a href="/privacy" className="text-slate-600 hover:underline">Privacy Policy</a>
            <a href="/terms" className="text-slate-600 hover:underline">Terms of Service</a>
            <a href="/contact" className="text-slate-600 hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
