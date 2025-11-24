import React, { useState } from 'react';
import { Check, X, HelpCircle, Minus, Plus } from 'lucide-react';
import LandingFooter from './LandingFooter';
import LandingNavbar from './LandingNavbar';



const Switch = ({ enabled, setEnabled }) => (
  <button
    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
      enabled ? 'bg-indigo-600' : 'bg-slate-200'
    }`}
    onClick={() => setEnabled(!enabled)}
  >
    <span
      className={`${
        enabled ? 'translate-x-7' : 'translate-x-1'
      } inline-block h-6 w-6 transform rounded-full bg-white transition shadow-sm`}
    />
  </button>
);

const PricingCard = ({ plan, isYearly }) => {
  const price = isYearly ? plan.price.yearly : plan.price.monthly;
  const period = isYearly ? '/year' : '/month';
  const subtext = isYearly ? 'Billed annually' : 'Billed monthly';

  return (
    <div
      className={`relative flex flex-col p-8 rounded-2xl transition-all duration-300 ${
        plan.popular
          ? 'bg-white border-2 border-indigo-500 shadow-xl shadow-indigo-100 scale-105 z-10'
          : 'bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200'
      }`}
    >
      {plan.popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-sm tracking-wide">
          MOST POPULAR
        </div>
      )}

      <div className="mb-6">
        <h3
          className={`text-xl font-bold ${
            plan.popular ? 'text-indigo-700' : 'text-slate-900'
          }`}
        >
          {plan.name}
        </h3>
        <p className="text-slate-500 mt-2 text-sm min-h-[40px]">
          {plan.description}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline">
          <span className="text-4xl font-extrabold text-slate-900">
            ${price}
          </span>
          <span className="text-slate-500 ml-2 font-medium">
            {price === 0 ? '' : period}
          </span>
        </div>
        <p className="text-slate-400 text-xs mt-1 font-medium">
          {price === 0 ? 'Forever free' : subtext}
        </p>
      </div>

      <button
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
          plan.popular
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
            : 'bg-slate-100 text-slate-900 hover:bg-indigo-50 hover:text-indigo-700'
        }`}
      >
        {plan.cta}
      </button>

      <div className="mt-8 flex-1">
        <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
          What&apos;s included
        </p>
        <ul className="space-y-4">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              {feature.included ? (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5">
                  <Check size={12} className="text-indigo-700" strokeWidth={3} />
                </div>
              ) : (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
                  <X size={12} className="text-slate-400" />
                </div>
              )}
              <span
                className={`ml-3 text-sm ${
                  feature.included
                    ? 'text-slate-600'
                    : 'text-slate-400 line-through'
                }`}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        className="w-full py-6 text-left flex justify-between items-center focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`text-lg font-medium transition-colors ${
            isOpen
              ? 'text-indigo-700'
              : 'text-slate-900 group-hover:text-indigo-700'
          }`}
        >
          {question}
        </span>
        <span
          className={`ml-6 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          {isOpen ? (
            <Minus size={20} className="text-indigo-600" />
          ) : (
            <Plus size={20} className="text-slate-400 group-hover:text-indigo-500" />
          )}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-48 opacity-100 mb-6' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-slate-600 leading-relaxed pr-12">{answer}</p>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: 'Spark',
      description: 'For hobbyists and side projects just getting started.',
      price: { monthly: 0, yearly: 0 },
      cta: 'Start Free',
      popular: false,
      features: [
        { text: '100 responses / month', included: true },
        { text: 'Unlimited questions', included: true },
        { text: 'Standard templates', included: true },
        { text: 'Email support', included: true },
        { text: 'Remove SurveyZen branding', included: false },
        { text: 'Custom logic jumps', included: false },
        { text: 'Data export (CSV/XLS)', included: false }
      ]
    },
    {
      name: 'Flow',
      description: 'For professionals who need power and customization.',
      price: { monthly: 29, yearly: 290 }, // 2 months free equivalent
      cta: 'Get Started',
      popular: true,
      features: [
        { text: 'Unlimited responses', included: true },
        { text: 'Unlimited questions', included: true },
        { text: 'Premium templates', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Remove SurveyZen branding', included: true },
        { text: 'Custom logic jumps', included: true },
        { text: 'Data export (CSV/XLS)', included: true }
      ]
    },
    {
      name: 'Harmony',
      description: 'For teams requiring collaboration and advanced security.',
      price: { monthly: 79, yearly: 790 },
      cta: 'Contact Sales',
      popular: false,
      features: [
        { text: 'Everything in Flow', included: true },
        { text: '5 Team seats included', included: true },
        { text: 'Collaborative editing', included: true },
        { text: 'Shared workspaces', included: true },
        { text: 'SSO (SAML) & Security', included: true },
        { text: 'Dedicated Success Manager', included: true },
        { text: 'Custom webhook integrations', included: true }
      ]
    }
  ];

  const faqs = [
    {
      question: 'Can I cancel my subscription at any time?',
      answer:
        "Absolutely. You can downgrade or cancel your plan at any time from your dashboard. If you cancel, you'll still have access to your premium features until the end of your billing cycle."
    },
    {
      question: 'What happens if I go over my response limit?',
      answer:
        "On the Free plan, we'll notify you when you approach the limit. We won't close your surveys immediately, but you won't be able to view new responses until the next month or unless you upgrade."
    },
    {
      question: 'Do you offer a discount for non-profits?',
      answer:
        'Yes! We love supporting organizations that do good. Contact our support team with proof of your non-profit status and we\'ll set you up with a 20% discount on all paid plans.'
    },
    {
      question: 'Is my data secure?',
      answer:
        'Security is our top priority. We use industry-standard encryption for data in transit and at rest. Our Harmony plan also offers advanced security features like SSO.'
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
<LandingNavbar />

      <main>
        {/* Hero Section */}
        <div className="relative pt-12 pb-20 sm:pt-16 sm:pb-32 overflow-hidden">
          {/* Abstract Background Element */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-50 rounded-[100%] blur-3xl -z-10 opacity-70 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
              Simple pricing for{' '}
              <span className="text-indigo-600">mindful</span> data.
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
              Start for free, upgrade when you need more power. No hidden fees,
              no credit card required to start.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-16">
              <span
                className={`text-sm font-medium ${
                  !isYearly ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                Monthly
              </span>
              <Switch enabled={isYearly} setEnabled={setIsYearly} />
              <span
                className={`text-sm font-medium ${
                  isYearly ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                Yearly{' '}
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs ml-1 font-bold">
                  SAVE 20%
                </span>
              </span>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-2">
              {plans.map((plan, index) => (
                <PricingCard key={index} plan={plan} isYearly={isYearly} />
              ))}
            </div>
          </div>
        </div>

        {/* Comparison / Trust Section */}
        <div className="bg-indigo-50/60 py-24 border-y border-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-indigo-500 uppercase tracking-widest mb-8">
              Trusted by teams at
            </p>
            <div className="flex flex-wrap justify-center gap-12 opacity-70">
              {/* Mock Logos - Replace with SVGs or images */}
              <div className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                <div className="w-6 h-6 bg-indigo-200 rounded-full" />
                Acme Corp
              </div>
              <div className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                <div className="w-6 h-6 bg-indigo-200 rounded-md" />
                GlobalBank
              </div>
              <div className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                <div className="w-6 h-6 bg-indigo-200 rotate-45" />
                Nebula
              </div>
              <div className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                <div className="w-6 h-6 bg-indigo-200 rounded-sm" />
                FoxRun
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <FaqItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
          <div className="mt-12 text-center bg-indigo-50 rounded-2xl p-8 border border-indigo-100">
            <p className="font-medium text-indigo-900 mb-4">
              Still have questions?
            </p>
            <p className="text-indigo-700 mb-6 text-sm">
              Our team is happy to answer your questions. We usually reply
              within a few hours.
            </p>
            <a href="#contact" className="h-auto w-max bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md flex items-center gap-2 mx-auto">
              {/* <HelpCircle size={18} /> */}
              Contact Support
            </a>
          </div>


        </div>
      </main>
      <LandingFooter/>
    </div>
  );
};

export default App;
