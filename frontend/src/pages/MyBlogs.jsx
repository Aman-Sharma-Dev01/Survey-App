import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, 
    Plus, 
    Edit, 
    Trash2, 
    Eye, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    FileText,
    Loader
} from 'lucide-react';
import { getMyBlogs, deleteBlog, BLOG_CATEGORIES } from '../services/blogService';

const statusConfig = {
    draft: { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Draft' },
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending Review' },
    published: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Published' },
    rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' }
};

const MyBlogs = ({ navigate }) => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const data = await getMyBlogs();
            setBlogs(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch blogs');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            setDeleting(true);
            await deleteBlog(id);
            setBlogs(prev => prev.filter(b => b._id !== id));
            setDeleteId(null);
        } catch (err) {
            setError(err.message || 'Failed to delete blog');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('dashboard')}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Blogs</h1>
                            <p className="text-sm text-gray-500">{blogs.length} blog post{blogs.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('blog-create')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Write New Blog
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No blogs yet</h3>
                        <p className="text-gray-500 mb-6">Start writing your first blog post!</p>
                        <button
                            onClick={() => navigate('blog-create')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Plus className="h-5 w-5" />
                            Write Your First Blog
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {blogs.map(blog => {
                            const status = statusConfig[blog.status] || statusConfig.draft;
                            const StatusIcon = status.icon;

                            return (
                                <div key={blog._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                                    <div className="flex items-start gap-4">
                                        {/* Cover Image */}
                                        {blog.coverImage?.url ? (
                                            <img 
                                                src={blog.coverImage.url} 
                                                alt="" 
                                                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-8 w-8 text-indigo-400" />
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {BLOG_CATEGORIES.find(c => c.value === blog.category)?.label}
                                                </span>
                                            </div>
                                            
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                                                {blog.title}
                                            </h3>
                                            
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                                                {blog.excerpt}
                                            </p>

                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span>Created: {formatDate(blog.createdAt)}</span>
                                                {blog.publishedAt && (
                                                    <span>Published: {formatDate(blog.publishedAt)}</span>
                                                )}
                                                <span>{blog.readTime} min read</span>
                                                {blog.viewCount > 0 && (
                                                    <span>{blog.viewCount} views</span>
                                                )}
                                            </div>

                                            {/* Rejection Reason */}
                                            {blog.status === 'rejected' && blog.rejectionReason && (
                                                <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                                                    <strong>Rejection Reason:</strong> {blog.rejectionReason}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {blog.status === 'published' && (
                                                <a
                                                    href={`#/blog/${blog.slug}`}
                                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => navigate(`blog-edit/${blog._id}`)}
                                                className="p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(blog._id)}
                                                className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Blog?</h3>
                        <p className="text-gray-600 mb-6">
                            This action cannot be undone. Are you sure you want to delete this blog post?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteId(null)}
                                disabled={deleting}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBlogs;
