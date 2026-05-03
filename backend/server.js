// ─────────────────────────────────────────────────────────────────
//  NovaMind Backend — server.js
//  A simple Express server that connects your frontend to Claude API
// ─────────────────────────────────────────────────────────────────

const express  = require("express");
const cors     = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app  = express();
const port = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────

// CORS — allows your frontend (any domain) to call this backend
// When deploying, replace "*" with your actual frontend URL for security
// e.g. origin: "https://your-site.vercel.app"
app.use(cors({ origin: "*" }));

app.use(express.json());

// ─── CLAUDE CLIENT ────────────────────────────────────────────────
// Reads ANTHROPIC_API_KEY from environment variable (never hardcode it!)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────
// Visit /health in browser to confirm server is running
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "NovaMind backend is running!" });
});

// ─── CHAT ENDPOINT ────────────────────────────────────────────────
app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Limit conversation history to last 20 messages (saves cost)
    const recentMessages = messages.slice(-20);

    // Call Claude API
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 1024,

      // System prompt — this defines your chatbot's personality
      // Customize this to change how your AI behaves!
      system: `You are NovaMind, a helpful, friendly, and intelligent AI assistant. 
You give clear, concise, and accurate answers. 
When writing code, always use code blocks.
You are honest about what you don't know.`,

      messages: recentMessages,
    });

    const reply = response.content[0].text;
    res.json({ reply });

  } catch (err) {
    console.error("Claude API error:", err.message);

    // Return a useful error message
    if (err.status === 401) {
      return res.status(500).json({ error: "Invalid API key. Check your ANTHROPIC_API_KEY." });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limit hit. Please wait a moment." });
    }

    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`
  ✦ NovaMind backend running!
  → Local:  http://localhost:${port}
  → Health: http://localhost:${port}/health
  → Chat:   POST http://localhost:${port}/chat
  `);
});
