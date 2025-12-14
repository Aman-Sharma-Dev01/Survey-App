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
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
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

    const { verified, certificate, message } = result || {};

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
            {/* Header */}
            <div className="max-w-3xl mx-auto mb-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🎓 SurveyZen Certificate Verification
                    </h1>
                    <p className="text-gray-600">
                        Official internship certificate verification portal
                    </p>
                </div>
            </div>

            {/* Verification Result Card */}
            <div className="max-w-3xl mx-auto">
                <div className={`bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 ${
                    verified ? 'border-green-500' : 'border-red-500'
                }`}>
                    {/* Status Banner */}
                    <div className={`px-6 py-4 ${verified ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-center gap-3">
                            {verified ? (
                                <>
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-xl font-semibold text-green-700">
                                        ✅ Certificate Verified
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <span className="text-xl font-semibold text-red-700">
                                        ❌ Certificate Invalid
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="text-center mt-2 text-gray-600">{message}</p>
                    </div>

                    {/* Certificate Details */}
                    {certificate && (
                        <div className="p-6 md:p-8">
                            {/* Certificate ID Badge */}
                            <div className="text-center mb-6">
                                <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-mono font-semibold">
                                    Certificate ID: {certificate.certificateId}
                                </span>
                            </div>

                            {/* Main Info */}
                            <div className="text-center mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                                    {certificate.holderName}
                                </h2>
                                <p className="text-lg text-gray-600">
                                    has successfully completed an internship as
                                </p>
                                <p className="text-xl md:text-2xl font-semibold text-indigo-600 mt-2">
                                    {certificate.position}
                                </p>
                                {certificate.department && (
                                    <p className="text-gray-500 mt-1">
                                        Department: {certificate.department}
                                    </p>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-500 mb-1">Duration</p>
                                    <p className="font-semibold text-gray-800">
                                        {formatDate(certificate.startDate)} - {formatDate(certificate.endDate)}
                                    </p>
                                    <p className="text-sm text-indigo-600 mt-1">
                                        ({calculateDuration(certificate.startDate, certificate.endDate)})
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-500 mb-1">Issued On</p>
                                    <p className="font-semibold text-gray-800">
                                        {formatDate(certificate.issuedAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            {certificate.description && (
                                <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                                    <p className="text-gray-700">{certificate.description}</p>
                                </div>
                            )}

                            {/* QR Code */}
                            {verified && certificate.certificateId && (
                                <div className="text-center border-t pt-6">
                                    <p className="text-sm text-gray-500 mb-3">Scan to verify</p>
                                    <img
                                        src={getQRCodeUrl(certificate.certificateId)}
                                        alt="Verification QR Code"
                                        className="mx-auto w-32 h-32 rounded-lg shadow"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-center md:text-left">
                                <p className="text-sm text-gray-500">
                                    Issued by <span className="font-semibold text-indigo-600">SurveyZen</span>
                                </p>
                                <p className="text-xs text-gray-400">
                                    surveyzen.live
                                </p>
                            </div>
                            <button
                                onClick={() => navigate?.('/')}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                                Visit SurveyZen
                            </button>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>
                        This certificate was issued through SurveyZen's official internship program.
                    </p>
                    <p className="mt-1">
                        For any queries, contact us at{' '}
                        <a href="mailto:support@surveyzen.live" className="text-indigo-600 hover:underline">
                            support@surveyzen.live
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CertificateVerify;
