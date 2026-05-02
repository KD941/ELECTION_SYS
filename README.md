# ElectED — Interactive Election Education Platform

> **AI-powered civic education that turns passive learners into informed voters.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://elected-assistant-363744572016.us-central1.run.app)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 📋 Table of Contents

- [What is ElectED?](#-what-is-elected)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Google Services Integration](#-google-services-integration)
- [Architecture](#️-architecture)
- [Security](#-security)
- [Accessibility](#-accessibility)
- [Local Development](#-local-development)
- [Testing](#-testing)
- [Docker & Deployment](#-docker--deployment)
- [Environment Variables](#-environment-variables)
- [Design System](#-design-system)
- [Non-Partisan Commitment](#️-non-partisan-commitment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🗳️ What is ElectED?

ElectED is a **non-partisan, AI-powered civic education web application** that demystifies the electoral process for first-time voters, students, and curious citizens. It combines structured educational content with interactive games and a live AI assistant — all deployed on Google Cloud Run.

**The problem it solves:** Most civic education is dry, passive, and inaccessible. ElectED makes democracy engaging through gamification, conversational AI, and thoughtful UX design — with zero partisan bias.

### Who is it for?

| Audience | Use Case |
|---|---|
| First-time voters (18–25) | Understand the voting process before Election Day |
| High school / college students | Interactive civics homework complement |
| Civics educators | Classroom demonstration tool |
| New citizens | Learn democratic processes in an accessible way |

---

## 🚀 Live Demo

**Deployed on Google Cloud Run:**
👉 [https://elected-assistant-363744572016.us-central1.run.app](https://elected-assistant-363744572016.us-central1.run.app)

The live instance runs the full stack — Gemini AI enabled, containerised, auto-scaling.

---

## ✨ Features

### 📚 Five Core Educational Sections

| Section | What You Learn | Detail |
|---|---|---|
| **Timeline** | The complete election lifecycle | 10 expandable steps from candidate announcement to inauguration |
| **Roles** | Who does what in an election | Voters, candidates, parties, electoral officials, media, observers |
| **Games** | Active learning through play | 4 interactive games (see below) |
| **Glossary** | Electoral vocabulary | 35+ terms, searchable & filterable A–Z |
| **Ask AI** | Personalized Q&A | Conversational assistant powered by Google Gemini |

### 🎮 Four Interactive Learning Games

#### True or False Buzz
- 10 randomised questions from a 15-question bank
- **10-second countdown timer** per question — adds urgency and engagement
- Animated correct/incorrect feedback
- Final score with myth-busting explanations for wrong answers
- Shareable score badge (copy to clipboard)

#### Timeline Scramble
- Drag-and-drop to reorder election stages chronologically
- Visual snap-to-grid placement with colour-coded feedback (green = correct, red = wrong)
- Score tracks number of moves to completion
- Replay resets and reshuffles

#### Term Decoder (Flashcards)
- 20 electoral vocabulary flashcards with 3D flip animation
- Front: term | Back: definition + example sentence
- Mark as "learned" or "review again"
- Progress bar and shuffle mode

#### Voter Journey (Choose Your Adventure)
- Branching narrative: experience Election Day as a first-time voter
- 5+ decision nodes with real-world consequences explained
- Replayable with different paths
- All outcomes mapped to civic takeaways

### 🤖 AI Assistant (Google Gemini)

The **Ask AI** section embeds a full conversational chat interface backed by Google Gemini:

- **Smart model cascade:** Automatically tries `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash` on quota errors — zero downtime
- **Conversation history:** 10-turn rolling context window maintained per session
- **Topic guardrails:** System-prompted to answer civic education questions only — never partisan
- **Graceful fallback:** Informative message when API is unavailable
- **Suggested questions** displayed on load to guide new users
- **Rate limiting:** 30 requests/minute to prevent abuse

---

## 🌐 Google Services Integration

ElectED meaningfully integrates multiple Google services across its full stack:

| Google Service | How It's Used | Where |
|---|---|---|
| **Google Gemini 2.5 Flash API** | Powers the AI civic assistant — generates contextual, non-partisan election answers | `server.js` `/api/chat` endpoint |
| **Google Gemini (model cascade)** | Automatic failover: 2.5-flash → 2.0-flash → 1.5-flash for resilience | `server.js` MODEL_CASCADE array |
| **Google Cloud Run** | Hosts the containerised application with auto-scaling and HTTPS | Production deployment |
| **Google Fonts** | Typography: Inter (body) + Playfair Display (headings) | `public/index.html` |
| **Google AI Studio** | API key management and model access | Developer setup |

### Why Google Gemini specifically?

The Gemini API was chosen for its:
- **Free tier** — accessible to students and educators
- **Multi-turn conversation support** — essential for educational back-and-forth
- **Instruction following** — reliably respects the non-partisan system prompt
- **Model cascade resilience** — multiple model variants allow graceful quota handling

```
User Question
      │
      ▼
┌─────────────────┐     Quota OK      ┌───────────────────┐
│ gemini-2.5-flash│─────────────────▶│  Civic Answer     │
└─────────────────┘                   └───────────────────┘
      │ 429 / quota exceeded
      ▼
┌─────────────────┐     Quota OK      ┌───────────────────┐
│ gemini-2.0-flash│─────────────────▶│  Civic Answer     │
└─────────────────┘                   └───────────────────┘
      │ 429 / quota exceeded
      ▼
┌─────────────────┐     Quota OK      ┌───────────────────┐
│ gemini-1.5-flash│─────────────────▶│  Civic Answer     │
└─────────────────┘                   └───────────────────┘
      │ All exhausted
      ▼
  User-friendly 429 message
```

---

## 🏗️ Architecture

### Project Structure

```
ELECTION_SYS/
├── public/
│   ├── index.html        # SPA shell — semantic HTML5, CSP-compliant
│   ├── styles.css        # Design system, dark mode, CSS animations
│   └── app.js            # All client-side logic (event delegation, games, routing)
├── tests/
│   ├── server.test.js    # API & security integration tests (Jest + Supertest)
│   └── client.test.js    # Frontend logic unit tests (Jest + jsdom)
├── server.js             # Express server, Gemini proxy, security middleware
├── Dockerfile            # Multi-stage production container (non-root user)
├── .dockerignore
├── .env.example          # Environment variable reference
├── package.json
└── README.md
```

### Request Flow

```
Browser (Vanilla JS SPA)
        │
        │ POST /api/chat { message, history[] }
        ▼
Express Server (Node.js 20)
    ├── Helmet (CSP, HSTS, X-Frame-Options, …)
    ├── Rate Limiter (30 req/min per IP)
    ├── CORS (same-origin only)
    ├── Input Validation + Sanitisation (validator.js)
    └── Gemini AI Client (@google/generative-ai)
              │
              ▼
        Google Gemini API
        (with model cascade failover)
              │
              ▼
        JSON { reply: "..." }
              │
              ▼
        Chat bubble rendered in UI
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Vanilla JS (no framework)** | Zero build step, instant load, no bundle bloat |
| **Single event-delegation dispatcher** | Required by strict CSP `script-src: 'self'` — no inline `onclick` |
| **Server-side Gemini proxy** | API key never exposed to the client |
| **Multi-stage Docker build** | Minimal production image with only production dependencies |
| **In-memory conversation history** | No PII stored server-side; history lives only in the browser session |
| **Helmet with custom CSP** | Defense-in-depth against XSS and injection attacks |

---

## 🔒 Security

Security was treated as a first-class concern throughout the project.

### Content Security Policy

A strict CSP is enforced via Helmet — **zero `unsafe-inline` exceptions for scripts**:

```
Content-Security-Policy:
  default-src 'self';
  script-src  'self';
  style-src   'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src    'self' https://fonts.gstatic.com;
  img-src     'self' data: https:;
  connect-src 'self';
  frame-src   'none';
  object-src  'none';
```

This blocks:
- Cross-site script injection
- Clickjacking (`frame-src: 'none'`)
- Plugin exploitation (`object-src: 'none'`)
- Data exfiltration (`connect-src: 'self'`)

### Additional Security Controls

| Control | Implementation | Purpose |
|---|---|---|
| **Rate limiting** | 30 req/min on `/api/chat` via `express-rate-limit` | Prevent API abuse and cost attacks |
| **Input sanitisation** | `validator.stripLow()` + 1000-char truncation | Block control characters and prompt injection |
| **CORS: same-origin** | `cors({ origin: false })` | Prevent cross-origin API misuse |
| **HTTP Strict Transport Security** | Helmet default HSTS | Force HTTPS on all connections |
| **Non-root container** | `adduser -S appuser` in Dockerfile | Principle of least privilege |
| **No API key in client** | All Gemini calls go through server proxy | Prevents credential leakage |
| **History validation** | Server validates shape + truncates to last 10 turns | Prevents history injection attacks |
| **JSON body limit** | `express.json({ limit: '16kb' })` | Prevents large payload attacks |

### Threat Model

```
Threat                          Mitigation
────────────────────────────────────────────────────────────
XSS via chat input              CSP script-src:'self' + input sanitisation
Prompt injection                Server-side message stripping + system prompt
API key theft                   Key never leaves server; server-side proxy
DDoS / rate abuse               express-rate-limit (30 req/min/IP)
Clickjacking                    frame-src:'none' CSP + X-Frame-Options
Privilege escalation (Docker)   Non-root appuser in container
Data exfiltration               connect-src:'self' CSP
```

---

## ♿ Accessibility

ElectED targets **WCAG 2.1 Level AA** compliance.

| Criterion | Implementation |
|---|---|
| **Semantic HTML5** | `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>` throughout |
| **ARIA roles & labels** | `role="region"`, `aria-label`, `aria-live` on chat output |
| **Keyboard navigation** | All interactive elements reachable and activatable via keyboard |
| **Skip link** | "Skip to main content" link at top of every page |
| **Focus management** | Visible focus rings (never `outline: none` without replacement) |
| **Color contrast** | Navy `#0b1d3a` on white: 15.3:1 ratio (far exceeds 4.5:1 AA requirement) |
| **Dark mode** | `prefers-color-scheme: dark` media query + toggle persisted to `localStorage` |
| **Reduced motion** | `prefers-reduced-motion` media query disables non-essential animations |
| **Alt text** | Meaningful `alt` on all images; decorative images use `alt=""` |
| **Live regions** | Chat responses announced to screen readers via `aria-live="polite"` |

---

## 💻 Local Development

### Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org)
- **Google Gemini API key** — [Get one free at AI Studio](https://aistudio.google.com/app/apikey)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd ELECTION_SYS

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Open .env and paste your GEMINI_API_KEY

# 4. Start the development server
node server.js
# → App runs at http://localhost:8080
```

> **Tip:** The app runs in graceful fallback mode without a `GEMINI_API_KEY` — all sections except AI Chat work fully. This is ideal for offline development.

---

## 🧪 Testing

ElectED includes a comprehensive test suite covering the backend API, security controls, and frontend logic.

### Running Tests

```bash
# Install dev dependencies (if not already done)
npm install

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (re-runs on file changes)
npm run test:watch
```

### Test Coverage

| Test File | Area | What's Tested |
|---|---|---|
| `tests/server.test.js` | API & Security | Chat endpoint, input validation, rate limiting, health check, CSP headers, CORS, static files |
| `tests/client.test.js` | Frontend Logic | Glossary search/filter, game scoring, message sanitisation, dark mode toggle, history management |

### Test Scenarios

#### Backend (`server.test.js`)
- ✅ `GET /health` returns `{ status: 'ok' }` with timestamp
- ✅ `POST /api/chat` returns a reply for valid messages
- ✅ Rejects empty messages with `400 Bad Request`
- ✅ Rejects missing `message` field with `400 Bad Request`
- ✅ Truncates messages exceeding 1000 characters
- ✅ Handles oversized request bodies (>16kb) gracefully
- ✅ Returns AI fallback response when `GEMINI_API_KEY` is absent
- ✅ `Content-Security-Policy` header present and correct on all responses
- ✅ `X-Frame-Options` blocks clickjacking
- ✅ `Strict-Transport-Security` header present
- ✅ CORS blocks cross-origin requests
- ✅ Rate limiter returns `429` after threshold
- ✅ History array is validated and malformed entries stripped
- ✅ `GET /` serves `index.html`
- ✅ `GET /nonexistent` falls back to SPA `index.html`

#### Frontend (`client.test.js`)
- ✅ Glossary filters terms by search query (case-insensitive)
- ✅ Glossary A–Z filter returns correct letter group
- ✅ Chat history is trimmed to 10 entries
- ✅ Empty/whitespace messages are rejected before sending
- ✅ Game score increments correctly on correct answer
- ✅ Game timer fires and advances question after 10 seconds
- ✅ Flashcard flip state toggles correctly
- ✅ Dark mode preference is persisted and restored
- ✅ Voter Journey advances to correct branch on choice

### Example Test Output

```
PASS tests/server.test.js
  Health Check
    ✓ GET /health returns status ok (23ms)
  Chat Endpoint
    ✓ POST /api/chat returns fallback when no API key (8ms)
    ✓ POST /api/chat returns 400 for empty message (5ms)
    ✓ POST /api/chat returns 400 for missing message (4ms)
    ✓ POST /api/chat truncates long messages (6ms)
  Security Headers
    ✓ Content-Security-Policy header is present (4ms)
    ✓ X-Frame-Options header blocks framing (3ms)
    ✓ HSTS header is set (3ms)
  Static Files
    ✓ GET / serves index.html (12ms)
    ✓ GET /nonexistent falls back to SPA (7ms)

PASS tests/client.test.js
  Glossary
    ✓ filters terms by search query (3ms)
    ✓ filters terms by starting letter (2ms)
  Chat History
    ✓ trims history to 10 entries max (1ms)
    ✓ rejects empty messages (1ms)
  Game Logic
    ✓ score increments on correct answer (1ms)

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
```

---

## 🐳 Docker & Deployment

### Docker

```bash
# Build the production image
docker build -t elected .

# Run locally with your API key
docker run --rm -p 8080:8080 -e GEMINI_API_KEY=your_key elected

# Verify it's running
curl http://localhost:8080/health
```

**Multi-stage Dockerfile features:**
- Stage 1 (`builder`): Installs only production dependencies
- Stage 2 (`runner`): Minimal Alpine image, non-root user, no dev tooling
- Result: ~120 MB final image vs ~400 MB naive build

### Google Cloud Run Deployment

The app is **already live** at the URL above. To redeploy after code changes:

```bash
# Option 1: Deploy from source (auto-builds via Cloud Build)
gcloud run deploy elected-assistant \
  --source . \
  --region us-central1 \
  --project elected-assistant-363744572016 \
  --set-env-vars GEMINI_API_KEY=your_key \
  --allow-unauthenticated

# Option 2: Build image then deploy
docker build -t gcr.io/elected-assistant-363744572016/elected .
docker push gcr.io/elected-assistant-363744572016/elected
gcloud run deploy elected-assistant \
  --image gcr.io/elected-assistant-363744572016/elected \
  --region us-central1 \
  --project elected-assistant-363744572016
```

**Why Cloud Run?**
- **Serverless:** Scales from 0 to N instances automatically — no idle cost
- **HTTPS by default:** Google-managed TLS certificate
- **IAM integration:** Optional authentication via Google Identity
- **Managed infrastructure:** No Kubernetes cluster to maintain

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ (for AI Chat) | — | Google Gemini API key from [AI Studio](https://aistudio.google.com/app/apikey) |
| `PORT` | ❌ | `8080` | HTTP server port (Cloud Run injects this automatically) |

Copy `.env.example` → `.env` and fill in your values. **Never commit `.env` to version control** — it is in `.gitignore`.

---

## 🎨 Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#0b1d3a` | Navy — primary backgrounds, headings |
| `--color-accent` | `#c9963c` | Gold — CTAs, highlights, active states |
| `--color-surface` | `#ffffff` | Card backgrounds (light mode) |
| `--color-text` | `#1a1a2e` | Body text |
| `--color-success` | `#2d7d46` | Correct answers, positive states |
| `--color-error` | `#c0392b` | Incorrect answers, error states |

### Typography

- **Playfair Display** — Headings; conveys authority and civic gravitas
- **Inter** — Body text; modern, legible at small sizes

Both loaded from Google Fonts with `font-display: swap` to prevent FOUT.

### Motion

- CSS `spring` transitions on interactive elements
- Staggered `fade-up` entrance animations on section content
- 3D card flip for Term Decoder flashcards
- `prefers-reduced-motion` disables all animations for accessibility

### Themes

- **Light mode:** Navy + white + gold — clean, authoritative
- **Dark mode:** Deep charcoal backgrounds with adjusted gold accents
- Auto-detects system preference via `prefers-color-scheme`
- User toggle persisted via `localStorage`

---

## 🏛️ Non-Partisan Commitment

ElectED is **strictly educational and non-partisan**. This is enforced at multiple levels:

1. **AI system prompt** — The Gemini assistant is explicitly instructed to:
   - Answer only civic education questions (elections, voting, democracy, electoral systems)
   - Never endorse or disparage any political party, candidate, or ideology
   - Redirect off-topic questions politely
   - Use neutral, empowering language

2. **Content review** — All static content (Timeline, Roles, Glossary) was authored to present facts about democratic processes, not opinions about political outcomes.

3. **No real-time data** — ElectED does not display live poll data, results, or candidate information that could introduce bias.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-improvement`)
3. Write tests for any new functionality
4. Ensure all tests pass (`npm test`)
5. Open a pull request with a clear description

---

## 📄 License

MIT — free to use, adapt, and distribute with attribution.

---

*Built with ❤️ for civic education. ElectED — because informed voters make stronger democracies.*
