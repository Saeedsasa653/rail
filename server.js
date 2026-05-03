import express from "express";
import http from "http";
import pkg from "http-proxy";

const { createProxyServer } = pkg;

const app = express();

const TARGET = "https://s2.jok3r.ir:443";

const proxy = createProxyServer({
  target: TARGET,
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

// WebSocket support
server.on("upgrade", (req, socket, head) => {
  proxy.ws(req, socket, head, {}, () => {
    socket.destroy();
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 running on", PORT);
  console.log("➡️ target:", TARGET);
});
