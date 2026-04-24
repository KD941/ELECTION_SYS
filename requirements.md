# Election Assistant — Project Requirements

## Overview
An interactive, web-based educational assistant that helps users understand the election process, timelines, key stakeholders, and democratic concepts through guided explanations, visual timelines, and engaging mini-games.

---

## 1. Goals & Scope

### Primary Goal
Make the electoral process approachable, engaging, and easy to understand for first-time voters, students, and curious citizens — regardless of prior political knowledge.

### Target Audience
- First-time voters (18–25)
- High school / college civics students
- General public seeking democratic literacy
- Non-native citizens preparing for naturalization

### Out of Scope
- Real-time election data / live results
- Partisan political content or candidate endorsements
- Country-specific legal advice

---

## 2. Feature Requirements

### 2.1 Core Modules

| Module | Description | Priority |
|---|---|---|
| Election Overview | High-level explainer of what elections are and why they matter | P0 |
| Process Timeline | Interactive step-by-step timeline from nomination to inauguration | P0 |
| Key Roles | Cards explaining candidates, voters, parties, electoral commission, media | P0 |
| Voting Mechanics | How ballots work, types of voting systems (FPTP, ranked choice, proportional) | P1 |
| Election Calendar | Generic election cycle (primary → general → runoff → certification) | P1 |
| Glossary | Searchable A–Z glossary of electoral terms | P1 |
| AI Chat Assistant | Ask-anything chat powered by Claude API for deeper Q&A | P2 |

### 2.2 Interactive Games

| Game | Mechanic | Learning Outcome |
|---|---|---|
| Ballot Match | Match candidates to their policy positions (card flip game) | Understanding platform differences |
| Timeline Scramble | Drag-and-drop to arrange election steps in correct order | Memorizing election sequence |
| True or False Buzz | Fast-paced true/false quiz on election myths | Debunking misconceptions |
| Voter Journey | Choose-your-own-adventure story as a first-time voter | Experiencing the full voter journey |
| Term Decoder | Flashcard memory game for electoral vocabulary | Glossary retention |

### 2.3 Navigation & UX

- Single-page application with tab/section navigation
- Mobile-responsive layout (min 320px viewport support)
- Smooth scroll and section transitions
- Progress indicators on multi-step content
- Keyboard navigable (WCAG 2.1 AA compliance)
- Dark mode support

### 2.4 AI Assistant (Claude API Integration)

- Embedded chat interface within the app
- System prompt constrains responses to election/civics topics only
- Conversation history maintained within session
- Suggested starter questions displayed on load
- Fallback message when API is unavailable

---

## 3. Design Requirements

### 3.1 Visual Identity
- **Theme**: Clean civic — serious but approachable; authoritative but not intimidating
- **Color palette**: Deep navy primary, gold accent, clean white surfaces
- **Typography**: Distinctive display font (e.g., Playfair Display) + clean body font
- **Iconography**: Simple line icons; ballot boxes, checkmarks, calendars, podiums
- **Motion**: Subtle entrance animations; interactive hover states; no gratuitous effects

### 3.2 Layout Principles
- Max content width: 900px, centered
- Generous whitespace between sections
- Card-based information architecture
- Visual hierarchy through size and weight, not color noise

### 3.3 Accessibility
- WCAG 2.1 Level AA minimum
- Alt text on all visual elements
- Focus rings on interactive elements
- Screen-reader landmarks on sections
- Color contrast ratio ≥ 4.5:1 for body text

---

## 4. Technical Requirements

### 4.1 Stack
- **Frontend**: React (single `.jsx` artifact) OR Vanilla HTML/CSS/JS
- **AI Backend**: Anthropic Claude API (`/v1/messages` endpoint)
- **Model**: `claude-sonnet-4-20250514`
- **No external backend** — all API calls from client
- **No localStorage / sessionStorage** — in-memory state only

### 4.2 Dependencies (CDN via cdnjs.cloudflare.com or jsdelivr)
- No mandatory third-party UI libraries
- Optionally: Chart.js for data visualization
- Google Fonts for typography

### 4.3 Performance
- Initial paint < 2s on 4G
- No blocking scripts in `<head>`
- Lazy-load game components on demand
- Graceful degradation when API unavailable

### 4.4 Security
- No API key exposed in client code (handled by proxy/env)
- Content Security Policy headers
- Input sanitization on chat interface
- Rate-limit awareness with user feedback

---

## 5. Content Requirements

### 5.1 Election Process Steps (Minimum Coverage)
1. Candidate announcement & filing
2. Primary elections / caucuses
3. Party conventions & nominations
4. General election campaign
5. Election Day voting
6. Vote counting & certification
7. Electoral College (US context) / equivalent
8. Inauguration / swearing in

### 5.2 Glossary Terms (Minimum 30)
Includes: Ballot, Candidate, Caucus, Constituency, Delegate, Electoral College, Exit Poll, Gerrymandering, Incumbent, Landslide, Mandate, Nomination, Plurality, Polling Station, Primary, Proportional Representation, Recount, Runoff, Suffrage, Swing State, Term Limit, Voter ID, Voter Registration, and more.

### 5.3 Tone Guidelines
- Neutral and non-partisan at all times
- Encouraging and empowering ("Your vote matters")
- Age-appropriate for 16+ readers
- Plain English first; technical terms defined on first use

---

## 6. Game Design Specifications

### 6.1 Timeline Scramble
- 6–8 draggable cards representing election stages
- Snap-to-grid placement
- Color feedback: green = correct position, red = wrong
- Score: number of moves to completion
- Replay button resets and reshuffles

### 6.2 True or False Buzz
- 15-question bank, 10 shown per game
- 10-second countdown per question
- Animated feedback (correct/incorrect)
- Final score with "myth-busting" explanation for each wrong answer
- Shareable score badge (copy to clipboard)

### 6.3 Term Decoder (Flashcards)
- Front: term; back: definition + example sentence
- Swipe/click to flip
- Mark as "learned" or "review again"
- Progress bar through deck
- Shuffle mode

### 6.4 Voter Journey (Choose Your Adventure)
- 5–7 decision nodes
- Branching outcomes (voted / didn't vote / provisional ballot)
- End screen summarizes choices and real-world consequences
- Replayable with different choices

---

## 7. Milestones

| Phase | Deliverable | Target |
|---|---|---|
| 1 — Core | Static overview + timeline + key roles | Week 1 |
| 2 — Games | Timeline Scramble + True/False Buzz | Week 2 |
| 3 — AI Chat | Claude API integration + glossary | Week 3 |
| 4 — Polish | Voter Journey + Term Decoder + animations | Week 4 |
| 5 — QA | Accessibility audit, cross-browser testing | Week 5 |

---

## 8. Success Metrics
- User completes at least 2 sections per session (engagement)
- Game completion rate ≥ 60%
- Chat questions answered accurately (human review sample)
- WCAG 2.1 AA audit passes with 0 critical violations
- Lighthouse performance score ≥ 85

---

*Document version 1.0 — April 2026*
