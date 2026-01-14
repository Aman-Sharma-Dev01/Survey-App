import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Share2,
  BarChart2,
  Menu,
  X,
  MousePointerClick,
  CheckCircle2,
  Rocket,
  Brain,
  Clock,
  Shield,
  Award,
  Zap,
  Users,
  FileText,
  Image,
  Timer,
  Lock,
  Shuffle,
  TrendingUp,
  Globe,
  Sparkles,
  ArrowRight,
  Star,
  Play,
  ChevronRight,
  Monitor,
  Smartphone,
  LayoutDashboard,
  PieChart,
  Gift,
  BookOpen,
  Target,
  Lightbulb,
  CheckCheck
} from 'lucide-react';

import { blogPostsMeta } from "./BlogPage.jsx";
import LandingNavbar from './LandingNavbar.jsx';
import LandingFooter from './LandingFooter.jsx';

// ================= NAVBAR =================
<LandingNavbar/>


// ================= HERO SECTION =================
const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = [
    "./Hero1.jpg",
    "./Hero4.jpg",
    "./Hero6.jpg",
    "./Hero8.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden pt-12">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 lg:py-4 w-full">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

          {/* LEFT SIDE */}
          <div className="w-full md:w-6/12 text-center md:text-left">

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Get the feedbackkkkkk
              <span className="block text-indigo-600">
                you need, instantly.
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 max-w-xl mx-auto md:mx-0">
              Create beautiful, easy-to-use surveys in minutes. Share them instantly,
              track analytics in real time, and make smarter decisions backed by
              meaningful insights.
            </p>

            {/* BULLETS */}
            <div className="mt-6 sm:mt-8 text-gray-700 text-sm sm:text-base w-fit mx-auto md:mx-0">
              
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                <span>AI-powered question suggestions</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                <span>Real-time response analytics</span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                <span>Instant sharing across channels</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 sm:mt-10 flex justify-center md:justify-start">
              <a
                href="/register"
                className="bg-indigo-600 text-white px-6 sm:px-8 py-3 rounded-md text-base sm:text-lg hover:bg-indigo-700 shadow-lg transition duration-300"
              >
                Create Your First Survey
              </a>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-gray-500">
              Free to start · No credit card required
            </p>
          </div>

          {/* RIGHT SIDE IMAGE CAROUSEL */}
          <div className="w-full md:w-6/12 mt-10 md:mt-0 relative">

            <div className="relative rounded-xl shadow-2xl overflow-hidden border border-gray-100">
              <img src={heroImages[0]} className="w-full opacity-0" alt="spacer" />

              {heroImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === currentImageIndex ? "opacity-100" : "opacity-0"}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// ================= FEATURES SECTION =================
const Features = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Creation',
      description: 'Let our AI suggest questions, analyze responses, and generate insights automatically.',
      color: 'indigo'
    },
    {
      icon: Zap,
      title: 'Real-Time Analytics',
      description: 'Watch responses come in live with beautiful charts, graphs, and exportable reports.',
      color: 'yellow'
    },
    {
      icon: Shield,
      title: 'Anti-Cheat Protection',
      description: 'Tab-switch detection, fullscreen mode, and time limits to ensure quiz integrity.',
      color: 'red'
    },
    {
      icon: Award,
      title: 'Auto Certificates',
      description: 'Generate beautiful, verifiable certificates with QR codes for quiz completers.',
      color: 'green'
    },
    {
      icon: Image,
      title: 'Rich Media Support',
      description: 'Add images to questions and answers for visual quizzes and engaging surveys.',
      color: 'purple'
    },
    {
      icon: Clock,
      title: 'Scheduled Publishing',
      description: 'Set start and end times for quizzes. Perfect for exams and timed assessments.',
      color: 'blue'
    },
  ];

  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <section id="features" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">Powerful Features</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-extrabold text-gray-900">
            Everything You Need to
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Collect Better Data
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From simple feedback forms to complex assessments with anti-cheat measures — we've got you covered.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative p-8 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300"
            >
              <div className={`inline-flex p-3 rounded-xl ${colorClasses[feature.color]} mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ================= SURVEYS SECTION =================
const SurveysSection = () => {
  const surveyFeatures = [
    { icon: FileText, title: 'Multiple Question Types', desc: 'Text, Radio, Checkbox, Likert Scale, and Slider questions' },
    { icon: Brain, title: 'AI Question Generator', desc: 'Generate survey questions based on your topic automatically' },
    { icon: BarChart2, title: 'Visual Analytics', desc: 'Beautiful charts and graphs for response analysis' },
    { icon: Share2, title: 'Easy Sharing', desc: 'Share via link, embed on website, or social media' },
    { icon: Globe, title: 'Public Results', desc: 'Option to share survey results publicly' },
    { icon: TrendingUp, title: 'Export Data', desc: 'Download responses as CSV for further analysis' },
  ];

  return (
    <section id="surveys" className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full mb-6">
              <ClipboardList className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">Survey Builder</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-6">
              Create Professional Surveys
              <span className="block text-indigo-600">In Minutes, Not Hours</span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-8">
              Our intuitive survey builder lets you create beautiful, responsive surveys with AI-powered suggestions. 
              Collect feedback, conduct research, and make data-driven decisions.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {surveyFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors">
                  <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                    <feature.icon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{feature.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Create Your First Survey
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Right - Visual */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
                <h3 className="text-white font-semibold">Employee Satisfaction Survey</h3>
                <p className="text-indigo-200 text-sm">6 questions · Anonymous</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-3">How would you rate your work-life balance?</p>
                  <div className="space-y-2">
                    {['Very Poor', 'Poor', 'Neutral', 'Good', 'Excellent'].map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer">
                        <div className={`w-4 h-4 rounded-full border-2 ${i === 3 ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                          {i === 3 && <div className="w-full h-full rounded-full bg-white scale-50"></div>}
                        </div>
                        <span className="text-sm text-gray-600">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">3 of 6 questions</span>
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Next →</button>
                </div>
              </div>
            </div>
            
            {/* Analytics Preview */}
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 w-48">
              <p className="text-xs font-medium text-gray-500 mb-2">Response Rate</p>
              <div className="flex items-end gap-1">
                {[40, 60, 45, 80, 95, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-indigo-600 to-purple-400 rounded-t" style={{ height: `${h}%`, maxHeight: '60px' }}></div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Last 7 days</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ================= QUIZZES SECTION =================
const QuizzesSection = () => {
  const quizFeatures = [
    { icon: Timer, title: 'Timed Assessments', desc: 'Set time limits per quiz or per question' },
    { icon: Lock, title: 'Anti-Cheat System', desc: 'Tab-switch detection & fullscreen enforcement' },
    { icon: Shuffle, title: 'Randomization', desc: 'Shuffle questions and options to prevent cheating' },
    { icon: Award, title: 'Auto Certificates', desc: 'Generate verifiable certificates with QR codes' },
    { icon: Image, title: 'Image Questions', desc: 'Add images to questions and answer options' },
    { icon: Users, title: 'Class Management', desc: 'Organize students by classes/sections' },
    { icon: TrendingUp, title: 'Detailed Analytics', desc: 'Per-question analysis, score distribution, and more' },
    { icon: Clock, title: 'Scheduling', desc: 'Set start and end times for quiz availability' },
  ];

  return (
    <section id="quizzes" className="py-16 lg:py-24 bg-gradient-to-b from-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Visual */}
          <div className="relative order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-white font-semibold">Mathematics Final Exam</h3>
                  <p className="text-purple-200 text-sm">Class 10A · 20 Questions</p>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                  <Timer className="h-4 w-4 text-white" />
                  <span className="text-white font-semibold">45:00</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-500 font-medium">Fullscreen Mode Active</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-4">
                    Q5: If a² + b² = 25 and ab = 12, find the value of (a + b)².
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['49', '37', '25', '61'].map((opt, i) => (
                      <button key={i} className={`px-4 py-3 rounded-lg text-sm border transition-all ${i === 0 ? 'bg-purple-100 border-purple-400 text-purple-700 font-medium' : 'bg-white border-gray-200 hover:border-purple-300'}`}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">5 / 20 answered</span>
                  <div className="flex gap-1">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i < 5 ? 'bg-purple-500' : 'bg-gray-200'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Preview */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Certificate Generated!</p>
                  <p className="text-xs text-gray-500">Score: 85% - Passed ✓</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-6">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Quiz Builder</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-6">
              Build Secure Quizzes
              <span className="block text-purple-600">With Anti-Cheat Protection</span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-8">
              Create timed assessments with auto-scoring, tab-switch detection, fullscreen enforcement, 
              and automatic certificate generation. Perfect for educators, trainers, and recruiters.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {quizFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <feature.icon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{feature.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a href="/register" className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors">
              Create Your First Quiz
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

// ================= HOW IT WORKS =================
const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Create',
      description: 'Build surveys or quizzes with our intuitive drag-and-drop editor. Use AI to generate questions.',
      icon: MousePointerClick,
      color: 'indigo'
    },
    {
      number: '02',
      title: 'Customize',
      description: 'Add images, set time limits, configure anti-cheat measures, and brand with your style.',
      icon: Lightbulb,
      color: 'purple'
    },
    {
      number: '03',
      title: 'Share',
      description: 'Publish and share via link, embed on your website, or send directly to participants.',
      icon: Share2,
      color: 'pink'
    },
    {
      number: '04',
      title: 'Analyze',
      description: 'Get real-time insights with beautiful analytics, export data, and generate certificates.',
      icon: PieChart,
      color: 'green'
    },
  ];

  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-4">
            Get Started in
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> 4 Simple Steps</span>
          </h2>
          <p className="text-lg text-gray-400">
            From idea to insights in minutes, not hours. Our streamlined workflow gets you results fast.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector Line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-700 to-transparent z-0"></div>
              )}
              
              <div className="relative bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-indigo-500 transition-all duration-300 group-hover:-translate-y-2">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl font-bold text-gray-700 group-hover:text-indigo-500 transition-colors">{step.number}</span>
                  <div className="p-3 bg-indigo-600/20 rounded-xl">
                    <step.icon className="h-6 w-6 text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ================= TESTIMONIALS =================
const Testimonials = () => {
  const testimonials = [
    {
      quote: "SurveyZen made our employee feedback process so much easier. The AI suggestions are incredibly helpful!",
      author: "Priya Sharma",
      role: "HR Manager, TechCorp",
      avatar: "PS"
    },
    {
      quote: "The anti-cheat features for quizzes are exactly what we needed for our online exams. Highly recommended!",
      author: "Dr. Rajesh Kumar",
      role: "Professor, Delhi University",
      avatar: "RK"
    },
    {
      quote: "Beautiful analytics and real-time responses. We switched from Google Forms and never looked back.",
      author: "Anita Desai",
      role: "Market Researcher",
      avatar: "AD"
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Loved by Teams Everywhere
          </h2>
          <p className="text-lg text-gray-600">See what our users are saying about SurveyZen</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-8 relative">
              <div className="absolute -top-4 left-8 text-6xl text-indigo-200 font-serif">"</div>
              <p className="text-gray-700 mb-6 relative z-10">{t.quote}</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t.author}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ================= LATEST BLOG POSTS =================
const LatestBlogPosts = () => {
  const latest = [...blogPostsMeta]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <section id="blog" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full mb-4">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">From Our Blog</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">
              Latest Insights & Guides
            </h2>
            <p className="mt-2 text-gray-600">
              Expert tips on surveys, quizzes, and data-driven decision making.
            </p>
          </div>
          <a href="#/blog" className="mt-4 md:mt-0 inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700">
            View All Articles
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {latest.map((post) => (
            <article key={post.slug} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-indigo-400" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>•</span>
                  <span>{post.author}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  <a href={`#/blog/${post.slug}`}>{post.title}</a>
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                <a href={`#/blog/${post.slug}`} className="inline-flex items-center gap-1 text-indigo-600 font-medium text-sm hover:gap-2 transition-all">
                  Read More <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

// ================= PRICING PREVIEW =================
const PricingPreview = () => {
  const plans = [
    {
      name: 'Starter',
      price: '₹0',
      period: '',
      periodLabel: 'Free forever',
      description: 'Perfect for trying out AI-powered surveys and quizzes.',
      features: [
        '200 AI Credits included',
        'Unlimited surveys & quizzes',
        'Unlimited responses',
        'Basic analytics',
        'Export to Excel'
      ],
      cta: 'Get Started Free',
      popular: false,
      ctaLink: '#register'
    },
    {
      name: 'Pro',
      price: '₹10',
      period: '',
      periodLabel: '3 months premium',
      description: 'For educators who need anti-cheating quiz features.',
      features: [
        '1,000 AI Credits',
        'All Starter features',
        'Anti-cheating features',
        'Tab switch detection',
        'Fullscreen mode enforcement',
        'Document upload for AI'
      ],
      cta: 'Get Pro',
      popular: true,
      ctaLink: '#pricing'
    },
    {
      name: 'Power',
      price: '₹50',
      period: '',
      periodLabel: '2 years premium',
      description: 'For institutions needing long-term anti-cheating protection.',
      features: [
        '10,000 AI Credits',
        'All Pro features',
        '2 years premium access',
        'Priority support',
        'Prevent duplicate roll numbers',
        'Sequential answering mode'
      ],
      cta: 'Get Power',
      popular: false,
      ctaLink: '#pricing'
    },
  ];

  return (
    <section id="pricing" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full mb-4">
            <Gift className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">Affordable Pricing</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Start free and upgrade when you need advanced features. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-6 lg:p-8 flex flex-col ${plan.popular ? 'bg-gradient-to-b from-indigo-600 to-purple-700 text-white shadow-2xl scale-105 z-10' : 'bg-white border border-gray-200 shadow-sm'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </div>
              )}
              <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
              <div className="mt-4 mb-1">
                <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
              </div>
              <p className={`text-xs font-medium mb-4 ${plan.popular ? 'text-indigo-200' : 'text-indigo-600'}`}>{plan.periodLabel}</p>
              <p className={`text-sm mb-6 ${plan.popular ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.description}</p>
              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <CheckCheck className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-indigo-300' : 'text-indigo-600'}`} />
                    <span className={`text-sm ${plan.popular ? 'text-white' : 'text-gray-600'}`}>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href={plan.ctaLink}
                className={`block text-center py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          <a href="/pricing" className="text-indigo-600 hover:underline font-medium">View full pricing details →</a>
        </p>
      </div>
    </section>
  );
};

// ================= FINAL CTA =================
const FinalCTA = () => (
  <section className="py-16 lg:py-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
    </div>
    
    <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
      <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-6">
        Ready to Get Better Insights?
      </h2>
      <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
        Join thousands of educators, researchers, and businesses using SurveyZen to collect meaningful data.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/register" className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-white/20 transition-all duration-300 transform hover:-translate-y-1">
          Start Free Today
          <ArrowRight className="h-5 w-5" />
        </a>
        <a href="/contact" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all duration-300">
          Contact Sales
        </a>
      </div>

      <p className="mt-6 text-sm text-indigo-200">
        ✓ No credit card required · ✓ Free forever plan · ✓ Cancel anytime
      </p>
    </div>
  </section>
);


// ================= MAIN LANDING PAGE =================
export default function LandingPage({ navigate }) {
  return (
    <div className="antialiased text-gray-800 bg-white min-h-screen w-full overflow-x-hidden">
      <LandingNavbar />
      <main className="w-full">
        <Hero />
        <Features />
        <SurveysSection />
        <QuizzesSection />
        <HowItWorks />
        <Testimonials />
        <PricingPreview />
        <LatestBlogPosts />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
