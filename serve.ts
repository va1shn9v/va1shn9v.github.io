import { join } from "node:path";

const root = import.meta.dir;

Bun.serve({
  port: 3000,
  async fetch(req) {
    let pathname = new URL(req.url).pathname;

    if (pathname.endsWith("/")) pathname += "index.html";
    if (!pathname.includes(".")) pathname += "/index.html";

    const file = Bun.file(join(root, pathname));
    if (await file.exists()) return new Response(file);

    return new Response("Not Found", { status: 404 });
  },
});

console.log("Serving at http://localhost:3000");
