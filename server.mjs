import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import service from "./api/service.js";

const port = Number(process.env.PORT || 3000);
const files = new Map([["/", ["index.html", "text/html; charset=utf-8"]], ["/index.html", ["index.html", "text/html; charset=utf-8"]], ["/styles.css", ["styles.css", "text/css; charset=utf-8"]], ["/app.js", ["app.js", "text/javascript; charset=utf-8"]], ["/http.js", ["http.js", "text/javascript; charset=utf-8"]], ["/game.js", ["game.js", "text/javascript; charset=utf-8"]], ["/support.js", ["support.js", "text/javascript; charset=utf-8"]], ["/conversation.js", ["conversation.js", "text/javascript; charset=utf-8"]], ["/pub.js", ["pub.js", "text/javascript; charset=utf-8"]], ["/clubs.json", ["clubs.json", "application/json; charset=utf-8"]], ["/favicon.svg", ["favicon.svg", "image/svg+xml"]]]);
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname === "/api/service") {
      const chunks = []; let bytes = 0;
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 45000) { res.writeHead(413, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "The message is too long." })); return; } chunks.push(chunk); }
      const abort = new AbortController(); res.on("close", () => { if (!res.writableFinished) abort.abort(); });
      const request = new Request(url, { method: req.method, headers: req.headers, signal: abort.signal, ...(["GET", "HEAD"].includes(req.method) ? {} : { body: Buffer.concat(chunks).toString("utf8") }) });
      const response = await service.fetch(request); res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    const asset = files.get(url.pathname);
    if (!asset || !["GET", "HEAD"].includes(req.method)) { res.writeHead(404); res.end("Not found"); return; }
    const content = await readFile(fileURLToPath(new URL(`./public/${asset[0]}`, import.meta.url)));
    res.writeHead(200, { "Content-Type": asset[1], "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" }); res.end(req.method === "HEAD" ? undefined : content);
  } catch { if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "The request could not be processed." })); }
}).listen(port, "127.0.0.1", () => console.log(`Local: http://127.0.0.1:${port} · The Third Half`));
