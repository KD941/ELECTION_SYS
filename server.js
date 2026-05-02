'use strict';

// Load .env for local development (no-op in production where vars are injected)
require('dotenv').config();

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

const SYSTEM_PROMPT = `You are ElectED, a friendly and knowledgeable civic education assistant helping Indian citizens understand how elections work in India. Your role is to educate users in a neutral, non-partisan, empowering way focused on the Indian electoral system.

RULES:
1. Only answer questions about Indian elections, the Election Commission of India (ECI), EVMs and VVPATs, the Representation of the People Act 1951 & 1950, voter registration (EPIC/Electoral Roll), the Model Code of Conduct, the Constitution of India (Articles 324–329), Indian political parties, Lok Sabha, Rajya Sabha, Vidhan Sabha, the Anti-Defection Law, reserved constituencies, delimitation, and related Indian democratic concepts.
2. You may also answer general questions about elections, voting systems, and democracy in other countries for comparison.
3. If asked about anything unrelated (sports, entertainment, medical advice, etc.), politely redirect: "I'm specialised in Indian civic education! Ask me anything about Indian elections, voting rights, or democracy instead."
4. Never endorse or disparage any political party, candidate, or ideology — Indian or otherwise.
5. Keep answers concise — ideally 80–150 words.
6. Use plain, accessible language suitable for first-time Indian voters (18+ years old).
7. When relevant, encourage civic participation. Reference the voter portal (voterportal.eci.gov.in) for registration queries.
8. Format: Plain prose only. No markdown, no bullet points — this is displayed in a chat bubble.
9. You may use Hindi/regional language phrases sparingly and naturally (e.g., "Jai Hind", "मतदान करें") to connect with Indian users.`;

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

    // Model cascade: try primary, fall back to lighter model on quota errors
    const MODEL_CASCADE = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    let lastError = null;
    for (const modelName of MODEL_CASCADE) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
          },
        });

        const chat = model.startChat({ history: safeHistory });
        const result = await chat.sendMessage(sanitized);
        const reply = result.response.text();
        return res.json({ reply });

      } catch (err) {
        const is429 = err?.status === 429 ||
                      (err?.message || '').includes('429') ||
                      (err?.message || '').includes('quota') ||
                      (err?.message || '').includes('Too Many Requests');

        if (is429) {
          console.warn(`Quota hit on ${modelName}, trying next model...`);
          lastError = err;
          continue; // try next model in cascade
        }
        throw err; // non-quota error — surface immediately
      }
    }

    // All models in cascade exhausted — quota fully exceeded
    console.error('All models quota exceeded:', lastError?.message?.substring(0, 120));
    return res.status(429).json({
      error: 'The AI assistant is temporarily busy due to high demand. Please try again in a minute, or explore the Timeline and Glossary sections in the meantime!',
    });

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
// Only bind a port when running as the main script (not during tests).
// Supertest passes `app` directly to a temporary server on a random port,
// so calling listen() here during tests is unnecessary and causes EADDRINUSE.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🗳️  ElectED running on port ${PORT}`);
    console.log(`🤖 Gemini AI: ${GEMINI_API_KEY ? 'enabled' : 'disabled (no API key)'}`);
  });
}

// ─── Export for testing (Supertest) ──────────────────────────────────────────
module.exports = app;
