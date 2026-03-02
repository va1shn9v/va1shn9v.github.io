import { marked } from "marked";
import { mkdirSync, rmSync } from "node:fs";
import { join, basename } from "node:path";

interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
  html: string;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, body: match[2] };
}

function postTemplate(post: Post): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${post.title} — Vaishnav Potlapalli</title>
  <meta name="description" content="${post.description}" />
  <meta property="og:title" content="${post.title}" />
  <meta property="og:description" content="${post.description}" />
  <meta property="og:type" content="article" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>" />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css" />
  <style>
    :root {
      --bg: #EFF3F8;
      --card: #FFFFFF;
      --fg: #2B3044;
      --fg-secondary: #6B7189;
      --fg-dim: #9498AB;
      --accent: #4E7EC2;
      --accent-soft: rgba(78,126,194,.10);
      --accent-hover: #3D6BAD;
      --border: #D8DDE8;
      --border-light: #E6EAF0;
      --serif: 'Newsreader', Georgia, serif;
      --sans: 'DM Sans', system-ui, sans-serif;
      --shadow-sm: 0 1px 3px rgba(43,48,68,.06);
      --shadow-md: 0 4px 16px rgba(43,48,68,.07);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--sans);
      color: var(--fg);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
      line-height: 1.65;
      font-size: 16px;
    }
    .nav {
      max-width: 860px;
      margin: 0 auto;
      padding: 1.5rem 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: .85rem;
    }
    .nav a {
      color: var(--fg-dim);
      text-decoration: none;
      transition: color .2s;
    }
    .nav a:hover { color: var(--accent); }
    .nav .sep { color: var(--border); }
    article {
      max-width: 860px;
      margin: 0 auto;
      padding: 0 2rem 5rem;
    }
    article header { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
    article header h1 {
      font-family: var(--serif);
      font-size: 2.4rem;
      font-weight: 400;
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: .5rem;
    }
    article header time {
      font-size: .85rem;
      color: var(--fg-dim);
    }
    .prose h2 { font-family: var(--serif); font-size: 1.5rem; font-weight: 400; margin: 2.5rem 0 1rem; }
    .prose h3 { font-family: var(--serif); font-size: 1.2rem; font-weight: 500; margin: 2rem 0 .8rem; }
    .prose p { margin-bottom: 1.2rem; line-height: 1.8; color: var(--fg-secondary); }
    .prose a { color: var(--accent); text-decoration: none; border-bottom: 1px solid var(--border); transition: border-color .2s; }
    .prose a:hover { border-color: var(--accent); }
    .prose strong { color: var(--fg); font-weight: 600; }
    .prose img { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; }
    .prose blockquote {
      border-left: 3px solid var(--accent);
      padding: .8rem 1.2rem;
      margin: 1.5rem 0;
      background: var(--accent-soft);
      border-radius: 0 8px 8px 0;
    }
    .prose blockquote p { margin-bottom: 0; color: var(--fg-secondary); }
    .prose ul, .prose ol { margin: 1rem 0 1.2rem 1.5rem; color: var(--fg-secondary); }
    .prose li { margin-bottom: .4rem; line-height: 1.7; }
    .prose code {
      font-size: .88em;
      background: var(--accent-soft);
      padding: .15em .4em;
      border-radius: 4px;
      color: var(--fg);
    }
    .prose pre {
      margin: 1.5rem 0;
      padding: 1.2rem 1.4rem;
      background: var(--card);
      border: 1px solid var(--border-light);
      border-radius: 10px;
      overflow-x: auto;
      box-shadow: var(--shadow-sm);
    }
    .prose pre code {
      background: none;
      padding: 0;
      font-size: .85rem;
      line-height: 1.6;
    }
    .prose hr { border: none; border-top: 1px solid var(--border); margin: 2.5rem 0; }
    .prose table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: .9rem; }
    .prose th, .prose td { padding: .6rem .8rem; border: 1px solid var(--border-light); text-align: left; }
    .prose th { background: var(--accent-soft); font-weight: 600; color: var(--fg); }
    footer {
      max-width: 860px;
      margin: 0 auto;
      padding: 1.8rem 2rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: .8rem;
    }
    footer p { font-size: .8rem; color: var(--fg-dim); }
    footer a { font-size: .8rem; color: var(--accent); text-decoration: none; font-weight: 500; }
    footer a:hover { color: var(--accent-hover); }
    @media (max-width: 640px) {
      article { padding: 0 1.25rem 4rem; }
      article header h1 { font-size: 1.8rem; }
      .nav { padding: 1.2rem 1.25rem; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/">Vaishnav Potlapalli</a>
    <span class="sep">/</span>
    <a href="/blog/">Blog</a>
  </nav>
  <article>
    <header>
      <h1>${post.title}</h1>
      <time datetime="${post.date}">${formatDate(post.date)}</time>
    </header>
    <div class="prose">${post.html}</div>
  </article>
  <footer>
    <p><a href="/blog/">← All posts</a></p>
    <a href="mailto:vaishnav@vaishnavrao.com">say hello →</a>
  </footer>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>
</body>
</html>`;
}

function indexTemplate(posts: Post[]): string {
  const items = posts
    .map(
      (p) => `
      <a class="post-link" href="/blog/${p.slug}/">
        <div class="post-card">
          <div class="post-meta">
            <time datetime="${p.date}">${formatDate(p.date)}</time>
          </div>
          <h2 class="post-title">${p.title}</h2>
          ${p.description ? `<p class="post-desc">${p.description}</p>` : ""}
        </div>
      </a>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog — Vaishnav Potlapalli</title>
  <meta name="description" content="Writing by Vaishnav Potlapalli on ML, vision, and engineering." />
  <meta property="og:title" content="Blog — Vaishnav Potlapalli" />
  <meta property="og:type" content="website" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>" />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #EFF3F8;
      --card: #FFFFFF;
      --fg: #2B3044;
      --fg-secondary: #6B7189;
      --fg-dim: #9498AB;
      --accent: #4E7EC2;
      --accent-soft: rgba(78,126,194,.10);
      --accent-hover: #3D6BAD;
      --border: #D8DDE8;
      --border-light: #E6EAF0;
      --serif: 'Newsreader', Georgia, serif;
      --sans: 'DM Sans', system-ui, sans-serif;
      --shadow-sm: 0 1px 3px rgba(43,48,68,.06);
      --shadow-md: 0 4px 16px rgba(43,48,68,.07);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--sans);
      color: var(--fg);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
      line-height: 1.65;
      font-size: 16px;
    }
    .nav {
      max-width: 860px;
      margin: 0 auto;
      padding: 1.5rem 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: .85rem;
    }
    .nav a {
      color: var(--fg-dim);
      text-decoration: none;
      transition: color .2s;
    }
    .nav a:hover { color: var(--accent); }
    .nav .sep { color: var(--border); }
    .page {
      max-width: 860px;
      margin: 0 auto;
      padding: 0 2rem 5rem;
    }
    h1 {
      font-family: var(--serif);
      font-size: 2.4rem;
      font-weight: 400;
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: .5rem;
    }
    .subtitle {
      font-size: .95rem;
      color: var(--fg-secondary);
      margin-bottom: 2.5rem;
    }
    .posts { display: flex; flex-direction: column; gap: .75rem; }
    .post-link { text-decoration: none; color: inherit; }
    .post-card {
      padding: 1.15rem 1.35rem;
      background: var(--card);
      border: 1px solid var(--border-light);
      border-radius: 11px;
      transition: all .2s ease;
      box-shadow: var(--shadow-sm);
    }
    .post-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--border);
      transform: translateY(-1px);
    }
    .post-meta { margin-bottom: .3rem; }
    .post-meta time { font-size: .78rem; color: var(--fg-dim); }
    .post-title {
      font-family: var(--serif);
      font-size: 1.15rem;
      font-weight: 400;
      line-height: 1.35;
      color: var(--fg);
    }
    .post-desc {
      font-size: .88rem;
      color: var(--fg-secondary);
      margin-top: .3rem;
      line-height: 1.55;
    }
    footer {
      max-width: 860px;
      margin: 0 auto;
      padding: 1.8rem 2rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: .8rem;
    }
    footer p { font-size: .8rem; color: var(--fg-dim); }
    footer a { font-size: .8rem; color: var(--accent); text-decoration: none; font-weight: 500; }
    footer a:hover { color: var(--accent-hover); }
    @media (max-width: 640px) {
      .page { padding: 0 1.25rem 4rem; }
      h1 { font-size: 1.8rem; }
      .nav { padding: 1.2rem 1.25rem; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/">Vaishnav Potlapalli</a>
    <span class="sep">/</span>
    <a href="/blog/">Blog</a>
  </nav>
  <div class="page">
    <h1>Blog</h1>
    <p class="subtitle">Writing about ML, vision, engineering, and whatever else I find interesting.</p>
    <div class="posts">
${items}
    </div>
  </div>
  <footer>
    <p><a href="/">← Home</a></p>
    <a href="mailto:vaishnav@vaishnavrao.com">say hello →</a>
  </footer>
</body>
</html>`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

async function build() {
  const postsDir = join(import.meta.dir, "posts");
  const blogDir = join(import.meta.dir, "blog");

  rmSync(blogDir, { recursive: true, force: true });

  const glob = new Bun.Glob("*.md");
  const posts: Post[] = [];

  for await (const file of glob.scan(postsDir)) {
    const raw = await Bun.file(join(postsDir, file)).text();
    const { meta, body } = parseFrontmatter(raw);
    const slug = basename(file, ".md");
    const html = await marked(body);
    posts.push({
      slug,
      title: meta.title || slug,
      date: meta.date || "1970-01-01",
      description: meta.description || "",
      html,
    });
  }

  posts.sort((a, b) => (b.date > a.date ? 1 : -1));

  for (const post of posts) {
    const dir = join(blogDir, post.slug);
    mkdirSync(dir, { recursive: true });
    await Bun.write(join(dir, "index.html"), postTemplate(post));
  }

  mkdirSync(blogDir, { recursive: true });
  await Bun.write(join(blogDir, "index.html"), indexTemplate(posts));

  console.log(`Built ${posts.length} post(s) → blog/`);
}

build();
