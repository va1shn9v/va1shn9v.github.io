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
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css" />
  <style>
    :root {
      --bg: #F4F1EB;
      --bg-warm: #EDE9E0;
      --card-bg: rgba(255,253,248,0.55);
      --card-border: rgba(168,155,130,0.18);
      --card-hover: rgba(255,253,248,0.85);
      --fg: #2C2F26;
      --fg-secondary: #5C5F52;
      --fg-dim: #8A8D7E;
      --accent: #B8860B;
      --accent-soft: rgba(184,134,11,0.08);
      --accent-hover: #9A7209;
      --green-deep: #3A4A32;
      --green-mid: #5A6B4F;
      --green-soft: rgba(90,107,79,0.08);
      --green-border: rgba(90,107,79,0.15);
      --warm-shadow: rgba(80,70,45,0.08);
      --serif: 'Libre Baskerville', Georgia, serif;
      --sans: 'Outfit', system-ui, sans-serif;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--sans);
      color: var(--fg);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      line-height: 1.65;
      font-size: 16px;
      overflow-x: hidden;
    }
    .ambient {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .ambient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.35;
      animation: drift 25s ease-in-out infinite alternate;
    }
    .ambient-orb:nth-child(1) {
      width: 600px; height: 600px;
      background: radial-gradient(circle, #D4C98A 0%, transparent 70%);
      top: -10%; right: -5%;
    }
    .ambient-orb:nth-child(2) {
      width: 500px; height: 500px;
      background: radial-gradient(circle, #A3B88C 0%, transparent 70%);
      bottom: 10%; left: -8%;
      animation-delay: -8s;
      animation-duration: 30s;
    }
    .ambient-orb:nth-child(3) {
      width: 400px; height: 400px;
      background: radial-gradient(circle, #E8D5A3 0%, transparent 70%);
      top: 40%; right: 20%;
      animation-delay: -15s;
      animation-duration: 22s;
      opacity: 0.2;
    }
    @keyframes drift {
      0% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -20px) scale(1.05); }
      66% { transform: translate(-20px, 15px) scale(0.97); }
      100% { transform: translate(15px, -10px) scale(1.02); }
    }
    body::before {
      content: '';
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 1;
      pointer-events: none;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      background-repeat: repeat;
      background-size: 256px 256px;
    }
    .content-wrap { position: relative; z-index: 2; }
    .nav {
      max-width: 860px;
      margin: 0 auto;
      padding: 1.8rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
    }
    .nav-star {
      width: 22px; height: 22px;
      position: relative;
      animation: spin-slow 8s linear infinite;
    }
    .nav-star::before, .nav-star::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--accent);
      clip-path: polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%);
    }
    .nav-star::after { transform: rotate(45deg); opacity: 0.5; }
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .nav-links { display: flex; gap: 1.8rem; align-items: center; }
    .nav-links a, .nav-home {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--fg-dim);
      text-decoration: none;
      letter-spacing: 0.03em;
      transition: color 0.2s;
    }
    .nav-links a:hover, .nav-home:hover { color: var(--accent); }
    article {
      max-width: 860px;
      margin: 0 auto;
      padding: 4rem 2rem 5rem;
    }
    article header { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--card-border); }
    article header h1 {
      font-family: var(--serif);
      font-size: 2.4rem;
      font-weight: 400;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: var(--green-deep);
      margin-bottom: .5rem;
    }
    article header time { font-size: .85rem; color: var(--fg-dim); font-weight: 500; }
    .prose h2 { font-family: var(--serif); font-size: 1.5rem; font-weight: 400; color: var(--green-deep); margin: 2.5rem 0 1rem; }
    .prose h3 { font-family: var(--serif); font-size: 1.2rem; font-weight: 400; color: var(--green-deep); margin: 2rem 0 .8rem; }
    .prose p { margin-bottom: 1.2rem; line-height: 1.85; color: var(--fg-secondary); }
    .prose a { color: var(--accent); text-decoration: none; border-bottom: 1px solid rgba(184,134,11,0.25); transition: border-color .2s; }
    .prose a:hover { border-color: var(--accent); }
    .prose strong { color: var(--fg); font-weight: 600; }
    .prose img { max-width: 100%; height: auto; border-radius: 12px; margin: 1.5rem 0; box-shadow: 0 4px 16px var(--warm-shadow); }
    .prose blockquote {
      border-left: 3px solid var(--accent);
      padding: 1rem 1.4rem;
      margin: 1.5rem 0;
      background: var(--accent-soft);
      border-radius: 0 10px 10px 0;
    }
    .prose blockquote p { margin-bottom: 0; color: var(--fg-secondary); font-style: italic; }
    .prose ul, .prose ol { margin: 1rem 0 1.2rem 1.5rem; color: var(--fg-secondary); }
    .prose li { margin-bottom: .4rem; line-height: 1.7; }
    .prose code {
      font-size: .88em;
      background: var(--green-soft);
      padding: .15em .4em;
      border-radius: 5px;
      color: var(--green-deep);
      border: 1px solid var(--green-border);
    }
    .prose pre {
      margin: 1.5rem 0;
      padding: 1.2rem 1.4rem;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow-x: auto;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .prose pre code { background: none; padding: 0; border: none; font-size: .85rem; line-height: 1.6; color: var(--fg); }
    .prose hr { border: none; border-top: 1px solid var(--card-border); margin: 2.5rem 0; }
    .prose table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: .9rem; }
    .prose th, .prose td { padding: .6rem .8rem; border: 1px solid var(--card-border); text-align: left; }
    .prose th { background: var(--green-soft); font-weight: 600; color: var(--green-deep); }
    footer {
      max-width: 860px;
      margin: 0 auto;
      padding: 2rem;
      border-top: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: .8rem;
    }
    footer p { font-size: .78rem; color: var(--fg-dim); }
    footer a { font-size: .78rem; color: var(--accent); text-decoration: none; font-weight: 500; transition: color .2s; }
    footer a:hover { color: var(--accent-hover); }
    @media (max-width: 640px) {
      article { padding: 3rem 1.25rem 4rem; }
      article header h1 { font-size: 1.8rem; }
      .nav { padding: 1.2rem 1.25rem; }
      .nav-links { gap: 1rem; }
      .nav-links a { font-size: 0.75rem; }
    }
  </style>
</head>
<body>
  <div class="ambient">
    <div class="ambient-orb"></div>
    <div class="ambient-orb"></div>
    <div class="ambient-orb"></div>
  </div>
  <div class="content-wrap">
    <nav class="nav">
      <a class="nav-home" href="/"><div class="nav-star"></div></a>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/blog/" style="color: var(--accent);">Blog</a>
        <a href="https://github.com/va1shn9v/" target="_blank" rel="noopener">GitHub</a>
        <a href="https://twitter.com/__vaishnav" target="_blank" rel="noopener">Twitter</a>
      </div>
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
      <a href="mailto:pvaishnav2718@gmail.com">say hello →</a>
    </footer>
  </div>
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
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #F4F1EB;
      --bg-warm: #EDE9E0;
      --card-bg: rgba(255,253,248,0.55);
      --card-border: rgba(168,155,130,0.18);
      --card-hover: rgba(255,253,248,0.85);
      --fg: #2C2F26;
      --fg-secondary: #5C5F52;
      --fg-dim: #8A8D7E;
      --accent: #B8860B;
      --accent-soft: rgba(184,134,11,0.08);
      --accent-hover: #9A7209;
      --green-deep: #3A4A32;
      --green-mid: #5A6B4F;
      --green-soft: rgba(90,107,79,0.08);
      --green-border: rgba(90,107,79,0.15);
      --warm-shadow: rgba(80,70,45,0.08);
      --serif: 'Libre Baskerville', Georgia, serif;
      --sans: 'Outfit', system-ui, sans-serif;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--sans);
      color: var(--fg);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      line-height: 1.65;
      font-size: 16px;
      overflow-x: hidden;
    }
    .ambient {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .ambient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.35;
      animation: drift 25s ease-in-out infinite alternate;
    }
    .ambient-orb:nth-child(1) {
      width: 600px; height: 600px;
      background: radial-gradient(circle, #D4C98A 0%, transparent 70%);
      top: -10%; right: -5%;
    }
    .ambient-orb:nth-child(2) {
      width: 500px; height: 500px;
      background: radial-gradient(circle, #A3B88C 0%, transparent 70%);
      bottom: 10%; left: -8%;
      animation-delay: -8s;
      animation-duration: 30s;
    }
    .ambient-orb:nth-child(3) {
      width: 400px; height: 400px;
      background: radial-gradient(circle, #E8D5A3 0%, transparent 70%);
      top: 40%; right: 20%;
      animation-delay: -15s;
      animation-duration: 22s;
      opacity: 0.2;
    }
    @keyframes drift {
      0% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -20px) scale(1.05); }
      66% { transform: translate(-20px, 15px) scale(0.97); }
      100% { transform: translate(15px, -10px) scale(1.02); }
    }
    body::before {
      content: '';
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 1;
      pointer-events: none;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      background-repeat: repeat;
      background-size: 256px 256px;
    }
    .content-wrap { position: relative; z-index: 2; }
    .nav {
      max-width: 860px;
      margin: 0 auto;
      padding: 1.8rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
    }
    .nav-star {
      width: 22px; height: 22px;
      position: relative;
      animation: spin-slow 8s linear infinite;
    }
    .nav-star::before, .nav-star::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--accent);
      clip-path: polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%);
    }
    .nav-star::after { transform: rotate(45deg); opacity: 0.5; }
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .nav-links { display: flex; gap: 1.8rem; align-items: center; }
    .nav-links a, .nav-home {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--fg-dim);
      text-decoration: none;
      letter-spacing: 0.03em;
      transition: color 0.2s;
    }
    .nav-links a:hover, .nav-home:hover { color: var(--accent); }
    .page {
      max-width: 860px;
      margin: 0 auto;
      padding: 4rem 2rem 5rem;
    }
    h1 {
      font-family: var(--serif);
      font-size: 2.4rem;
      font-weight: 400;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: var(--green-deep);
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
      padding: 1.4rem 1.6rem;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: all .25s ease;
    }
    .post-card:hover {
      background: var(--card-hover);
      border-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px var(--warm-shadow);
    }
    .post-meta { margin-bottom: .35rem; }
    .post-meta time { font-size: .78rem; font-weight: 500; color: var(--fg-dim); }
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
      margin-top: .35rem;
      line-height: 1.6;
    }
    .post-card:hover .post-title { color: var(--accent); }
    footer {
      max-width: 860px;
      margin: 0 auto;
      padding: 2rem;
      border-top: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: .8rem;
    }
    footer p { font-size: .78rem; color: var(--fg-dim); }
    footer a { font-size: .78rem; color: var(--accent); text-decoration: none; font-weight: 500; transition: color .2s; }
    footer a:hover { color: var(--accent-hover); }
    @media (max-width: 640px) {
      .page { padding: 3rem 1.25rem 4rem; }
      h1 { font-size: 1.8rem; }
      .nav { padding: 1.2rem 1.25rem; }
      .nav-links { gap: 1rem; }
      .nav-links a { font-size: 0.75rem; }
    }
  </style>
</head>
<body>
  <div class="ambient">
    <div class="ambient-orb"></div>
    <div class="ambient-orb"></div>
    <div class="ambient-orb"></div>
  </div>
  <div class="content-wrap">
    <nav class="nav">
      <a class="nav-home" href="/"><div class="nav-star"></div></a>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/blog/" style="color: var(--accent);">Blog</a>
        <a href="https://github.com/va1shn9v/" target="_blank" rel="noopener">GitHub</a>
        <a href="https://twitter.com/__vaishnav" target="_blank" rel="noopener">Twitter</a>
      </div>
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
      <a href="mailto:pvaishnav2718@gmail.com">say hello →</a>
    </footer>
  </div>
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
