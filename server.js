import express from "express";
import http from "http";
import { createProxyServer } from "http-proxy";

const app = express();

const TARGET = process.env.TARGET_DOMAIN;

if (!TARGET) {
  console.error("❌ TARGET_DOMAIN is missing");
  // ❌ به جای exit، سرویس بالا بمونه
}

const proxy = createProxyServer({
  target: TARGET || "http://example.com",
  changeOrigin: true,
  ws: true,
  secure: false,
});

proxy.on("error", (err) => {
  console.error("Proxy error:", err.message);
});

// HTTP
app.use((req, res) => {
  proxy.web(req, res, {}, (err) => {
    res.status(502).send("Bad Gateway");
  });
});

const server = http.createServer(app);

// WebSocket (safe)
server.on("upgrade", (req, socket, head) => {
  proxy.ws(req, socket, head, {}, () => {
    socket.destroy();
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 running on", PORT);
});
