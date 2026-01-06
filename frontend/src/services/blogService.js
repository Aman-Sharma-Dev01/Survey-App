import { fetchApi } from './api';

// ==================== PUBLIC API ====================

/**
 * Get all published blogs with pagination and filters
 */
export const getBlogs = async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.tag) queryParams.append('tag', params.tag);
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.featured) queryParams.append('featured', params.featured);
    if (params.sort) queryParams.append('sort', params.sort);
    
    const query = queryParams.toString();
    return fetchApi(`/blogs${query ? `?${query}` : ''}`, 'GET', null, false);
};

/**
 * Get all available tags
 */
export const getBlogTags = async () => {
    return fetchApi('/blogs/tags', 'GET', null, false);
};

/**
 * Get single blog by slug
 */
export const getBlogBySlug = async (slug) => {
    return fetchApi(`/blogs/slug/${slug}`, 'GET', null, false);
};

/**
 * Get related blogs
 */
export const getRelatedBlogs = async (slug) => {
    return fetchApi(`/blogs/related/${slug}`, 'GET', null, false);
};

// ==================== AUTHENTICATED USER API ====================

/**
 * Create new blog post
 */
export const createBlog = async (blogData) => {
    return fetchApi('/blogs', 'POST', blogData, true);
};

/**
 * Get current user's blogs
 */
export const getMyBlogs = async () => {
    return fetchApi('/blogs/my-blogs', 'GET', null, true);
};

/**
 * Get blog by ID (for editing)
 */
export const getBlogById = async (id) => {
    return fetchApi(`/blogs/${id}`, 'GET', null, true);
};

/**
 * Update blog
 */
export const updateBlog = async (id, blogData) => {
    return fetchApi(`/blogs/${id}`, 'PUT', blogData, true);
};

/**
 * Delete blog
 */
export const deleteBlog = async (id) => {
    return fetchApi(`/blogs/${id}`, 'DELETE', null, true);
};

// ==================== ADMIN API ====================

/**
 * Get all blogs (admin only)
 */
export const getAllBlogsAdmin = async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    return fetchApi(`/blogs/admin/all${query ? `?${query}` : ''}`, 'GET', null, true);
};

/**
 * Approve blog (admin only)
 */
export const approveBlog = async (id) => {
    return fetchApi(`/blogs/admin/${id}/approve`, 'PUT', null, true);
};

/**
 * Reject blog (admin only)
 */
export const rejectBlog = async (id, reason) => {
    return fetchApi(`/blogs/admin/${id}/reject`, 'PUT', { reason }, true);
};

/**
 * Toggle featured status (admin only)
 */
export const toggleFeaturedBlog = async (id) => {
    return fetchApi(`/blogs/admin/${id}/feature`, 'PUT', null, true);
};

/**
 * Preview any blog by slug (admin only - including unpublished)
 */
export const getAdminBlogPreview = async (slug) => {
    return fetchApi(`/blogs/admin/preview/${slug}`, 'GET', null, true);
};

// ==================== VOTING API ====================

/**
 * Upvote a blog post
 */
export const upvoteBlog = async (slug) => {
    return fetchApi(`/blogs/vote/${slug}/upvote`, 'POST', null, true);
};

/**
 * Downvote a blog post
 */
export const downvoteBlog = async (slug) => {
    return fetchApi(`/blogs/vote/${slug}/downvote`, 'POST', null, true);
};

/**
 * Get vote status for a blog
 */
export const getVoteStatus = async (slug) => {
    return fetchApi(`/blogs/vote/${slug}/status`, 'GET', null, true);
};

// Blog categories
export const BLOG_CATEGORIES = [
    { value: 'surveys', label: 'Surveys' },
    { value: 'quizzes', label: 'Quizzes' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'best-practices', label: 'Best Practices' },
    { value: 'tutorials', label: 'Tutorials' },
    { value: 'news', label: 'News' },
    { value: 'tips', label: 'Tips & Tricks' },
    { value: 'other', label: 'Other' }
];
