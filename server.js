import express from "express";

const app = express();
const TARGET_DOMAIN = process.env.TARGET_DOMAIN;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all("*", async (req, res) => {
  try {
    if (!TARGET_DOMAIN) {
      return res.status(500).send("TARGET_DOMAIN not set");
    }

    const url = TARGET_DOMAIN + req.originalUrl;

    const response = await fetch(url, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(TARGET_DOMAIN).host
      },
      body: req.method !== "GET" && req.method !== "HEAD"
        ? JSON.stringify(req.body)
        : undefined
    });

    const data = await response.text();

    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).send("Relay error: " + err.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});
