import React, { useState } from 'react';
import { Mail, Send, MapPin, Linkedin, Globe, User, Code2 } from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock submission logic
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-teal-600 p-1.5 rounded-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-teal-900 tracking-tight">SurveyZen</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#" className="text-slate-600 hover:text-teal-600 transition-colors">Home</a>
              <a href="#" className="text-slate-600 hover:text-teal-600 transition-colors">Features</a>
              <a href="#" className="text-teal-600 font-medium">Contact</a>
            </div>
            <button className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors text-sm font-medium">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-teal-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Let's Start a Conversation
          </h1>
          <p className="text-teal-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Whether you have a question about features, pricing, or just want to say hello to the founders, we're ready to answer all your questions.
          </p>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Contact Info & Founders */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* General Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-teal-50 p-3 rounded-lg text-teal-600">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Email Us</p>
                    <a href="mailto:support@surveyzen.live" className="text-slate-900 font-medium hover:text-teal-600 transition-colors">
                      support@surveyzen.live
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-teal-50 p-3 rounded-lg text-teal-600">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Website</p>
                    <a href="https://surveyzen.live" target="_blank" rel="noreferrer" className="text-slate-900 font-medium hover:text-teal-600 transition-colors">
                      www.surveyzen.live
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Founders Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-teal-600" />
                Meet the Founders
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                Built with passion by MERN stack developers committed to simplifying surveys.
              </p>
              
              <div className="space-y-6">
                {/* Founder 1 */}
                <div className="group p-4 rounded-xl bg-slate-50 hover:bg-teal-50 transition-colors border border-slate-100 hover:border-teal-100">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
                      SK
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Shivam Kumar Yadav</h4>
                      <p className="text-xs text-teal-600 font-semibold tracking-wide uppercase">Co-Founder</p>
                    </div>
                  </div>
                  <a href="mailto:shivam@surveyzen.live" className="flex items-center gap-2 text-sm text-slate-600 group-hover:text-teal-700 transition-colors">
                    <Mail className="h-4 w-4" />
                    shivam@surveyzen.live
                  </a>
                </div>

                {/* Founder 2 */}
                <div className="group p-4 rounded-xl bg-slate-50 hover:bg-teal-50 transition-colors border border-slate-100 hover:border-teal-100">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                      AS
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Aman Shama</h4>
                      <p className="text-xs text-indigo-600 font-semibold tracking-wide uppercase">Co-Founder</p>
                    </div>
                  </div>
                  <a href="mailto:aman@surveyzen.live" className="flex items-center gap-2 text-sm text-slate-600 group-hover:text-indigo-700 transition-colors">
                    <Mail className="h-4 w-4" />
                    aman@surveyzen.live
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 h-full">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>
              
              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in fade-in duration-500">
                  <div className="bg-green-100 p-4 rounded-full mb-4">
                    <Send className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                  <p className="text-slate-600">Thank you for reaching out. We'll get back to you shortly.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-8 text-teal-600 font-medium hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-slate-700">Subject</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                    >
                      <option value="">Select a topic...</option>
                      <option value="support">Technical Support</option>
                      <option value="sales">Sales & Pricing</option>
                      <option value="partnership">Partnership Inquiry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-slate-700">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows="6"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white resize-none"
                      placeholder="How can we help you today?"
                    ></textarea>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full bg-teal-600 text-white font-bold py-4 rounded-lg hover:bg-teal-700 transform transition-all hover:-translate-y-1 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <Send className="h-5 w-5" />
                      Send Message
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-slate-800 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-teal-600 p-1 rounded">
                  <Globe className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg text-white">SurveyZen</span>
              </div>
              <p className="text-sm text-slate-400 max-w-xs">
                Empowering developers and businesses with simple, powerful survey tools.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-teal-400 transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="bg-slate-800 p-2 rounded hover:bg-teal-600 transition-colors text-white">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="bg-slate-800 p-2 rounded hover:bg-teal-600 transition-colors text-white">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} SurveyZen. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactUs;