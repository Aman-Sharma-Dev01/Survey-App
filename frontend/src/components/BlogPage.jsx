import React, { useEffect, useMemo, useState } from "react";
import LandingFooter from '../components/LandingFooter.jsx';
import LandingNavbar from '../components/LandingNavbar.jsx';
import { 
  BookOpen, 
  Calendar, 
  User, 
  Clock, 
  Tag, 
  Search, 
  ArrowLeft,
  ChevronRight,
  Eye,
  Loader,
  Plus,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { getBlogs, getBlogBySlug, getBlogTags, getRelatedBlogs, upvoteBlog, downvoteBlog, getVoteStatus, BLOG_CATEGORIES } from "../services/blogService";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * BLOG COMPONENT — Now fetches from API with static fallback
 */

// ---------------------- STATIC POSTS METADATA (Fallback) ----------------------
const staticPostsData = [
  {
    slug: "customer-satisfaction-survey-guide",
    title: "The Complete Guide to Customer Satisfaction Surveys (2025 Edition)",
    date: "2025-01-10",
    author: "Asha Roy",
    authorName: "Asha Roy",
    tags: ["customer-experience", "best-practices"],
    excerpt:
      "Learn how to design, distribute, and analyze customer satisfaction surveys to improve retention and brand sentiment.",
    readTime: 8,
    isStatic: true
  },
  {
    slug: "employee-feedback-best-practices",
    title: "Employee Feedback Best Practices Every Company Should Use",
    date: "2025-01-18",
    author: "Milan Kapoor",
    authorName: "Milan Kapoor",
    tags: ["hr", "best-practices", "workplace"],
    excerpt:
      "A complete framework for collecting meaningful feedback from employees to improve culture and productivity.",
    readTime: 6,
    isStatic: true
  },
  {
    slug: "survey-distribution-strategies-2025",
    title: "Top Survey Distribution Strategies for 2025",
    date: "2025-01-25",
    author: "Lina Patel",
    authorName: "Lina Patel",
    tags: ["strategy", "survey-distribution"],
    excerpt:
      "Discover proven channels and strategies to maximize survey reach and increase response rates.",
    readTime: 5,
    isStatic: true
  },
  {
    slug: "survey-writing-mistakes-to-avoid",
    title: "10 Survey Writing Mistakes You Must Avoid",
    date: "2025-02-02",
    author: "Arun Mehta",
    authorName: "Arun Mehta",
    tags: ["survey-design", "mistakes"],
    excerpt:
      "Avoid these common survey writing mistakes to increase clarity, reduce bias, and improve response accuracy.",
    readTime: 7,
    isStatic: true
  },
  {
    slug: "data-analysis-for-beginners",
    title: "Data Analysis for Beginners: Turning Survey Responses Into Insights",
    date: "2025-02-10",
    author: "Asha Roy",
    authorName: "Asha Roy",
    tags: ["data-analysis", "beginners"],
    excerpt:
      "A practical guide to cleaning, organizing, and analyzing survey data with confidence.",
    readTime: 10,
    isStatic: true
  },
  {
    slug: "survey-templates-2025",
    title: "Top Survey Templates You Should Use in 2025",
    date: "2025-02-16",
    author: "Milan Kapoor",
    authorName: "Milan Kapoor",
    tags: ["templates", "survey-design"],
    excerpt:
      "A curated list of high-converting survey templates for education, HR, marketing, and customer research.",
    readTime: 6,
    isStatic: true
  },
  {
    slug: "research-methods-modern-teams",
    title: "Modern Research Methods Every Team Should Use in 2025",
    date: "2025-02-20",
    author: "Lina Patel",
    authorName: "Lina Patel",
    tags: ["research", "methods"],
    excerpt:
      "Learn the most effective research methodologies used by modern teams to collect reliable data quickly.",
    readTime: 8,
    isStatic: true
  },
  {
    slug: "survey-response-rates-improve",
    title: "How to Improve Survey Response Rates: Proven Techniques",
    date: "2025-02-25",
    author: "Arun Mehta",
    authorName: "Arun Mehta",
    tags: ["engagement", "survey-response"],
    excerpt:
      "Boost your survey response rates using evidence-based techniques tested by successful organizations.",
    readTime: 7,
    isStatic: true
  },
  {
    slug: "market-research-for-startups",
    title: "Market Research for Startups: A Practical Handbook (2025)",
    date: "2025-03-01",
    author: "Asha Roy",
    authorName: "Asha Roy",
    tags: ["startup", "market-research"],
    excerpt:
      "A complete market research framework built for early-stage founders and fast-moving product teams.",
    readTime: 12,
    isStatic: true
  },
  {
    slug: "survey-tools-comparison-2025",
    title: "The Best Survey Tools of 2025 — Detailed SaaS Comparison",
    date: "2025-03-05",
    author: "Milan Kapoor",
    authorName: "Milan Kapoor",
    tags: ["comparison", "tools"],
    excerpt:
      "A full comparison of the best survey tools in 2025 — features, pricing, integrations, and ideal use-cases.",
    readTime: 15,
    isStatic: true
  },
];

// ---------------------- HELPERS ----------------------
const formatDate = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (_) {
    return dateStr;
  }
};

// ---------------------- BLOG COMPONENT ----------------------
export default function BlogPage({ navigate, slug }) {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [page, setPage] = useState(1);
  const [postContent, setPostContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);
  const [apiTags, setApiTags] = useState([]);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [singleBlog, setSingleBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const perPage = 9;

  // Voting state
  const [voteData, setVoteData] = useState({ upvotes: 0, downvotes: 0, userVote: null });
  const [voteLoading, setVoteLoading] = useState(false);

  // ----- Fetch blogs from API -----
  useEffect(() => {
    if (!slug) {
      fetchBlogs();
      fetchTags();
    }
  }, [slug, page, activeTag, activeCategory, query]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await getBlogs({
        page,
        limit: perPage,
        tag: activeTag,
        category: activeCategory,
        search: query,
        sort: 'newest'
      });
      
      // Combine API blogs with static blogs
      const apiBlogs = data.blogs || [];
      
      // If no API blogs and first page, show static blogs
      if (apiBlogs.length === 0 && page === 1 && !activeTag && !activeCategory && !query) {
        setBlogs(staticPostsData);
        setPagination({ pages: 1, total: staticPostsData.length });
      } else {
        setBlogs(apiBlogs);
        setPagination(data.pagination || { pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
      // Fallback to static posts
      setBlogs(staticPostsData);
      setPagination({ pages: 1, total: staticPostsData.length });
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const tags = await getBlogTags();
      // Combine with static tags
      const staticTags = [...new Set(staticPostsData.flatMap(p => p.tags))];
      const allTags = [...new Set([...tags, ...staticTags])];
      setApiTags(allTags.sort());
    } catch {
      const staticTags = [...new Set(staticPostsData.flatMap(p => p.tags))];
      setApiTags(staticTags.sort());
    }
  };

  // ----- Fetch single blog -----
  useEffect(() => {
    if (slug) {
      fetchSingleBlog(slug);
    }
  }, [slug]);

  // ----- Fetch vote status when blog loads -----
  useEffect(() => {
    if (slug && singleBlog && isAuthenticated && !singleBlog.isStatic) {
      fetchVoteStatus(slug);
    } else if (singleBlog) {
      // Set initial vote data from blog
      setVoteData({
        upvotes: singleBlog.upvotes?.length || 0,
        downvotes: singleBlog.downvotes?.length || 0,
        userVote: null
      });
    }
  }, [slug, singleBlog, isAuthenticated]);

  const fetchVoteStatus = async (blogSlug) => {
    try {
      const status = await getVoteStatus(blogSlug);
      setVoteData(status);
    } catch {
      // Silently fail
    }
  };

  const handleVote = async (type) => {
    if (!isAuthenticated) {
      navigate('login');
      return;
    }
    if (voteLoading || singleBlog?.isStatic) return;

    setVoteLoading(true);
    try {
      const result = type === 'up' 
        ? await upvoteBlog(slug)
        : await downvoteBlog(slug);
      setVoteData(result);
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setVoteLoading(false);
    }
  };

  const fetchSingleBlog = async (blogSlug) => {
    setLoading(true);
    try {
      // First try API
      const blog = await getBlogBySlug(blogSlug);
      setSingleBlog(blog);
      setPostContent(blog.content || '');
      
      // Get related blogs
      try {
        const related = await getRelatedBlogs(blogSlug);
        setRelatedBlogs(related);
      } catch {
        setRelatedBlogs([]);
      }
    } catch {
      // Fallback to static
      const staticBlog = staticPostsData.find(p => p.slug === blogSlug);
      if (staticBlog) {
        setSingleBlog(staticBlog);
        // Fetch markdown content for static blogs
        try {
          const res = await fetch(`/blog/${blogSlug}.md`);
          const text = await res.text();
          setPostContent(text);
        } catch {
          setPostContent('Content not available.');
        }
      } else {
        setSingleBlog(null);
        setPostContent('');
      }
      setRelatedBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  // ----- SEO Meta Updates -----
  useEffect(() => {
    const t = document.querySelector("title");
    const d = document.querySelector('meta[name="description"]');

    if (slug && singleBlog) {
      t.textContent = `${singleBlog.title} — SurveyZen Blog`;
      d?.setAttribute("content", singleBlog.excerpt || singleBlog.metaDescription);
    } else {
      t.textContent = "Blog — SurveyZen";
      d?.setAttribute(
        "content",
        "SurveyZen Blog: Professional insights on surveys, quizzes, analytics, and data-driven decision making."
      );
    }
  }, [slug, singleBlog]);

  // ---------------------- LOADING STATE ----------------------
  if (loading && slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // ---------------------- SINGLE POST VIEW ----------------------
  if (slug) {
    if (!singleBlog) {
      return (
        <div className="max-w-4xl mx-auto py-20 text-center px-4">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Article not found</h2>
          <p className="text-gray-500 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
          <a href="/blog" className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Return to Blog
          </a>
        </div>
      );
    }

    return (
      <article className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-gradient-to-b from-indigo-50 to-white py-12 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <a href="/blog" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </a>

            {/* Category & Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {singleBlog.category && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                  {BLOG_CATEGORIES.find(c => c.value === singleBlog.category)?.label || singleBlog.category}
                </span>
              )}
              {singleBlog.tags?.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              {singleBlog.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{singleBlog.authorName || singleBlog.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(singleBlog.publishedAt || singleBlog.date || singleBlog.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{singleBlog.readTime || 5} min read</span>
              </div>
              {singleBlog.viewCount > 0 && (
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{singleBlog.viewCount} views</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {singleBlog.coverImage?.url && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 mb-8">
            <img 
              src={singleBlog.coverImage.url} 
              alt={singleBlog.title}
              className="w-full rounded-2xl shadow-lg object-cover max-h-96"
            />
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="prose prose-lg prose-indigo max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-gray-700">
              {postContent}
            </div>
          </div>

          {/* Voting Section */}
          {!singleBlog.isStatic && (
            <div className="mt-10 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-center gap-6">
                <span className="text-gray-600 font-medium">Was this article helpful?</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleVote('up')}
                    disabled={voteLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                      voteData.userVote === 'up'
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                    } disabled:opacity-50`}
                  >
                    <ThumbsUp className={`h-5 w-5 ${voteData.userVote === 'up' ? 'fill-current' : ''}`} />
                    <span>{voteData.upvotes}</span>
                  </button>
                  <button
                    onClick={() => handleVote('down')}
                    disabled={voteLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                      voteData.userVote === 'down'
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    } disabled:opacity-50`}
                  >
                    <ThumbsDown className={`h-5 w-5 ${voteData.userVote === 'down' ? 'fill-current' : ''}`} />
                    <span>{voteData.downvotes}</span>
                  </button>
                </div>
              </div>
              {!isAuthenticated && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  <a href="/login" className="text-indigo-600 hover:underline">Sign in</a> to vote on this article
                </p>
              )}
            </div>
          )}
        </div>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 border-t border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Related Articles</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedBlogs.map((related, i) => (
                <a 
                  key={i}
                  href={`/blog/${related.slug}`}
                  className="group bg-gray-50 rounded-xl p-4 hover:bg-indigo-50 transition"
                >
                  <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 line-clamp-2 mb-2">
                    {related.title}
                  </h4>
                  <p className="text-sm text-gray-500">{related.readTime || 5} min read</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to create your own surveys?</h3>
            <a 
              href="/register" 
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
            >
              Get Started Free
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </article>
    );
  }

  // ---------------------- LIST VIEW ----------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <LandingNavbar />
      {/* Header */}
      <header className="bg-gradient-to-b from-indigo-600 to-indigo-700 text-white py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">SurveyZen Blog</h1>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-8">
            Expert guides on surveys, quizzes, data analytics, and research methodologies.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 transition"
            />
          </div>

          {/* Write Blog CTA for logged in users */}
          {isAuthenticated && (
            <div className="mt-6">
              <a 
                href="/blog-create" 
                className="inline-flex items-center gap-2 bg-white text-indigo-600 px-5 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition"
              >
                <Plus className="h-4 w-4" />
                Write a Blog Post
              </a>
            </div>
          )}
        </div>
      </header>
      

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 mb-8 lg:mb-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              {/* Categories */}
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-1 mb-6">
                <button
                  onClick={() => { setActiveCategory(""); setPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    !activeCategory ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </button>
                {BLOG_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => { setActiveCategory(cat.value); setPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      activeCategory === cat.value ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Tags */}
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setActiveTag(""); setPage(1); }}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    !activeTag ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {apiTags.slice(0, 15).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setActiveTag(t); setPage(1); }}
                    className={`px-3 py-1 text-xs rounded-full transition ${
                      activeTag === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Blog Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No articles found</h3>
                <p className="text-gray-500">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {blogs.map((post) => (
                    <article 
                      key={post.slug || post._id} 
                      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      {/* Cover Image */}
                      <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                        {post.coverImage?.url ? (
                          <img 
                            src={post.coverImage.url} 
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-indigo-300" />
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        {/* Meta */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <span>{formatDate(post.publishedAt || post.date || post.createdAt)}</span>
                          <span>•</span>
                          <span>{post.readTime || 5} min</span>
                          {post.viewCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.viewCount}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          <a href={`/blog/${post.slug}`}>{post.title}</a>
                        </h3>

                        {/* Excerpt */}
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{post.excerpt}</p>

                        {/* Author & Read More */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{post.authorName || post.author}</span>
                          <a 
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium hover:gap-2 transition-all"
                          >
                            Read <ChevronRight className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-10">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {page} of {pagination.pages}
                    </span>
                    <button
                      disabled={page === pagination.pages}
                      onClick={() => setPage(page + 1)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
        <LandingFooter />
    </div>
  );
}

// Export metadata for homepage "Latest Blog Posts" — combines static + API
export const blogPostsMeta = staticPostsData;
