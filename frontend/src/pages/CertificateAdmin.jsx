import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldX } from 'lucide-react';
import {
    getAllCertificates,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    revokeCertificate,
    reinstateCertificate,
    getCertificateStats,
    getQRCodeUrl,
    getVerificationUrl
} from '../services/certificateService';

// Admin email(s) allowed to access this page (must match backend)
const ADMIN_EMAILS = ['support@surveyzen.live'];

const CertificateAdmin = ({ navigate }) => {
    const { user, isLoading: authLoading } = useAuth();
    const [certificates, setCertificates] = useState([]);
    const [stats, setStats] = useState({ total: 0, valid: 0, revoked: 0, thisMonth: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Check if user is admin
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [editingCertificate, setEditingCertificate] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        holderName: '',
        email: '',
        position: '',
        department: 'Technology',
        startDate: '',
        endDate: '',
        description: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    // Fetch certificates
    const fetchCertificates = async (page, search) => {
        try {
            setLoading(true);
            const data = await getAllCertificates({
                page: page,
                limit: 10,
                search: search
            });
            setCertificates(data.certificates || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError(err.message || 'Failed to fetch certificates');
        } finally {
            setLoading(false);
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const data = await getCertificateStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    useEffect(() => {
        fetchCertificates(currentPage, searchTerm);
        fetchStats();
    }, [currentPage, searchTerm]);

    // Refresh data helper
    const refreshData = () => {
        fetchCertificates(currentPage, searchTerm);
        fetchStats();
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            holderName: '',
            email: '',
            position: '',
            department: 'Technology',
            startDate: '',
            endDate: '',
            description: ''
        });
        setEditingCertificate(null);
        setFormError(null);
    };

    // Open create modal
    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    // Open edit modal
    const openEditModal = (cert) => {
        setEditingCertificate(cert);
        setFormData({
            holderName: cert.holderName,
            email: cert.email,
            position: cert.position,
            department: cert.department || 'Technology',
            startDate: cert.startDate?.split('T')[0] || '',
            endDate: cert.endDate?.split('T')[0] || '',
            description: cert.description || ''
        });
        setShowCreateModal(true);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);

        try {
            if (editingCertificate) {
                await updateCertificate(editingCertificate._id, formData);
            } else {
                await createCertificate(formData);
            }
            setShowCreateModal(false);
            resetForm();
            refreshData();
        } catch (err) {
            setFormError(err.message || 'Failed to save certificate');
        } finally {
            setFormLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this certificate?')) return;
        
        try {
            await deleteCertificate(id);
            refreshData();
        } catch (err) {
            alert(err.message || 'Failed to delete certificate');
        }
    };

    // Handle revoke/reinstate
    const handleToggleValidity = async (cert) => {
        try {
            if (cert.isValid) {
                await revokeCertificate(cert._id);
            } else {
                await reinstateCertificate(cert._id);
            }
            refreshData();
        } catch (err) {
            alert(err.message || 'Failed to update certificate');
        }
    };

    // Show QR modal
    const showQR = (cert) => {
        setSelectedCertificate(cert);
        setShowQRModal(true);
    };

    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading...</p>
                </div>
            </div>
        );
    }

    // Show access denied for non-admin users
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldX size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        This page is restricted to administrators only. You don't have permission to view this content.
                    </p>
                    <button
                        onClick={() => navigate?.('dashboard')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        ← Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">🎓 Certificate Management</h1>
                        <p className="text-gray-600 mt-1">Issue and manage internship certificates</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate?.('dashboard')}
                            className="px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            ← Back to Dashboard
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <span>+</span> Issue Certificate
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-sm text-gray-500">Total Certificates</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-sm text-gray-500">Valid</p>
                    <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-sm text-gray-500">Revoked</p>
                    <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.thisMonth}</p>
                </div>
            </div>

            {/* Search */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <input
                        type="text"
                        placeholder="Search by name, email, position, or certificate ID..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Certificates Table */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
                            <p className="text-gray-500 mt-2">Loading certificates...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500">{error}</div>
                    ) : certificates.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No certificates found. Click "Issue Certificate" to create one.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Certificate ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Holder</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Position</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Duration</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {certificates.map((cert) => (
                                        <tr key={cert._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                                    {cert.certificateId}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-800">{cert.holderName}</p>
                                                <p className="text-sm text-gray-500">{cert.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-gray-800">{cert.position}</p>
                                                <p className="text-sm text-gray-500">{cert.department}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {formatDate(cert.startDate)} - {formatDate(cert.endDate)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    cert.isValid 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {cert.isValid ? '✅ Valid' : '❌ Revoked'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => showQR(cert)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Show QR Code"
                                                    >
                                                        📱
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(cert)}
                                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleValidity(cert)}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            cert.isValid 
                                                                ? 'text-orange-600 hover:bg-orange-50' 
                                                                : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                        title={cert.isValid ? 'Revoke' : 'Reinstate'}
                                                    >
                                                        {cert.isValid ? '🚫' : '✅'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cert._id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t flex items-center justify-between">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingCertificate ? 'Edit Certificate' : 'Issue New Certificate'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                    {formError}
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Holder Name *
                                </label>
                                <input
                                    type="text"
                                    name="holderName"
                                    value={formData.holderName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Position/Role *
                                </label>
                                <input
                                    type="text"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Frontend Developer Intern"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department
                                </label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Technology">Technology</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Design">Design</option>
                                    <option value="Operations">Operations</option>
                                    <option value="Human Resources">Human Resources</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description / Achievements (Optional)
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Brief description of work done or achievements..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {formLoading ? 'Saving...' : (editingCertificate ? 'Update' : 'Issue Certificate')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && selectedCertificate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                                Certificate QR Code
                            </h2>
                            
                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <p className="text-sm text-gray-600 mb-2">{selectedCertificate.holderName}</p>
                                <p className="font-mono text-sm bg-white px-3 py-1 rounded inline-block">
                                    {selectedCertificate.certificateId}
                                </p>
                            </div>

                            <img
                                src={getQRCodeUrl(selectedCertificate.certificateId)}
                                alt="Certificate QR Code"
                                className="mx-auto w-48 h-48 rounded-lg shadow-lg mb-4"
                            />

                            <div className="space-y-2 mb-4">
                                <p className="text-sm text-gray-500">Verification URL:</p>
                                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                    <input
                                        type="text"
                                        value={getVerificationUrl(selectedCertificate.certificateId)}
                                        readOnly
                                        className="flex-1 text-xs bg-transparent outline-none"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(getVerificationUrl(selectedCertificate.certificateId))}
                                        className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowQRModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                                <a
                                    href={getQRCodeUrl(selectedCertificate.certificateId)}
                                    download={`certificate-${selectedCertificate.certificateId}.png`}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center"
                                >
                                    Download QR
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificateAdmin;
