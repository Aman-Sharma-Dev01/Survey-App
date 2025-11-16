import React, { useEffect, useMemo, useState } from "react";

/**
 * BLOG COMPONENT — Markdown-Based
 * Loads blog articles from:
 *    public/blog/<slug>.md
 *
 * postsData contains metadata ONLY.
 * Markdown content is fetched dynamically at runtime.
 */

// ---------------------- POSTS METADATA ----------------------
const postsData = [
  {
    slug: "customer-satisfaction-survey-guide",
    title: "The Complete Guide to Customer Satisfaction Surveys (2025 Edition)",
    date: "2025-01-10",
    author: "Asha Roy",
    tags: ["customer-experience", "best-practices"],
    excerpt:
      "Learn how to design, distribute, and analyze customer satisfaction surveys to improve retention and brand sentiment.",
  },
  {
    slug: "employee-feedback-best-practices",
    title: "Employee Feedback Best Practices Every Company Should Use",
    date: "2025-01-18",
    author: "Milan Kapoor",
    tags: ["hr", "best-practices", "workplace"],
    excerpt:
      "A complete framework for collecting meaningful feedback from employees to improve culture and productivity.",
  },
  {
    slug: "survey-distribution-strategies-2025",
    title: "Top Survey Distribution Strategies for 2025",
    date: "2025-01-25",
    author: "Lina Patel",
    tags: ["strategy", "survey-distribution"],
    excerpt:
      "Discover proven channels and strategies to maximize survey reach and increase response rates.",
  },
  {
    slug: "survey-writing-mistakes-to-avoid",
    title: "10 Survey Writing Mistakes You Must Avoid",
    date: "2025-02-02",
    author: "Arun Mehta",
    tags: ["survey-design", "mistakes"],
    excerpt:
      "Avoid these common survey writing mistakes to increase clarity, reduce bias, and improve response accuracy.",
  },
  {
    slug: "data-analysis-for-beginners",
    title: "Data Analysis for Beginners: Turning Survey Responses Into Insights",
    date: "2025-02-10",
    author: "Asha Roy",
    tags: ["data-analysis", "beginners"],
    excerpt:
      "A practical guide to cleaning, organizing, and analyzing survey data with confidence.",
  },
  {
    slug: "survey-templates-2025",
    title: "Top Survey Templates You Should Use in 2025",
    date: "2025-02-16",
    author: "Milan Kapoor",
    tags: ["templates", "survey-design"],
    excerpt:
      "A curated list of high-converting survey templates for education, HR, marketing, and customer research.",
  },
  {
    slug: "research-methods-modern-teams",
    title: "Modern Research Methods Every Team Should Use in 2025",
    date: "2025-02-20",
    author: "Lina Patel",
    tags: ["research", "methods"],
    excerpt:
      "Learn the most effective research methodologies used by modern teams to collect reliable data quickly.",
  },
  {
    slug: "survey-response-rates-improve",
    title: "How to Improve Survey Response Rates: Proven Techniques",
    date: "2025-02-25",
    author: "Arun Mehta",
    tags: ["engagement", "survey-response"],
    excerpt:
      "Boost your survey response rates using evidence-based techniques tested by successful organizations.",
  },
  {
    slug: "market-research-for-startups",
    title: "Market Research for Startups: A Practical Handbook (2025)",
    date: "2025-03-01",
    author: "Asha Roy",
    tags: ["startup", "market-research"],
    excerpt:
      "A complete market research framework built for early-stage founders and fast-moving product teams.",
  },
  {
    slug: "survey-tools-comparison-2025",
    title: "The Best Survey Tools of 2025 — Detailed SaaS Comparison",
    date: "2025-03-05",
    author: "Milan Kapoor",
    tags: ["comparison", "tools"],
    excerpt:
      "A full comparison of the best survey tools in 2025 — features, pricing, integrations, and ideal use-cases.",
  },
];

// ---------------------- HELPERS ----------------------
const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (_) {
    return iso;
  }
};

const estimateReadingTime = (text) =>
  Math.max(1, Math.round((text || "").split(/\s+/).length / 200));

// ---------------------- BLOG COMPONENT ----------------------
export default function BlogPage({ navigate, slug }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [page, setPage] = useState(1);
  const [postContent, setPostContent] = useState("");
  const perPage = 6;

  // ----- Fetch Markdown for SINGLE POST -----
  useEffect(() => {
    if (slug) {
      fetch(`/blog/${slug}.md`)
        .then((res) => res.text())
        .then((text) => setPostContent(text))
        .catch(() => setPostContent("ERROR"));
    }
  }, [slug]);

  // ----- Collect all unique tags -----
  const allTags = useMemo(() => {
    const s = new Set();
    postsData.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return [...s];
  }, []);

  // ----- Search + Tag filtering -----
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return postsData.filter((p) => {
      const mq =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q);
      const mt = !activeTag || p.tags.includes(activeTag);
      return mq && mt;
    });
  }, [query, activeTag]);

  // ----- Pagination -----
  const totalPages = Math.ceil(filtered.length / perPage);
  const start = (page - 1) * perPage;
  const visible = filtered.slice(start, start + perPage);

  // ----- SEO Meta Updates -----
  useEffect(() => {
    const t = document.querySelector("title");
    const d = document.querySelector('meta[name="description"]');

    if (slug) {
      const p = postsData.find((x) => x.slug === slug);
      if (p) {
        t.textContent = `${p.title} — SurveyZen`;
        d?.setAttribute("content", p.excerpt);
      }
    } else {
      t.textContent = "Blog — SurveyZen";
      d?.setAttribute(
        "content",
        "SurveyZen Blog: Professional insights on surveys, analytics, engagement, and modern research methods."
      );
    }
  }, [slug]);

  // ---------------------- SINGLE POST VIEW ----------------------
  if (slug) {
    const post = postsData.find((p) => p.slug === slug);

    if (!post) {
      return (
        <div className="max-w-4xl mx-auto py-20 text-center">
          <h2 className="text-2xl font-bold">Article not found</h2>
          <a href="#/blog" className="text-indigo-600 underline mt-4 block">
            Return to Blog
          </a>
        </div>
      );
    }

    return (
      <article className="max-w-3xl mx-auto px-6 py-16 prose prose-slate">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <p className="text-sm text-slate-500">
          {formatDate(post.date)} · {post.author}
        </p>

        {/* Content */}
        {postContent === "ERROR" ? (
          <p className="mt-6 text-red-500">
            Error loading this article. File missing or unreadable.
          </p>
        ) : (
          <div className="mt-6 whitespace-pre-wrap leading-relaxed">
            {postContent}
          </div>
        )}

        <footer className="mt-12 pt-6 border-t flex justify-between">
          <a href="#/blog" className="text-indigo-600 underline">
            ← Back to Blog
          </a>
        </footer>
      </article>
    );
  }

  // ---------------------- LIST VIEW ----------------------
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <h2 className="text-3xl font-extrabold">SurveyZen Blog</h2>
      <p className="mt-2 text-slate-600">
        Professional guides on surveys, analytics, customer insights, and research strategy.
      </p>

      {/* Search + Sidebar */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 p-4 bg-white border rounded-lg">
          <label className="block text-sm font-medium">Search</label>
          <input
            className="w-full border rounded px-2 py-1 mt-2 text-sm"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <h4 className="mt-6 font-semibold text-sm">Tags</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() => setActiveTag("")}
              className={`px-3 py-1 text-xs rounded-full ${
                !activeTag ? "bg-indigo-600 text-white" : "bg-gray-200"
              }`}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(t)}
                className={`px-3 py-1 text-xs rounded-full ${
                  activeTag === t ? "bg-indigo-600 text-white" : "bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </aside>

        {/* Posts List */}
        <div className="lg:col-span-3">
          <div className="grid gap-6">
            {visible.map((post) => (
              <article key={post.slug} className="p-6 bg-white border rounded-lg">
                <a
                  href={`/blog/${post.slug}`}
                  className="text-xl font-bold hover:underline"
                >
                  {post.title}
                </a>

                <p className="text-sm text-slate-500 mt-1">
                  {formatDate(post.date)} · {post.author}
                </p>

                <p className="mt-3 text-slate-700">{post.excerpt}</p>

                <a
                  href={`#blog/${post.slug}`}
                  className="text-indigo-600 underline mt-3 inline-block"
                >
                  Read more →
                </a>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Previous
            </button>

            <span>
              Page {page} / {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Export metadata for homepage "Latest Blog Posts"
export const blogPostsMeta = postsData;
