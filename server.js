import express from "express";
import http from "http";
import { createProxyServer } from "http-proxy";

const app = express();

/**
 * 🔥 Target server (Xray / panel / node)
 * مثال:
 * https://your-server.com:443
 */
const TARGET = process.env.TARGET_DOMAIN;

// اگر تنظیم نشده
if (!TARGET) {
  console.log("❌ TARGET_DOMAIN is not set");
  process.exit(1);
}

const proxy = createProxyServer({
  target: TARGET,
  changeOrigin: true,
  ws: true,
  secure: false,
});

// HTTP proxy
app.use((req, res) => {
  proxy.web(req, res);
});

// WebSocket support (مهم برای VLESS WS / XHTTP relay)
const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  proxy.ws(req, socket, head);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Railway XHTTP Relay running on port", PORT);
  console.log("➡️ Target:", TARGET);
});
