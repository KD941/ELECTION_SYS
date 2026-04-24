'use strict';

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const validator = require('validator');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set — AI chat will return fallback responses.');
}

// ─── Gemini Client ────────────────────────────────────────────────────────────
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SYSTEM_PROMPT = `You are ElectED, a friendly and knowledgeable civic education assistant helping people understand how elections work. Your role is to educate users in a neutral, non-partisan, empowering way.

RULES:
1. Only answer questions about elections, voting, democracy, electoral systems, ballots, candidates, political parties, voter registration, electoral processes, civic rights and duties, and related democratic concepts.
2. If asked about anything unrelated (sports, entertainment, medical advice, etc.), politely redirect: "I'm specialised in civic education! Ask me anything about elections, voting, or democracy instead."
3. Never endorse or disparage any political party, candidate, or ideology.
4. Keep answers concise — ideally 80-150 words.
5. Use plain, accessible language suitable for first-time voters (16+ years old).
6. When relevant, encourage civic participation.
7. Format: Plain prose only. No markdown, no bullet points — this is displayed in a chat bubble.`;

// ─── Express Setup ────────────────────────────────────────────────────────────
const app = express();

// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({ origin: false })); // same-origin only
app.use(express.json({ limit: '16kb' }));

// Rate limiting on chat endpoint
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a moment and try again.' },
});

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
}));

// ─── AI Chat Endpoint ─────────────────────────────────────────────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // Input validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const sanitized = validator.stripLow(message.trim()).substring(0, 1000);
    if (sanitized.length < 1) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    // Validate history shape (in-memory, not stored server-side)
    const safeHistory = Array.isArray(history)
      ? history.slice(-10).filter(
          (m) =>
            m &&
            typeof m === 'object' &&
            (m.role === 'user' || m.role === 'model') &&
            typeof m.parts?.[0]?.text === 'string'
        )
      : [];

    // Fallback if no API key
    if (!genAI) {
      return res.json({
        reply:
          "I'm currently unavailable — the AI service hasn't been configured yet. In the meantime, explore the Timeline and Glossary sections to learn about elections!",
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    // Build chat with history
    const chat = model.startChat({ history: safeHistory });
    const result = await chat.sendMessage(sanitized);
    const reply = result.response.text();

    return res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err?.message || err);
    return res.status(500).json({
      error: 'Something went wrong. Please try again in a moment.',
    });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🗳️  ElectED running on port ${PORT}`);
  console.log(`🤖 Gemini AI: ${GEMINI_API_KEY ? 'enabled' : 'disabled (no API key)'}`);
});
