import express from 'express';
import Blog from '../models/Blog.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// GET /api/blogs - Get all published blogs (public)
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            tag, 
            category, 
            search,
            featured,
            sort = 'newest'
        } = req.query;

        const query = { 
            status: 'published', 
            isApproved: true 
        };

        // Filter by tag
        if (tag) {
            query.tags = tag.toLowerCase();
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter featured
        if (featured === 'true') {
            query.isFeatured = true;
        }

        // Search in title and excerpt
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } }
            ];
        }

        // Sorting
        let sortOption = { publishedAt: -1 }; // newest first by default
        if (sort === 'oldest') {
            sortOption = { publishedAt: 1 };
        } else if (sort === 'popular') {
            sortOption = { viewCount: -1 };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [blogs, total] = await Promise.all([
            Blog.find(query)
                .select('-content -rejectionReason')
                .sort(sortOption)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Blog.countDocuments(query)
        ]);

        res.json({
            blogs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Failed to fetch blogs' });
    }
});

// GET /api/blogs/tags - Get all unique tags
router.get('/tags', async (req, res) => {
    try {
        const tags = await Blog.distinct('tags', { 
            status: 'published', 
            isApproved: true 
        });
        res.json(tags.sort());
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tags' });
    }
});

// GET /api/blogs/slug/:slug - Get single blog by slug (public)
router.get('/slug/:slug', async (req, res) => {
    try {
        const blog = await Blog.findOne({ 
            slug: req.params.slug,
            status: 'published',
            isApproved: true
        }).lean();

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Increment view count
        await Blog.findByIdAndUpdate(blog._id, { $inc: { viewCount: 1 } });

        res.json(blog);
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ message: 'Failed to fetch blog' });
    }
});

// GET /api/blogs/related/:slug - Get related blogs
router.get('/related/:slug', async (req, res) => {
    try {
        const currentBlog = await Blog.findOne({ slug: req.params.slug });
        
        if (!currentBlog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        const relatedBlogs = await Blog.find({
            _id: { $ne: currentBlog._id },
            status: 'published',
            isApproved: true,
            $or: [
                { tags: { $in: currentBlog.tags } },
                { category: currentBlog.category }
            ]
        })
        .select('title slug excerpt coverImage authorName publishedAt readTime')
        .limit(3)
        .sort({ publishedAt: -1 })
        .lean();

        res.json(relatedBlogs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch related blogs' });
    }
});

// ==================== PROTECTED ROUTES (Logged-in users) ====================

// POST /api/blogs - Create new blog post
router.post('/', protect, async (req, res) => {
    try {
        const { 
            title, 
            excerpt, 
            content, 
            tags, 
            category, 
            coverImage,
            metaTitle,
            metaDescription
        } = req.body;

        if (!title || !excerpt || !content) {
            return res.status(400).json({ 
                message: 'Title, excerpt, and content are required' 
            });
        }

        // Create slug from title
        let slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        
        // Check if slug exists and make unique
        const existingSlug = await Blog.findOne({ slug });
        if (existingSlug) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        const blog = new Blog({
            title,
            slug,
            excerpt,
            content,
            tags: tags || [],
            category: category || 'other',
            coverImage: coverImage || {},
            author: req.user._id,
            authorName: req.user.name || req.user.email.split('@')[0],
            status: 'pending', // Needs admin approval
            isApproved: false,
            metaTitle: metaTitle || title,
            metaDescription: metaDescription || excerpt.substring(0, 160)
        });

        await blog.save();

        res.status(201).json({
            message: 'Blog submitted for review. It will be published after admin approval.',
            blog: {
                _id: blog._id,
                title: blog.title,
                slug: blog.slug,
                status: blog.status
            }
        });
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ message: 'Failed to create blog' });
    }
});

// GET /api/blogs/my-blogs - Get current user's blogs
router.get('/my-blogs', protect, async (req, res) => {
    try {
        const blogs = await Blog.find({ author: req.user._id })
            .select('-content')
            .sort({ createdAt: -1 })
            .lean();

        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch your blogs' });
    }
});

// GET /api/blogs/:id - Get blog by ID (for editing)
router.get('/:id', protect, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Only author or admin can view unpublished blog
        if (blog.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch blog' });
    }
});

// PUT /api/blogs/:id - Update blog
router.put('/:id', protect, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Only author can update
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { 
            title, 
            excerpt, 
            content, 
            tags, 
            category, 
            coverImage,
            metaTitle,
            metaDescription
        } = req.body;

        // Update fields
        if (title) blog.title = title;
        if (excerpt) blog.excerpt = excerpt;
        if (content) blog.content = content;
        if (tags) blog.tags = tags;
        if (category) blog.category = category;
        if (coverImage) blog.coverImage = coverImage;
        if (metaTitle) blog.metaTitle = metaTitle;
        if (metaDescription) blog.metaDescription = metaDescription;

        // If blog was published and is being edited, set back to pending
        if (blog.status === 'published') {
            blog.status = 'pending';
            blog.isApproved = false;
        }

        await blog.save();

        res.json({
            message: 'Blog updated and resubmitted for review',
            blog
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update blog' });
    }
});

// DELETE /api/blogs/:id - Delete blog
router.delete('/:id', protect, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Only author or admin can delete
        if (blog.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Blog.findByIdAndDelete(req.params.id);

        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete blog' });
    }
});

// ==================== ADMIN ROUTES ====================

// GET /api/blogs/admin/all - Get all blogs (admin only)
router.get('/admin/all', protect, adminOnly, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [blogs, total] = await Promise.all([
            Blog.find(query)
                .select('-content')
                .populate('author', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Blog.countDocuments(query)
        ]);

        res.json({
            blogs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch blogs' });
    }
});

// PUT /api/blogs/admin/:id/approve - Approve blog
router.put('/admin/:id/approve', protect, adminOnly, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        blog.status = 'published';
        blog.isApproved = true;
        blog.publishedAt = new Date();
        blog.rejectionReason = undefined;

        await blog.save();

        res.json({ 
            message: 'Blog approved and published successfully',
            blog 
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to approve blog' });
    }
});

// PUT /api/blogs/admin/:id/reject - Reject blog
router.put('/admin/:id/reject', protect, adminOnly, async (req, res) => {
    try {
        const { reason } = req.body;
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        blog.status = 'rejected';
        blog.isApproved = false;
        blog.rejectionReason = reason || 'Content does not meet our guidelines';

        await blog.save();

        res.json({ 
            message: 'Blog rejected',
            blog 
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reject blog' });
    }
});

// PUT /api/blogs/admin/:id/feature - Toggle featured status
router.put('/admin/:id/feature', protect, adminOnly, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        blog.isFeatured = !blog.isFeatured;
        await blog.save();

        res.json({ 
            message: `Blog ${blog.isFeatured ? 'featured' : 'unfeatured'} successfully`,
            isFeatured: blog.isFeatured 
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update blog' });
    }
});

export default router;
