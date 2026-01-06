import React, { useState } from 'react';
import { LayoutGrid, ClipboardList, Brain, Zap, Plus, ArrowRight, RefreshCw, Code2, PenSquare, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * HomePage - Main hub for users after login
 * Displays feature boxes with animations for easy navigation
 */
const HomePage = ({ navigate }) => {
    const { user } = useAuth();
    const [hoveredBox, setHoveredBox] = useState(null);

    // Feature boxes configuration - easy to add new features here
    const features = [
        {
            id: 'surveys',
            title: 'Surveys',
            description: 'Create, manage, and analyze surveys to gather insights from your audience',
            icon: ClipboardList,
            color: 'from-blue-500 to-blue-600',
            lightBg: 'bg-blue-50',
            hoverColor: 'group-hover:from-blue-600 group-hover:to-blue-700',
            lightHover: 'group-hover:bg-blue-100',
            actionButtons: [
                { label: 'View Surveys', action: 'dashboard', icon: LayoutGrid },
                { label: 'Create New', action: 'create', icon: Plus }
            ]
        },
        {
            id: 'quizzes',
            title: 'Quizzes',
            description: 'Create engaging quizzes, track performance, and issue certificates to participants',
            icon: Brain,
            color: 'from-purple-500 to-purple-600',
            lightBg: 'bg-purple-50',
            hoverColor: 'group-hover:from-purple-600 group-hover:to-purple-700',
            lightHover: 'group-hover:bg-purple-100',
            actionButtons: [
                { label: 'View Quizzes', action: 'quiz-dashboard', icon: LayoutGrid },
                { label: 'Create New', action: 'quiz-create', icon: Plus },
                { label: 'Queued Submissions', action: 'queued-submissions', icon: RefreshCw }
            ]
        },
        {
            id: 'coding-tests',
            title: 'Coding Tests',
            description: 'Run JavaScript-only coding exams with a secure in-browser compiler and anti-cheat guardrails',
            icon: Code2,
            color: 'from-cyan-500 to-teal-600',
            lightBg: 'bg-cyan-50',
            hoverColor: 'group-hover:from-cyan-600 group-hover:to-teal-700',
            lightHover: 'group-hover:bg-cyan-100',
            actionButtons: [
                { label: 'Dashboard', action: 'coding-dashboard', icon: LayoutGrid },
                { label: 'Create New', action: 'coding-create', icon: Plus },
            ]
        },
        {
            id: 'blogs',
            title: 'Write a Blog',
            description: 'Publish articles, manage drafts, and keep your readers updated with fresh content',
            icon: PenSquare,
            color: 'from-pink-500 to-rose-600',
            lightBg: 'bg-pink-50',
            hoverColor: 'group-hover:from-pink-600 group-hover:to-rose-700',
            lightHover: 'group-hover:bg-pink-100',
            actionButtons: [
                { label: 'Write Blog', action: 'blog-create', icon: PenSquare },
                { label: 'My Blogs', action: 'my-blogs', icon: LayoutGrid },
            ],
        },
        {
            id: 'ai-tools',
            title: 'Feedback Form ',
            description: 'Build feedback forms and share them with audiences — coming soon',
            icon: Zap,
            color: 'from-amber-500 to-orange-600',
            lightBg: 'bg-amber-50',
            hoverColor: 'group-hover:from-amber-600 group-hover:to-orange-700',
            lightHover: 'group-hover:bg-amber-100',
            actionButtons: [
                { label: 'Coming Soon', action: null, icon: ArrowRight }
            ]
        },
        {
            id: 'schedule-interview',
            title: 'Schedule Interview',
            description: 'Schedule interviews with candidates and manage slots — coming soon',
            icon: Calendar,
            color: 'from-emerald-500 to-green-600',
            lightBg: 'bg-emerald-50',
            hoverColor: 'group-hover:from-emerald-600 group-hover:to-green-700',
            lightHover: 'group-hover:bg-emerald-100',
            actionButtons: [
                { label: 'Coming Soon', action: null, icon: ArrowRight }
            ]
        },
        // New features can be easily added here
    ];

    const handleBoxClick = (action) => {
        if (action) {
            navigate(action);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-16">
                <div className="text-center">
                    
                    
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                        Welcome, {user?.firstName || 'User'}!
                    </h1>
                    
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Select a feature below to get started. Choose from surveys, quizzes, or use AI-powered tools to enhance your content creation.
                    </p>
                </div>
            </div>

            {/* Feature Boxes Grid */}
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {features.map((feature) => {
                        const IconComponent = feature.icon;
                        const isHovered = hoveredBox === feature.id;

                        return (
                            <div
                                key={feature.id}
                                className="group h-full"
                                onMouseEnter={() => setHoveredBox(feature.id)}
                                onMouseLeave={() => setHoveredBox(null)}
                            >
                                {/* Feature Box */}
                                <div className={`relative h-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 transform ${
                                    isHovered ? 'scale-105 shadow-2xl' : 'shadow-lg'
                                }`}>
                                    {/* Background Gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} ${feature.hoverColor} transition-all duration-300`}></div>
                                    
                                    {/* Light Background for hover effect */}
                                    <div className={`absolute inset-0 ${feature.lightBg} ${feature.lightHover} transition-all duration-300`} style={{opacity: isHovered ? 0 : 0.1}}></div>
                                    
                                    {/* Content */}
                                    <div className="relative h-full p-8 flex flex-col justify-between z-10">
                                        {/* Top Content */}
                                        <div>
                                            {/* Icon */}
                                            <div className={`w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 transition-all duration-300 ${
                                                isHovered ? 'bg-white/30 scale-110' : ''
                                            }`}>
                                                <IconComponent size={32} className="text-white" />
                                            </div>
                                            
                                            {/* Title & Description (or feedback form for AI Tools) */}
                                            <h2 className="text-2xl font-bold text-white mb-3">{feature.title}</h2>
                                            <p className="text-white/80 leading-relaxed text-sm sm:text-base">{feature.description}</p>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-3 mt-8">
                                            {feature.actionButtons.map((btn, idx) => {
                                                const BtnIcon = btn.icon;
                                                const isComingSoon = !btn.action;
                                                
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleBoxClick(btn.action)}
                                                        disabled={isComingSoon}
                                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base ${
                                                            isComingSoon
                                                                ? 'bg-white/20 text-white/60 cursor-not-allowed'
                                                                : 'bg-white text-gray-800 hover:bg-gray-100 hover:shadow-lg transform hover:scale-105 active:scale-95'
                                                        }`}
                                                    >
                                                        <BtnIcon size={18} />
                                                        <span>{btn.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    {/* Animated Border */}
                                    <div className={`absolute inset-0 rounded-2xl border-2 border-white/0 transition-all duration-300 ${
                                        isHovered ? 'border-white/20' : ''
                                    } pointer-events-none`}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                
                
            </div>
        </div>
    );
};

export default HomePage;
