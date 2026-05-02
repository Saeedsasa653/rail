const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// آدرس سرور اصلی
const TARGET = "https://s2.jok3r.ir:3030";

// اگر public داری
app.use(express.static("public"));

// Proxy کامل (مثل XHTTP Relay)
app.use("/", async (req, res) => {
  try {
    const url = TARGET + req.url;

    const response = await axios({
      method: req.method,
      url: url,
      headers: req.headers,
      data: req.body,
      validateStatus: () => true
    });

    res.status(response.status);
    res.send(response.data);

  } catch (err) {
    res.status(500).send("Proxy Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});