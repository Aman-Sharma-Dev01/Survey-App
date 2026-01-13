import React from 'react';
import { Crown, Lock } from 'lucide-react';

/**
 * PremiumFeatureLock - Wraps premium features and shows lock for non-premium users
 * @param {boolean} isPremiumUser - Whether the user has an active premium plan
 * @param {React.ReactNode} children - The feature content to render
 * @param {string} featureName - Name of the feature (for display)
 * @param {function} onUpgradeClick - Callback when upgrade is clicked
 */
const PremiumFeatureLock = ({ 
    isPremiumUser, 
    children, 
    featureName = 'This feature',
    onUpgradeClick 
}) => {
    if (isPremiumUser) {
        return children;
    }

    return (
        <div className="relative">
            {/* Render children but disabled/grayed out */}
            <div className="opacity-50 pointer-events-none select-none">
                {children}
            </div>
            
            {/* Premium overlay */}
            <div 
                className="absolute inset-0 flex items-center justify-end pr-2 cursor-pointer group"
                onClick={onUpgradeClick}
            >
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                    <Crown size={12} />
                    <span>PRO</span>
                </div>
            </div>
        </div>
    );
};

/**
 * PremiumSettingRow - A complete premium setting row with lock functionality
 */
export const PremiumSettingRow = ({
    id,
    checked,
    onChange,
    label,
    description,
    isPremiumUser,
    onUpgradeClick
}) => {
    const handleChange = (e) => {
        if (!isPremiumUser) {
            onUpgradeClick?.();
            return;
        }
        onChange(e);
    };

    return (
        <div 
            className={`flex items-start p-3 rounded-lg transition-all ${
                !isPremiumUser 
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 cursor-pointer hover:border-amber-300' 
                    : ''
            }`}
            onClick={() => !isPremiumUser && onUpgradeClick?.()}
        >
            <div className="flex items-center flex-1">
                <input
                    type="checkbox"
                    id={id}
                    checked={isPremiumUser ? checked : false}
                    onChange={handleChange}
                    disabled={!isPremiumUser}
                    className={`mr-3 h-4 w-4 ${!isPremiumUser ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                />
                <label 
                    htmlFor={id} 
                    className={`text-sm ${!isPremiumUser ? 'text-gray-500' : 'text-gray-700'}`}
                >
                    <span className="flex items-center gap-2">
                        {label}
                        {!isPremiumUser && (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                <Crown size={10} />
                                PRO
                            </span>
                        )}
                    </span>
                    <span className={`text-xs block ${!isPremiumUser ? 'text-gray-400' : 'text-gray-500'}`}>
                        {description}
                    </span>
                </label>
            </div>
            {!isPremiumUser && (
                <Lock size={16} className="text-amber-500 ml-2 flex-shrink-0 mt-0.5" />
            )}
        </div>
    );
};

/**
 * PremiumUpgradeModal - Modal shown when non-premium user clicks on premium feature
 */
export const PremiumUpgradeModal = ({ isOpen, onClose, featureName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Crown size={32} className="text-white" />
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Premium Feature
                </h2>
                
                <p className="text-gray-600 mb-4">
                    <strong>{featureName}</strong> is available for Pro and Power plan users only.
                </p>
                
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-amber-800 font-medium mb-2">Upgrade to unlock:</p>
                    <ul className="text-sm text-amber-700 text-left space-y-1">
                        <li>✓ Tab Switch Detection</li>
                        <li>✓ Force Fullscreen Mode</li>
                        <li>✓ Prevent Duplicate Roll Numbers</li>
                        <li>✓ Require Sequential Answering</li>
                        <li>✓ Split Screen Detection</li>
                    </ul>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={() => {
                            window.history.pushState({}, '', '/pricing');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                            onClose();
                        }}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition font-medium shadow-md"
                    >
                        View Plans
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumFeatureLock;
