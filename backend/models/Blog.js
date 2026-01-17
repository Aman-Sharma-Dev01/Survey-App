import mongoose from 'mongoose';

const blogSchema = mongoose.Schema(
    {
        title: { 
            type: String, 
            required: true,
            trim: true,
            maxLength: 200
        },
        slug: { 
            type: String, 
            required: true, 
            lowercase: true,
            trim: true
        },
        excerpt: { 
            type: String, 
            required: true,
            maxLength: 500
        },
        content: { 
            type: String, 
            required: true 
        },
        coverImage: {
            url: { type: String },
            publicId: { type: String }
        },
        author: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true, 
            ref: 'User' 
        },
        authorName: {
            type: String,
            required: true
        },
        tags: [{
            type: String,
            lowercase: true,
            trim: true
        }],
        category: {
            type: String,
            enum: ['surveys', 'quizzes', 'analytics', 'best-practices', 'tutorials', 'news', 'tips', 'other'],
            default: 'other'
        },
        status: {
            type: String,
            enum: ['draft', 'pending', 'published', 'rejected'],
            default: 'pending'
        },
        isApproved: {
            type: Boolean,
            default: false
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        viewCount: {
            type: Number,
            default: 0
        },
        upvotes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        downvotes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        readTime: {
            type: Number, // in minutes
            default: 5
        },
        publishedAt: {
            type: Date
        },
        rejectionReason: {
            type: String
        },
        metaTitle: {
            type: String,
            maxLength: 70
        },
        metaDescription: {
            type: String,
            maxLength: 160
        }
    },
    { timestamps: true }
);

// Create slug from title before saving
blogSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        
        // Add timestamp to ensure uniqueness
        this.slug = `${this.slug}-${Date.now().toString(36)}`;
    }
    
    // Calculate read time based on content length (average 200 words per minute)
    if (this.isModified('content')) {
        const wordCount = this.content.split(/\s+/).length;
        this.readTime = Math.max(1, Math.ceil(wordCount / 200));
    }
    
    next();
});

// Virtual for formatted date
blogSchema.virtual('formattedDate').get(function() {
    const date = this.publishedAt || this.createdAt;
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Indexes for better query performance
blogSchema.index({ slug: 1 }, { unique: true });
blogSchema.index({ author: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ isApproved: 1, status: 1 });

// Include virtuals in JSON output
blogSchema.set('toJSON', { virtuals: true });
blogSchema.set('toObject', { virtuals: true });

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
