import express from "express";

const app = express();

const DOMAIN_PORT = (process.env.DOMAIN_PORT || "").replace(/\/$/, "");
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

app.use((req, res, next) => {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "*");
  res.setHeader("access-control-allow-headers", "*");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

function buildHeaders(req) {
  const headers = {};

  for (const key in req.headers) {
    const lower = key.toLowerCase();
    if (!BLOCKED_HEADERS.has(lower)) {
      headers[lower] = req.headers[key];
    }
  }

  headers["x-proxy-version"] = PROXY_VERSION;
  headers["x-forwarded-for"] = req.ip;

  return headers;
}

app.use(async (req, res) => {
  try {
    if (!DOMAIN_PORT && !BACKUP_DOMAIN) {
      return res.status(500).json({
        error: "DOMAIN_PORT not set",
      });
    }

    const base = DOMAIN_PORT || BACKUP_DOMAIN;
    const targetUrl = base + req.originalUrl;

    const options = {
      method: req.method,
      headers: buildHeaders(req),
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      options.body = JSON.stringify(req.body);
      options.headers["content-type"] = "application/json";
    }

    const response = await fetch(targetUrl, options);
    const data = await response.text();

    res.status(response.status);

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

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("🚀 Proxy running on port", port);
});
