# ElectED — Interactive Election Education Platform

A non-partisan, AI-powered civic education web application that helps first-time voters, students, and anyone curious about democracy understand how elections work — through interactive content, games, a searchable glossary, and an AI assistant.

**Live:** [elected-assistant on Google Cloud Run](https://elected-assistant-363744572016.us-central1.run.app)

---

## Overview

ElectED covers the full election lifecycle through five core sections:

| Section | Description |
|---|---|
| **Timeline** | 10 expandable steps from candidate announcement to inauguration |
| **Roles** | Who does what — voters, candidates, parties, officials, observers |
| **Games** | Four interactive learning activities (see below) |
| **Glossary** | 35+ electoral terms, searchable and filterable A–Z |
| **Ask AI** | Conversational AI assistant powered by Google Gemini |

### Learning Games

- **True or False Buzz** — 10-question randomised quiz with a 10-second per-question timer
- **Timeline Scramble** — Drag-and-drop to reorder election stages chronologically
- **Term Decoder** — Flip-card flashcards for electoral vocabulary (20 terms)
- **Voter Journey** — Branching narrative: experience Election Day as a first-time voter

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Security | Helmet (strict CSP, HSTS, no inline scripts) |
| AI | Google Gemini 2.0 Flash via `@google/generative-ai` |
| Frontend | Vanilla HTML, CSS, JavaScript (no framework) |
| Fonts | Google Fonts (Inter + Playfair Display) |
| Container | Docker |
| Hosting | Google Cloud Run |

> **CSP Note:** The application enforces `script-src: 'self'` with zero `unsafe-inline` exceptions. All UI interactions use a single event-delegation dispatcher (`data-action` attributes) rather than inline handlers.

---

## Project Structure

```
ELECTION_SYS/
├── public/
│   ├── index.html       # Single-page application shell
│   ├── styles.css       # Design system, dark mode, animations
│   └── app.js           # All client-side logic (CSP-compliant)
├── server.js            # Express server, Gemini proxy, security headers
├── Dockerfile           # Production container image
├── .dockerignore
├── .env.example         # Environment variable reference
├── package.json
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 18+
- A Google Gemini API key ([get one free](https://aistudio.google.com/app/apikey))

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd ELECTION_SYS

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Start the development server
node server.js
```

The app will be available at `http://localhost:8080`.

> Without a `GEMINI_API_KEY`, the app runs in fallback mode — all sections except AI Chat work fully.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes (for AI chat) | Google Gemini API key |
| `PORT` | No | Server port (default: `8080`) |

See `.env.example` for the full reference.

---

## Docker

```bash
# Build the image
docker build -t elected .

# Run locally with your API key
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key elected
```

---

## Deployment (Google Cloud Run)

The application is already deployed. To redeploy after changes:

```bash
gcloud run deploy elected-assistant \
  --source . \
  --region us-central1 \
  --project elected-assistant-363744572016 \
  --set-env-vars GEMINI_API_KEY=your_key
```

Or push to GitHub and trigger a manual deploy via the Cloud Run GitHub integration.

---

## Design System

- **Palette:** Navy blue (`#0b1d3a`) primary, gold (`#c9963c`) accent
- **Typography:** Playfair Display (headings) + Inter (body)
- **Themes:** Light and dark mode, persisted via `localStorage` and `prefers-color-scheme`
- **Motion:** CSS spring transitions, staggered fade-up animations, 3D card flips
- **Accessibility:** WCAG 2.1 AA — semantic HTML5, ARIA roles, keyboard-navigable, skip link

---

## Security

- **Content Security Policy:** `script-src 'self'` — no eval, no inline scripts
- **Event handling:** Single `document`-level delegation dispatcher, zero inline `onclick` attributes
- **Rate limiting:** 30 requests/minute on the `/api/chat` endpoint
- **Input sanitisation:** Gemini messages stripped and truncated to 1000 characters server-side
- **CORS:** Same-origin only

---

## Non-Partisan Commitment

ElectED is strictly educational. The AI assistant is system-prompted to:

- Answer questions about elections, voting, and democratic systems only
- Never endorse or disparage any political party, candidate, or ideology
- Redirect off-topic questions politely

---

## License

MIT — free to use, adapt, and distribute with attribution.
