import React, { useState } from 'react';
import { Check, X, Minus, Plus } from 'lucide-react';
import LandingFooter from './LandingFooter';
import LandingNavbar from './LandingNavbar';



const PricingCard = ({ plan }) => {
  const price = plan.price.monthly;

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
            ₹{price}
          </span>
          <span className="text-slate-500 ml-2 font-medium">
            {price === 0 ? '' : ''}
          </span>
        </div>
        <p className="text-slate-400 text-xs mt-1 font-medium">
          {price === 0 ? 'Free forever' : 'One-time payment'}
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
  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for trying out AI-powered surveys and quizzes.',
      price: { monthly: 0, yearly: 0 },
      cta: 'Start Free',
      popular: false,
      features: [
        { text: '200 AI Credits included', included: true },
        { text: 'Unlimited surveys & quizzes', included: true },
        { text: 'Unlimited responses', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Email support', included: true },
        { text: 'Export to Excel', included: true },
        { text: 'Priority support', included: false }
      ]
    },
    {
      name: 'Pro',
      description: 'For power users who need more AI generations.',
      price: { monthly: 10, yearly: 10 },
      cta: 'Buy Credits',
      popular: true,
      features: [
        { text: '1,000 AI Credits', included: true },
        { text: 'Unlimited surveys & quizzes', included: true },
        { text: 'Unlimited responses', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Export to Excel', included: true },
        { text: 'Best value for regular use', included: true }
      ]
    },
    {
      name: 'Power',
      description: 'For teams and heavy AI users who need maximum credits.',
      price: { monthly: 50, yearly: 50 },
      cta: 'Buy Credits',
      popular: false,
      features: [
        { text: '10,000 AI Credits', included: true },
        { text: 'Unlimited surveys & quizzes', included: true },
        { text: 'Unlimited responses', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Export to Excel', included: true },
        { text: 'Best for heavy usage', included: true }
      ]
    }
  ];

  const faqs = [
    {
      question: 'What are AI Credits used for?',
      answer:
        'AI Credits power our AI-generated surveys and quizzes. Each AI generation (creating questions, analyzing responses, etc.) costs 20 credits. You get 200 free credits when you sign up!'
    },
    {
      question: 'Do credits expire?',
      answer:
        "No! Your credits never expire. Once purchased, they're yours to use whenever you need them. Use them at your own pace."
    },
    {
      question: 'Can I get a refund?',
      answer:
        'Since credits are digital goods and can be used immediately, we cannot offer refunds. However, if you face any issues, please contact our support team.'
    },
    {
      question: 'Is my payment secure?',
      answer:
        'Absolutely! We use industry-standard encryption and secure payment gateways to process all transactions. Your payment information is never stored on our servers.'
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
              Buy{' '}
              <span className="text-indigo-600">AI Credits</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
              Power your AI-generated surveys and quizzes. Start with 200 free credits,
              buy more when you need them.
            </p>

            {/* AI Credits Info */}
            <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full mb-12">
              <span className="text-indigo-600 font-semibold">20 credits = 1 AI generation</span>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-2">
              {plans.map((plan, index) => (
                <PricingCard key={index} plan={plan} />
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
