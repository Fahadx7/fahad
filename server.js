import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.options("*", cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("orcus server is running");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "orcus-server" });
});

app.post("/api/ai", async (req, res) => {
  try {
    const { prompt, system, messages } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system,
        messages: messages || [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    let raw = "";
    for (const b of data.content || []) {
      if (b.type === "text") raw += b.text;
    }

    res.json({
      raw,
      usage: data.usage || {},
      content: data.content || []
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Server error"
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});console.log("ANTHROPIC KEY FOUND:", !!process.env.ANTHROPIC_API_KEY);