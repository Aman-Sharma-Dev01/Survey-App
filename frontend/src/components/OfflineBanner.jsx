import React, { useState, useEffect } from 'react';
import { WifiOff, X, RefreshCw } from 'lucide-react';

const OfflineBanner = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setDismissed(false);
        };
        
        const handleOffline = () => {
            setIsOffline(true);
            setDismissed(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline || dismissed) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gray-900 text-white shadow-lg animate-slideDown">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                            <WifiOff size={20} className="text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base">
                                You're offline
                            </p>
                            <p className="text-gray-400 text-xs sm:text-sm truncate">
                                Check your internet connection to continue using SurveyZen
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => window.location.reload()}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                        >
                            <RefreshCw size={16} />
                            Retry
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="sm:hidden p-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition"
                            aria-label="Retry"
                        >
                            <RefreshCw size={18} />
                        </button>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition"
                            aria-label="Dismiss"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes slideDown {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default OfflineBanner;
