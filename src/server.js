import express from "express";
import http from "http";
import { createProxyServer } from "http-proxy";

const app = express();

// 🔥 آدرس کانفیگ داخل پنل سنایی
const TARGET = process.env.DOMAIN_PORT || "http://127.0.0.1:3030";

// ساخت proxy
const proxy = createProxyServer({
  target: TARGET,
  changeOrigin: true,
  ws: true,
  secure: false,
});

// برای دیباگ
proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err.message);

  if (!res.headersSent) {
    res.writeHead(502, { "Content-Type": "application/json" });
  }

  res.end(JSON.stringify({ error: "Bad Gateway" }));
});

// HTTP requests
app.use((req, res) => {
  proxy.web(req, res);
});

// ساخت سرور
const server = http.createServer(app);

// 🔥 مهم برای WebSocket
server.on("upgrade", (req, socket, head) => {
  proxy.ws(req, socket, head);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 WS Proxy running on port ${PORT}`);
  console.log(`➡️ Forwarding to ${TARGET}`);
});
