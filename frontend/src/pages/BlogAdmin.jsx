import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, 
    CheckCircle, 
    XCircle, 
    Star, 
    Eye,
    Clock,
    FileText,
    Loader,
    AlertCircle,
    Filter
} from 'lucide-react';
import { 
    getAllBlogsAdmin, 
    approveBlog, 
    rejectBlog, 
    toggleFeaturedBlog,
    BLOG_CATEGORIES 
} from '../services/blogService';

const statusTabs = [
    { value: '', label: 'All', count: 0 },
    { value: 'pending', label: 'Pending', count: 0 },
    { value: 'published', label: 'Published', count: 0 },
    { value: 'rejected', label: 'Rejected', count: 0 }
];

const BlogAdmin = ({ navigate }) => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeStatus, setActiveStatus] = useState('pending');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1 });
    
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        fetchBlogs();
    }, [activeStatus, page]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const data = await getAllBlogsAdmin({ 
                status: activeStatus, 
                page, 
                limit: 20 
            });
            setBlogs(data.blogs);
            setPagination(data.pagination);
        } catch (err) {
            setError(err.message || 'Failed to fetch blogs');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setProcessing(id);
            await approveBlog(id);
            setBlogs(prev => prev.map(b => 
                b._id === id ? { ...b, status: 'published', isApproved: true } : b
            ));
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        try {
            setProcessing(rejectModal);
            await rejectBlog(rejectModal, rejectReason);
            setBlogs(prev => prev.map(b => 
                b._id === rejectModal ? { ...b, status: 'rejected', rejectionReason: rejectReason } : b
            ));
            setRejectModal(null);
            setRejectReason('');
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleToggleFeatured = async (id) => {
        try {
            setProcessing(id);
            const result = await toggleFeaturedBlog(id);
            setBlogs(prev => prev.map(b => 
                b._id === id ? { ...b, isFeatured: result.isFeatured } : b
            ));
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
            published: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
            draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: FileText }
        };
        const cfg = config[status] || config.draft;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${cfg.bg} ${cfg.text}`}>
                <Icon className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => navigate('admin-dashboard')}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
                            <p className="text-sm text-gray-500">Review and manage user blog submissions</p>
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex gap-2">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => { setActiveStatus(tab.value); setPage(1); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    activeStatus === tab.value 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                        <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">×</button>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No blogs found</h3>
                        <p className="text-gray-500">
                            {activeStatus ? `No ${activeStatus} blogs` : 'No blogs submitted yet'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Blog</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Author</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {blogs.map(blog => (
                                        <tr key={blog._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {blog.coverImage?.url ? (
                                                        <img src={blog.coverImage.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                            <FileText className="h-5 w-5 text-indigo-500" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900 truncate max-w-xs">{blog.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {BLOG_CATEGORIES.find(c => c.value === blog.category)?.label}
                                                            {blog.isFeatured && (
                                                                <span className="ml-2 text-yellow-600">★ Featured</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900">{blog.authorName}</p>
                                                <p className="text-xs text-gray-500">{blog.author?.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(blog.status)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(blog.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a
                                                        href={`#/blog/${blog.slug}`}
                                                        target="_blank"
                                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                                        title="Preview"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                    
                                                    {blog.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(blog._id)}
                                                                disabled={processing === blog._id}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectModal(blog._id)}
                                                                disabled={processing === blog._id}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {blog.status === 'published' && (
                                                        <button
                                                            onClick={() => handleToggleFeatured(blog._id)}
                                                            disabled={processing === blog._id}
                                                            className={`p-2 rounded-lg disabled:opacity-50 ${
                                                                blog.isFeatured 
                                                                    ? 'text-yellow-600 bg-yellow-50' 
                                                                    : 'text-gray-400 hover:bg-gray-100'
                                                            }`}
                                                            title={blog.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                                                        >
                                                            <Star className={`h-4 w-4 ${blog.isFeatured ? 'fill-current' : ''}`} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-gray-600">
                                    Page {page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                    disabled={page === pagination.pages}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Blog</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejection Reason
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Please provide a reason for rejection..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                disabled={processing}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing || !rejectReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {processing ? 'Rejecting...' : 'Reject Blog'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogAdmin;
