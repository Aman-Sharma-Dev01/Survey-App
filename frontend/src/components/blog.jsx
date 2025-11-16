import React, { useEffect, useMemo, useState } from 'react';

/**
 * Blog Section for SurveyZen
 * - Single-file React component (default export) that can be used as:
 *    <Blog navigate={navigate} />         // renders list view
 *    <Blog slug="how-to-create-surveys" /> // renders single post view
 *
 * - Tailwind CSS utility classes are used (no imports required).
 * - Includes: listing, search, tag filter, pagination, single-post view, SEO meta updates, RSS link.
 * - Replace `postsData` with your CMS/back-end fetch as needed.
 */

// ---------- Sample posts data (replace with API calls in production) ----------
const postsData = [
  {
    slug: 'how-to-create-effective-surveys-2025',
    title: 'How to Create Effective Surveys in 2025',
    date: '2025-07-10',
    author: 'Asha Roy',
    tags: ['survey-design', 'best-practices'],
    excerpt:
      'Practical tips and templates to design surveys that get honest, useful responses — from question phrasing to distribution strategies.',
    content: `
## Start with a clear goal
Every good survey begins with a single clear question you want to answer. Avoid mixing too many objectives in one survey.

## Keep it short
Shorter surveys convert better. Aim for 5–10 targeted questions when possible.

## Use simple language
Write questions in plain language and use consistent response scales. Test on a small group before sending.

## Distribute strategically
Choose channels where your audience is already active. Consider incentives thoughtfully.

## Analyze and act
Export data, visualize trends, and share a short summary with respondents to close the feedback loop.
    `,
  },
  {
    slug: 'surveyzen-vs-google-forms',
    title: 'SurveyZen vs Google Forms — A Practical Comparison',
    date: '2025-05-02',
    author: 'Milan Kapoor',
    tags: ['comparison', 'tools'],
    excerpt:
      'A straightforward feature-by-feature comparison between SurveyZen and Google Forms to help you choose the right tool for your needs.',
    content: `
### Interface & Templates
SurveyZen focuses on clean templates built for rapid feedback; Google Forms is flexible but can feel cluttered.

### Privacy & Data Control
SurveyZen provides anonymous response options and clearer export controls out of the box.

### Integrations
Both tools export CSV; SurveyZen offers fast Google Sheets integration and analytics dashboards.

### Pricing
Google Forms is free as part of Google Workspace; SurveyZen has a generous free tier and paid upgrades for teams.
    `,
  },
  {
    slug: '5-survey-templates-for-educators',
    title: '5 Survey Templates Every Educator Needs',
    date: '2025-03-18',
    author: 'Lina Patel',
    tags: ['templates', 'education'],
    excerpt:
      'Ready-to-use templates for course feedback, event evaluations, student check-ins, and parent surveys.',
    content: `
- Course feedback (short)
- Pre-course expectations
- Post-event evaluation
- Student weekly check-in
- Parent/guardian consent & feedback

Each template includes recommended questions and a short note about expected sample sizes.
    `,
  },
];

// ---------- Helpers ----------
const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return iso;
  }
};

const estimateReadingTime = (text) => {
  const words = (text || '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
};

// ---------- Blog Component ----------
export default function Blog({ navigate, slug }) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 6;

  // collect unique tags
  const allTags = useMemo(() => {
    const s = new Set();
    postsData.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s);
  }, []);

  // derived posts (search + tag filter)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return postsData.filter((p) => {
      const matchQuery =
        !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
      const matchTag = !activeTag || p.tags.includes(activeTag);
      return matchQuery && matchTag;
    });
  }, [query, activeTag]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  useEffect(() => {
    // Update page title & meta description dynamically for SEO
    const titleEl = document.querySelector('title');
    const descEl = document.querySelector('meta[name="description"]');

    if (slug) {
      const post = postsData.find((p) => p.slug === slug);
      if (post) {
        titleEl.textContent = `${post.title} — SurveyZen`;
        if (descEl) descEl.setAttribute('content', post.excerpt);
      }
    } else {
      titleEl.textContent = 'Blog — SurveyZen';
      if (descEl)
        descEl.setAttribute(
          'content',
          'SurveyZen blog: tips, templates and best practices for surveys, research, and feedback.'
        );
    }
  }, [slug]);

  // when slug is present, render single article
  if (slug) {
    const post = postsData.find((p) => p.slug === slug);
    if (!post) {
      return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold">Article not found</h2>
          <p className="mt-4 text-slate-600">We couldn't find the article you were looking for.</p>
          <div className="mt-6">
            <a href="#/blog" className="text-indigo-600 hover:underline">
              Back to blog
            </a>
          </div>
        </div>
      );
    }

    return (
      <article className="max-w-3xl mx-auto px-6 py-16 prose prose-slate">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">{post.title}</h1>
          <div className="mt-2 text-sm text-slate-500">{formatDate(post.date)} · {post.author} · {estimateReadingTime(post.content)} min read</div>
        </header>

        <section className="mt-6">
          {/* naive markdown-like rendering for the content (you can replace with a markdown renderer) */}
          {post.content.split('\n\n').map((block, idx) => (
            <p key={idx} className="text-slate-700 leading-relaxed">{block}</p>
          ))}
        </section>

        <footer className="mt-12 border-t pt-6 flex justify-between items-center">
          <div>
            <div className="text-sm text-slate-600">Tags:</div>
            <div className="mt-2 flex gap-2 flex-wrap">
              {post.tags.map((t) => (
                <a key={t} href={`#/blog?tag=${encodeURIComponent(t)}`} className="text-xs px-3 py-1 bg-slate-100 rounded-full text-slate-700 hover:bg-slate-200">
                  {t}
                </a>
              ))}
            </div>
          </div>

          <div className="text-right">
            <a href="#/blog" className="text-indigo-600 hover:underline">Back to Blog</a>
          </div>
        </footer>
      </article>
    );
  }

  // LIST VIEW
  const start = (page - 1) * perPage;
  const visible = filtered.slice(start, start + perPage);

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold">SurveyZen Blog</h2>
          <p className="mt-2 text-slate-600">Tips, templates and best practices for surveys, research and feedback.</p>
        </div>

        <div className="flex items-center gap-4">
          <a href="/rss.xml" className="text-sm text-indigo-600 hover:underline">RSS</a>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <div className="p-4 bg-white rounded-lg border">
            <label className="block text-sm font-medium text-slate-700">Search</label>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search articles"
              className="mt-2 w-full px-3 py-2 border rounded-md text-sm"
            />

            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-700">Tags</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className={`text-xs px-3 py-1 rounded-full ${!activeTag ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                  onClick={() => { setActiveTag(''); setPage(1); }}
                >
                  All
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    className={`text-xs px-3 py-1 rounded-full ${activeTag === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    onClick={() => { setActiveTag(t); setPage(1); }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-700">About this blog</h4>
              <p className="mt-2 text-sm text-slate-600">Practical guides and templates to help you collect better feedback and run effective research.</p>
            </div>
          </div>
        </aside>

        {/* Articles */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="grid gap-6">
            {visible.map((post) => (
              <article key={post.slug} className="p-6 bg-white rounded-lg border">
                <div className="flex flex-col md:flex-row md:items-start md:gap-6">
                  <div className="flex-1">
                    <a href={`#/blog/${post.slug}`} className="text-xl font-semibold text-gray-900 hover:underline">{post.title}</a>
                    <div className="mt-2 text-sm text-slate-500">{formatDate(post.date)} · {post.author} · {estimateReadingTime(post.content)} min read</div>
                    <p className="mt-4 text-slate-700">{post.excerpt}</p>

                    <div className="mt-4 flex items-center gap-3">
                      <a href={`#/blog/${post.slug}`} className="text-indigo-600 hover:underline">Read more</a>
                      <div className="text-xs text-slate-500">{post.tags.map((t) => <span key={t} className="inline-block px-2 py-1 bg-slate-100 rounded-full mr-2">{t}</span>)}</div>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-slate-600">Showing {start + 1}-{Math.min(start + perPage, filtered.length)} of {filtered.length}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="text-sm">Page {page} / {totalPages}</div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
