import React, { useState, useRef, useEffect } from 'react';
import { 
    ArrowLeft, 
    Save, 
    Eye, 
    Image as ImageIcon, 
    X, 
    Loader, 
    FileText,
    Tag,
    Send,
    CheckCircle,
    Edit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { createBlog, updateBlog, getBlogById, BLOG_CATEGORIES } from '../services/blogService';
import { uploadImage, deleteImage } from '../services/uploadService';

const BlogCreate = ({ navigate, editId }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!editId);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        category: 'other',
        tags: '',
        coverImage: null,
        metaTitle: '',
        metaDescription: ''
    });

    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    // Load blog data for editing
    useEffect(() => {
        if (editId) {
            setIsEditMode(true);
            loadBlogData();
        }
    }, [editId]);

    const loadBlogData = async () => {
        try {
            setInitialLoading(true);
            const blog = await getBlogById(editId);
            setFormData({
                title: blog.title || '',
                excerpt: blog.excerpt || '',
                content: blog.content || '',
                category: blog.category || 'other',
                tags: blog.tags?.join(', ') || '',
                coverImage: blog.coverImage || null,
                metaTitle: blog.metaTitle || '',
                metaDescription: blog.metaDescription || ''
            });
        } catch (err) {
            setError('Failed to load blog: ' + (err.message || 'Unknown error'));
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const result = await uploadImage(file);
            setFormData(prev => ({
                ...prev,
                coverImage: { url: result.url, publicId: result.publicId }
            }));
        } catch (err) {
            setError('Failed to upload image: ' + err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = async () => {
        if (formData.coverImage?.publicId) {
            try {
                await deleteImage(formData.coverImage.publicId);
            } catch (err) {
                console.error('Failed to delete image:', err);
            }
        }
        setFormData(prev => ({ ...prev, coverImage: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }
        if (!formData.excerpt.trim()) {
            setError('Excerpt is required');
            return;
        }
        if (!formData.content.trim()) {
            setError('Content is required');
            return;
        }
        if (formData.content.length < 100) {
            setError('Content must be at least 100 characters');
            return;
        }

        setLoading(true);
        try {
            const tags = formData.tags
                .split(',')
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 0);

            const blogData = {
                title: formData.title.trim(),
                excerpt: formData.excerpt.trim(),
                content: formData.content.trim(),
                category: formData.category,
                tags,
                coverImage: formData.coverImage || undefined,
                metaTitle: formData.metaTitle.trim() || undefined,
                metaDescription: formData.metaDescription.trim() || undefined
            };

            if (isEditMode && editId) {
                await updateBlog(editId, blogData);
            } else {
                await createBlog(blogData);
            }

            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to submit blog');
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while fetching blog data for editing
    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading blog...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isEditMode ? 'Blog Updated!' : 'Blog Submitted!'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {isEditMode 
                            ? 'Your blog has been updated and resubmitted for review.'
                            : 'Your blog has been submitted for review. It will be published after admin approval.'
                        }
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate('home')}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                        >
                            Back to Home
                        </button>
                        <button
                            onClick={() => {
                                setSuccess(false);
                                setFormData({
                                    title: '',
                                    excerpt: '',
                                    content: '',
                                    category: 'other',
                                    tags: '',
                                    coverImage: null,
                                    metaTitle: '',
                                    metaDescription: ''
                                });
                            }}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                        >
                            Write Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('home')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {isEditMode && <Edit className="h-5 w-5 text-indigo-600" />}
                        {isEditMode ? 'Edit Blog Post' : 'Write a Blog Post'}
                    </h1>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">{showPreview ? 'Edit' : 'Preview'}</span>
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader className="h-4 w-4 animate-spin" />
                            ) : isEditMode ? (
                                <Save className="h-4 w-4" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">{isEditMode ? 'Update' : 'Submit'}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {showPreview ? (
                    // Preview Mode
                    <div className="bg-white rounded-2xl shadow-sm p-8">
                        {formData.coverImage?.url && (
                            <img 
                                src={formData.coverImage.url} 
                                alt="Cover" 
                                className="w-full h-64 object-cover rounded-xl mb-6"
                            />
                        )}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                                {BLOG_CATEGORIES.find(c => c.value === formData.category)?.label}
                            </span>
                            {formData.tags && formData.tags.split(',').map((tag, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            {formData.title || 'Untitled'}
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">{formData.excerpt}</p>
                        <div className="prose max-w-none">
                            <div className="whitespace-pre-wrap">{formData.content}</div>
                        </div>
                    </div>
                ) : (
                    // Edit Mode
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Cover Image */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                <ImageIcon className="h-4 w-4 inline mr-2" />
                                Cover Image (Optional)
                            </label>
                            {formData.coverImage?.url ? (
                                <div className="relative inline-block">
                                    <img 
                                        src={formData.coverImage.url} 
                                        alt="Cover" 
                                        className="w-full max-w-md h-48 object-cover rounded-xl"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex items-center gap-2 px-6 py-12 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition w-full justify-center"
                                >
                                    {uploading ? (
                                        <Loader className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <ImageIcon className="h-6 w-6" />
                                    )}
                                    {uploading ? 'Uploading...' : 'Click to upload cover image'}
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        {/* Title & Excerpt */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Enter an engaging title..."
                                    maxLength={200}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                                />
                                <p className="text-xs text-gray-400 mt-1">{formData.title.length}/200</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Excerpt / Summary *
                                </label>
                                <textarea
                                    name="excerpt"
                                    value={formData.excerpt}
                                    onChange={handleChange}
                                    placeholder="Brief summary of your blog post..."
                                    maxLength={500}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <p className="text-xs text-gray-400 mt-1">{formData.excerpt.length}/500</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <FileText className="h-4 w-4 inline mr-2" />
                                Content *
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="Write your blog content here... (Markdown supported)"
                                rows={15}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {formData.content.length} characters · ~{Math.ceil(formData.content.split(/\s+/).filter(w => w).length / 200)} min read
                            </p>
                        </div>

                        {/* Category & Tags */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {BLOG_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Tag className="h-4 w-4 inline mr-2" />
                                    Tags (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleChange}
                                    placeholder="e.g., surveys, tips, analytics"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* SEO (Optional) */}
                        <details className="bg-white rounded-2xl shadow-sm p-6">
                            <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
                                SEO Settings (Optional)
                            </summary>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Meta Title</label>
                                    <input
                                        type="text"
                                        name="metaTitle"
                                        value={formData.metaTitle}
                                        onChange={handleChange}
                                        placeholder="SEO title (defaults to blog title)"
                                        maxLength={70}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Meta Description</label>
                                    <textarea
                                        name="metaDescription"
                                        value={formData.metaDescription}
                                        onChange={handleChange}
                                        placeholder="SEO description (defaults to excerpt)"
                                        maxLength={160}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </details>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('home')}
                                className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                Submit for Review
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
};

export default BlogCreate;
