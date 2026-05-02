const express = require("express");
const axios = require("axios");
const https = require("https");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const TARGET = "https://s2.jok3r.ir:3030";

// 🔥 تنظیم مهم SSL
const agent = new https.Agent({
  rejectUnauthorized: false, // موقت برای رد نشدن SSL
  servername: "s2.jok3r.ir"  // SNI درست
});

app.use("/", async (req, res) => {
  try {
    const url = TARGET + req.url;

    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      httpsAgent: agent,
      headers: {
        ...req.headers,
        host: "s2.jok3r.ir" // 🔥 مهم
      },
      validateStatus: () => true
    });

    res.status(response.status).send(response.data);

  } catch (err) {
    res.status(500).send("Proxy Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
