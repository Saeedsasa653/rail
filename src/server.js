import express from "express";

const app = express();

const TARGET_DOMAIN = (process.env.TARGET_DOMAIN || "").replace(/\/$/, "");
const BACKUP_DOMAIN = process.env.BACKUP_DOMAIN || "";
const PROXY_VERSION = "3.2.1";

const BLOCKED_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
]);

// 🔹 CORS
app.use((req, res, next) => {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "*");
  res.setHeader("access-control-allow-headers", "*");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// 🔹 helper: clean headers
function buildHeaders(req) {
  const headers = {};

  for (const key in req.headers) {
    const lower = key.toLowerCase();
    if (!BLOCKED_HEADERS.has(lower)) {
      headers[lower] = req.headers[key];
    }
  }

  // fake proxy headers
  headers["x-proxy-version"] = PROXY_VERSION;
  headers["x-forwarded-for"] = req.ip;

  return headers;
}

// 🔹 main proxy handler
app.use(async (req, res) => {
  try {
    if (!TARGET_DOMAIN && !BACKUP_DOMAIN) {
      return res.status(500).json({
        error: "TARGET_DOMAIN not set",
      });
    }

    const base = TARGET_DOMAIN || BACKUP_DOMAIN;

    const targetUrl = base + req.originalUrl;

    const options = {
      method: req.method,
      headers: buildHeaders(req),
    };

    // body support
    if (req.method !== "GET" && req.method !== "HEAD") {
      options.body = JSON.stringify(req.body);
      options.headers["content-type"] = "application/json";
    }

    const response = await fetch(targetUrl, options);

    const data = await response.text();

    // copy status
    res.status(response.status);

    // copy headers (safe ones)
    response.headers.forEach((value, key) => {
      if (!key.toLowerCase().includes("transfer-encoding")) {
        res.setHeader(key, value);
      }
    });

    res.send(data);
  } catch (err) {
    console.error("Proxy error:", err);

    res.status(502).json({
      error: "Bad Gateway",
      message: err.message,
    });
  }
});

// 🔹 start server
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("🚀 Proxy running on port", port);
});
