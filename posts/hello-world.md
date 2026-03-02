---
title: Hello World
date: 2026-03-02
description: A first post to test the blog.
---

This is the first post on this blog. It's a test to make sure everything works — Markdown rendering, code blocks, typography, and the overall layout.

## Why build a blog from scratch?

Most static site generators come with a lot of machinery. Jekyll, Hugo, Gatsby — they're powerful, but for a simple personal blog they feel like bringing a crane to hang a picture frame.

This blog is powered by a single [Bun](https://bun.sh) script (~80 lines) that reads Markdown files from a `posts/` directory, converts them to HTML using `marked`, and writes static pages into `blog/`. That's it.

## What Markdown features are supported?

Pretty much everything you'd expect:

- **Bold** and *italic* text
- [Links](https://vaishnavrao.com) that go places
- Inline `code` for quick references
- Images, tables, blockquotes

> "The best writing tools are the ones that disappear."

### Code blocks

```python
def hello():
    print("Hello from the blog!")

for i in range(3):
    hello()
```

### Lists

1. Write a `.md` file in `posts/`
2. Run `bun run build`
3. Push to GitHub
4. Done

---

That's all there is to it.
