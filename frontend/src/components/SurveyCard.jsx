import React, { useState } from 'react';
import { List, BarChart, Trash2, Copy, QrCode, X } from 'lucide-react';
import toast from 'react-hot-toast';

const SurveyCard = ({ survey, onAnalyze, onPublish, onUnpublish, onDelete }) => {
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);

    const surveyLink = `${window.location.origin}/#respond/${survey._id}`;
    const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        surveyLink
    )}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(surveyLink);
            toast.success('Copied successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to copy link');
        }
    };

    const openQRModal = () => setIsQRModalOpen(true);
    const closeQRModal = () => setIsQRModalOpen(false);

    const handleDownloadQR = async () => {
  try {
    const response = await fetch(qrURL);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${survey.title || 'survey'}_QR.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    // ⬇️ toast after successful download
    toast.success("QR code downloaded!");
  } catch (error) {
    console.error('QR download failed:', error);
    toast.error("Failed to download QR");
  }
};


    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-gray-100 flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-bold text-indigo-800 mb-2">{survey.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{survey.description}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                        <List size={16} className="mr-1 text-indigo-500" />
                        <span className="font-semibold">{survey.questions.length} Questions</span>
                        <BarChart size={16} className="ml-4 mr-1 text-green-500" />
                        <span className="font-semibold text-green-700">{survey.responseCount} Responses</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div
                        className={`text-center py-1 rounded-full text-xs font-semibold mb-3 ${
                            survey.isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                        {survey.isPublished ? 'Live & Accepting Responses' : 'Draft / Unpublished'}
                    </div>

                    {survey.isPublished && (
                        <div className="mb-3">
                            <div className="flex items-center gap-2">
                                {/* Survey Link Textbox */}
                                <input
                                    type="text"
                                    readOnly
                                    value={surveyLink}
                                    onClick={(e) => e.target.select()}
                                    className="flex-1 p-2 border border-indigo-300 rounded-lg text-xs bg-indigo-50 text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                                    title="Survey link"
                                />

                                {/* Copy button with toast */}
                                <button
                                    onClick={handleCopyLink}
                                    className="px-3 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                                    title="Copy survey link"
                                >
                                    <Copy size={14} />
                                    Copy
                                </button>

                                {/* QR button opens modal */}
                                <button
                                    onClick={openQRModal}
                                    className="px-3 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                                    title="Show QR Code"
                                >
                                    <QrCode size={14} />
                                    QR
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 mt-1 text-center">
                                Copy the link or open the QR to share your survey.
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between space-x-2">
                        <button
                            onClick={() => onAnalyze()}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                        >
                            Analyze
                        </button>

                        {survey.isPublished ? (
                            <button
                                onClick={() => onUnpublish(survey)}
                                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition"
                            >
                                Unpublish
                            </button>
                        ) : (
                            <button
                                onClick={() => onPublish(survey)}
                                className="px-3 py-2 text-sm font-medium text-green-600 bg-green-100 rounded-lg hover:bg-green-200 transition"
                            >
                                Publish
                            </button>
                        )}

                        {/* Delete Button */}
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this survey?')) {
                                    onDelete(survey._id);
                                }
                            }}
                            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center"
                        >
                            <Trash2 size={16} className="mr-1 text-gray-600" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* QR Modal */}
            {isQRModalOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl relative">
                        {/* Close button */}
                        <button
                            onClick={closeQRModal}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100"
                        >
                            <X size={18} className="text-gray-500" />
                        </button>

                        <h3 className="text-lg font-semibold text-center text-gray-800 mb-1">
                            Survey QR Code
                        </h3>
                        <p className="text-xs text-gray-500 text-center mb-4 px-4">
                            Scan this QR to open the survey, or download it to share.
                        </p>

                        <div className="flex justify-center my-3">
                            <img
                                src={qrURL}
                                alt="Survey QR Code"
                                className="w-48 h-48 rounded-lg border border-gray-200"
                            />
                        </div>

                        <button
                            onClick={handleDownloadQR}
                            className="mt-4 w-full py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Download QR as PNG
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default SurveyCard;
