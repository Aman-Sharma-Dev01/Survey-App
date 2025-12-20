import React, { useState } from 'react';
import { Check, X, Minus, Plus, ExternalLink, Copy, CheckCircle, Clock, XCircle } from 'lucide-react';
import LandingFooter from './LandingFooter';
import LandingNavbar from './LandingNavbar';
import { useAuth } from '../context/AuthContext.jsx';
import { getPaymentLink, submitPayment } from '../services/paymentService';

// Payment Modal Component
const PaymentModal = ({ isOpen, onClose, plan, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Instructions, 2: Enter Transaction ID
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleGetPaymentLink = async () => {
    try {
      setLoading(true);
      setError('');
      const info = await getPaymentLink(plan.id);
      window.open(info.paymentLink, '_blank');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to get payment link');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!transactionId.trim()) {
      setError('Please enter the transaction ID');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await submitPayment(transactionId.trim(), plan.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(user?.email || '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Buy {plan.name} Plan
        </h2>
        <p className="text-slate-500 mb-6">
          ₹{plan.price} for {plan.credits.toLocaleString()} AI Credits
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-900 mb-2">Instructions:</h3>
              <ol className="text-sm text-indigo-700 space-y-2 list-decimal list-inside">
                <li>Click the button below to open payment page</li>
                <li>Complete the payment of ₹{plan.price}</li>
                <li>Add your email in the payment note: <span className="font-mono bg-indigo-100 px-1 rounded">{user?.email}</span>
                  <button onClick={copyEmail} className="ml-1 text-indigo-600 hover:text-indigo-800">
                    <Copy size={14} className="inline" />
                  </button>
                </li>
                <li>Note down the Transaction ID</li>
                <li>Come back and enter the Transaction ID</li>
              </ol>
            </div>

            <button
              onClick={handleGetPaymentLink}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Loading...' : (
                <>
                  Pay ₹{plan.price} with UROPay <ExternalLink size={18} />
                </>
              )}
            </button>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2 text-indigo-600 text-sm hover:underline"
            >
              Already paid? Enter Transaction ID
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Transaction ID / UTR Number
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter your transaction ID"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                You can find this in your UPI app or bank statement
              </p>
            </div>

            <button
              onClick={handleSubmitTransaction}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full py-2 text-slate-600 text-sm hover:underline"
            >
              ← Back to payment instructions
            </button>

            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-700">
              <strong>Note:</strong> Credits will be added to your account within 24 hours after verification.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Success Modal
const SuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Payment Submitted!
        </h2>
        <p className="text-slate-500 mb-6">
          Your payment has been submitted for verification. Credits will be added to your account within 24 hours.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

const PricingCard = ({ plan, onBuyClick, isLoggedIn }) => {
  const price = plan.price;

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
        {plan.duration && (
          <p className="text-indigo-600 text-sm mt-2 font-semibold flex items-center gap-1">
            <Clock size={14} />
            Premium features for {plan.duration}
          </p>
        )}
      </div>

      <button
        onClick={() => plan.id && onBuyClick && onBuyClick(plan)}
        disabled={!plan.id}
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
          plan.popular
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
            : plan.id 
              ? 'bg-slate-100 text-slate-900 hover:bg-indigo-50 hover:text-indigo-700'
              : 'bg-slate-100 text-slate-400 cursor-default'
        }`}
      >
        {!isLoggedIn && plan.id ? 'Login to Buy' : plan.cta}
      </button>

      <div className="mt-8 flex-1">
        <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
          What&apos;s included
        </p>
        <ul className="space-y-4">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              {feature.included ? (
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                  feature.highlight ? 'bg-gradient-to-br from-amber-100 to-orange-100' : 'bg-indigo-100'
                }`}>
                  <Check size={12} className={feature.highlight ? 'text-amber-600' : 'text-indigo-700'} strokeWidth={3} />
                </div>
              ) : (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
                  <X size={12} className="text-slate-400" />
                </div>
              )}
              <span
                className={`ml-3 text-sm ${
                  feature.included
                    ? feature.highlight 
                      ? 'text-amber-700 font-medium'
                      : 'text-slate-600'
                    : 'text-slate-400 line-through'
                }`}
              >
                {feature.text}
                {feature.highlight && (
                  <span className="ml-1.5 inline-flex items-center bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                    PRO
                  </span>
                )}
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
  const { isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const plans = [
    {
      id: null, // No purchase for free plan
      name: 'Starter',
      description: 'Perfect for trying out AI-powered surveys and quizzes.',
      price: 0,
      credits: 200,
      duration: null,
      cta: 'Free with Signup',
      popular: false,
      features: [
        { text: '200 AI Credits included', included: true },
        { text: 'Unlimited surveys & quizzes', included: true },
        { text: 'Unlimited responses', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Email support', included: true },
        { text: 'Export to Excel', included: true },
        { text: 'Document upload for AI generation', included: false },
        { text: 'Anti-cheating features', included: false },
        { text: 'Tab switch detection', included: false },
        { text: 'Fullscreen mode enforcement', included: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For educators who need anti-cheating quiz features.',
      price: 10,
      credits: 1000,
      duration: '3 months',
      cta: 'Get Pro',
      popular: true,
      features: [
        { text: '1,000 AI Credits', included: true },
        { text: 'Unlimited surveys & quizzes', included: true },
        { text: 'Unlimited responses', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Export to Excel', included: true },
        { text: '3 months premium access', included: true, highlight: true },
        { text: 'Document upload for AI generation', included: true, highlight: true },
        { text: 'Tab switch detection', included: true, highlight: true },
        { text: 'Prevent duplicate roll numbers', included: true, highlight: true },
        { text: 'Sequential answering mode', included: true, highlight: true },
        { text: 'Fullscreen + split-screen detection', included: true, highlight: true }
      ]
    },
    {
      id: 'power',
      name: 'Power',
      description: 'For institutions needing long-term anti-cheating protection.',
      price: 50,
      credits: 10000,
      duration: '2 years',
      cta: 'Get Power',
      popular: false,
      features: [
        { text: '10,000 AI Credits', included: true },
        { text: 'Unlimited surveys & quizzes', included: true },
        { text: 'Unlimited responses', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Export to Excel', included: true },
        { text: '2 years premium access', included: true, highlight: true },
        { text: 'Document upload for AI generation', included: true, highlight: true },
        { text: 'Tab switch detection', included: true, highlight: true },
        { text: 'Prevent duplicate roll numbers', included: true, highlight: true },
        { text: 'Sequential answering mode', included: true, highlight: true },
        { text: 'Fullscreen + split-screen detection', included: true, highlight: true }
      ]
    }
  ];

  const handleBuyClick = (plan) => {
    if (!isAuthenticated) {
      window.location.hash = 'login';
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setShowSuccessModal(true);
  };

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

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          plan={selectedPlan}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

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
                <PricingCard 
                  key={index} 
                  plan={plan} 
                  onBuyClick={handleBuyClick}
                  isLoggedIn={isAuthenticated}
                />
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
