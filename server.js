import express from "express";
import fetch from "node-fetch";

const app = express();
const TARGET_DOMAIN = process.env.TARGET_DOMAIN;

app.use(async (req, res) => {
  try {
    const url = TARGET_DOMAIN + req.originalUrl;

    const response = await fetch(url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== "GET" ? req.body : undefined
    });

    const data = await response.text();

    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).send("Relay error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on", port));
