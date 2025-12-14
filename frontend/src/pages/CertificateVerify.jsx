import React, { useState, useEffect } from 'react';
import { verifyCertificate, getQRCodeUrl } from '../services/certificateService';

const CertificateVerify = ({ certificateId, navigate }) => {
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verify = async () => {
            if (!certificateId) {
                setError('No certificate ID provided');
                setLoading(false);
                return;
            }

            try {
                const data = await verifyCertificate(certificateId);
                setResult(data);
            } catch (err) {
                setError(err.message || 'Failed to verify certificate');
            } finally {
                setLoading(false);
            }
        };

        verify();
    }, [certificateId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return '';
        const startDate = new Date(start);
        const endDate = new Date(end);
        const months = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
        if (months < 1) return 'Less than a month';
        if (months === 1) return '1 month';
        return `${months} months`;
    };

    const getYear = (dateString) => {
        if (!dateString) return new Date().getFullYear();
        return new Date(dateString).getFullYear();
    };

    // Print certificate function
    const handlePrint = () => {
        window.print();
    };

    // Gold Certified Badge Component (like the Certifier style)
    const CertifiedBadge = ({ year }) => {
        return (
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 print:w-16 print:h-16 relative">
                {/* Outer gold ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 shadow-lg">
                    {/* Inner ring */}
                    <div className="absolute inset-0.5 sm:inset-1 rounded-full bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-400">
                        {/* Content area */}
                        <div className="absolute inset-1 sm:inset-2 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-500 flex flex-col items-center justify-center text-center shadow-inner">
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-0.5">
                                <span className="text-yellow-100 text-[8px] sm:text-xs">★</span>
                                <span className="text-yellow-100 text-[8px] sm:text-xs">★</span>
                                <span className="text-yellow-100 text-[8px] sm:text-xs">★</span>
                            </div>
                            {/* Text */}
                            <p className="text-[8px] sm:text-[10px] md:text-xs font-bold text-amber-900 leading-tight">VERIFIED</p>
                            <p className="text-sm sm:text-base md:text-xl font-bold text-amber-900">{year}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Verifying certificate...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate?.('/')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    const { verified, certificate } = result || {};

    if (!verified || !certificate) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Certificate</h1>
                    <p className="text-gray-600 mb-6">This certificate could not be verified or has been revoked.</p>
                    <button
                        onClick={() => navigate?.('/')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-500 py-4 px-2 sm:py-8 sm:px-4 print:bg-white print:p-0 print:min-h-0 print:h-screen print:flex print:items-center print:justify-center">
            {/* Print Styles */}
            <style>
                {`
                    @media print {
                        @page {
                            size: A4 landscape;
                            margin: 5mm;
                        }
                        html, body {
                            height: 100%;
                            margin: 0 !important;
                            padding: 0 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .print-certificate-wrapper {
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            min-height: 100vh !important;
                            width: 100% !important;
                        }
                        .print-certificate {
                            width: 100% !important;
                            max-width: none !important;
                            height: auto !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                    }
                `}
            </style>
            
            {/* Certificate Container */}
            <div className="max-w-4xl mx-auto print:max-w-none print-certificate print-certificate-wrapper">
                {/* Outer gray frame */}
                <div className="bg-gray-600 p-2 sm:p-3 rounded-lg shadow-2xl print:p-2 print:shadow-none">
                    {/* Inner white certificate */}
                    <div className="bg-white rounded-md overflow-hidden" style={{ 
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.01) 10px, rgba(0,0,0,0.01) 20px)'
                    }}>
                        <div className="p-4 sm:p-6 md:p-8 print:p-6">
                            
                            {/* Header Row: Title + Logo */}
                            <div className="flex items-start justify-between gap-2 mb-4 sm:mb-6">
                                {/* Certificate Title */}
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif text-gray-800">
                                    Certificate of Internship
                                </h1>
                                
                                {/* Company Logo */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-sm sm:text-lg">S</span>
                                    </div>
                                    <div className="hidden sm:block">
                                        <h3 className="font-bold text-sm md:text-base text-gray-800">SURVEYZEN</h3>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Surveys & Quizzes</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area - Single Row Layout */}
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6">
                                {/* Left Side: Certificate Details */}
                                <div className="flex-1 min-w-0">
                                    {/* Proudly Presented To */}
                                    <p className="text-gray-500 italic text-sm mb-1">Proudly presented to</p>
                                    
                                    {/* Name - Large and prominent */}
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-normal text-gray-900 mb-3 sm:mb-4 truncate">
                                        {certificate.holderName}
                                    </h2>
                                    
                                    {/* Description */}
                                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-3 sm:mb-4">
                                        Successfully completed an internship as{' '}
                                        <span className="font-semibold text-gray-800">'{certificate.position}'</span>
                                        {certificate.department && (
                                            <> in the {certificate.department} department</>
                                        )}
                                        {certificate.description && (
                                            <> and {certificate.description.toLowerCase()}</>
                                        )}
                                    </p>

                                    {/* Certificate ID and Date Row */}
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        {/* Certificate ID - Yellow/Gold pill */}
                                        <div className="inline-flex items-center bg-amber-100 border border-amber-300 rounded px-2 sm:px-3 py-1">
                                            <span className="text-amber-800 font-medium text-xs sm:text-sm">
                                                Certificate Nr: {certificate.certificateId}
                                            </span>
                                        </div>
                                        
                                        {/* Certified Date */}
                                        <div className="text-gray-600 text-xs sm:text-sm">
                                            <span className="font-medium">Certified on:</span> {formatDate(certificate.issuedAt)}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Gold Badge */}
                                <div className="flex justify-center sm:justify-end flex-shrink-0">
                                    <CertifiedBadge year={getYear(certificate.issuedAt)} />
                                </div>
                            </div>

                            {/* Footer Row: Duration, Signatures, QR Code */}
                            <div className="border-t border-gray-200 pt-3 sm:pt-4">
                                <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
                                    {/* Left: Duration Info */}
                                    <div className="flex flex-col gap-1">
                                        <div className="inline-flex items-center bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                            <span className="text-amber-700 text-xs font-medium">
                                                Duration: {calculateDuration(certificate.startDate, certificate.endDate)}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center bg-gray-100 border border-gray-200 rounded px-2 py-1">
                                            <span className="text-gray-600 text-xs">
                                                {formatDate(certificate.startDate)} - {formatDate(certificate.endDate)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Center: Signatures */}
                                    <div className="flex gap-4 sm:gap-6">
                                        {/* Signature 1 */}
                                        <div className="text-center">
                                            <div className="w-20 sm:w-24 border-b-2 border-amber-400 mb-1 h-6 flex items-end justify-center">
                                                <span className="text-sm sm:text-base text-gray-700 italic">SurveyZen</span>
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-amber-600 font-medium">Administrator</p>
                                            <p className="text-[10px] sm:text-xs text-gray-500">Certificate Authority</p>
                                        </div>
                                        
                                        {/* Signature 2 */}
                                        <div className="text-center">
                                            <div className="w-20 sm:w-24 border-b-2 border-amber-400 mb-1 h-6 flex items-end justify-center">
                                                <span className="text-sm sm:text-base text-gray-700 italic">Verified</span>
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-amber-600 font-medium">Digital Signature</p>
                                            <p className="text-[10px] sm:text-xs text-gray-500">Auto-verified</p>
                                        </div>
                                    </div>

                                    {/* Right: QR Code */}
                                    <div className="flex flex-col items-center flex-shrink-0">
                                        <div className="border-2 border-amber-300 rounded-lg p-1 bg-white shadow-sm">
                                            <img
                                                src={getQRCodeUrl(certificate.certificateId)}
                                                alt="Verification QR Code"
                                                className="w-16 h-16 sm:w-20 sm:h-20 print:w-16 print:h-16"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Disclaimer */}
                            <div className="mt-3 pt-2 border-t border-gray-100">
                                <p className="text-[10px] sm:text-xs text-gray-400 text-center">
                                    *This certificate may be used to validate the internship completion at SurveyZen. 
                                    Verify authenticity by scanning the QR code or clicking the link below.
                                </p>
                                <p className="text-[10px] sm:text-xs text-center mt-1">
                                    <a 
                                        href={`https://surveyzen.live/#/verify-certificate/${certificate.certificateId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-amber-600 hover:text-amber-700 underline print:text-amber-700"
                                    >
                                        https://surveyzen.live/#/verify-certificate/{certificate.certificateId}
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Below Certificate */}
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 print:hidden">
                    <button
                        onClick={() => navigate?.('/')}
                        className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-md border border-gray-200 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Visit SurveyZen
                    </button>

                    {/* Print Button */}
                    <button
                        onClick={handlePrint}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Certificate
                    </button>
                    
                    {/* Placeholder for future LinkedIn button */}
                    <div id="linkedin-share-placeholder" className="hidden">
                        {/* LinkedIn Add to Profile button will go here */}
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 text-center text-sm text-gray-300 print:hidden">
                    <p>
                        This certificate was issued through SurveyZen's official internship program.
                    </p>
                    <p className="mt-1">
                        For any queries, contact us at{' '}
                        <a href="mailto:support@surveyzen.live" className="text-white hover:underline">
                            support@surveyzen.live
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CertificateVerify;
