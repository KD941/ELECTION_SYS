'use strict';

/**
 * ElectED — Frontend Logic Unit Tests
 *
 * Tests the pure business logic extracted from app.js using Jest + jsdom.
 * These tests do NOT require a running server.
 *
 * Covers:
 *  - Glossary search and A–Z filtering
 *  - Chat history management
 *  - Message sanitisation / validation
 *  - Quiz scoring logic
 *  - Flashcard navigation (fcNav)
 *  - Voter Journey state transitions
 *  - Dark mode theme toggle logic
 *  - Score badge copy text generation
 *
 * Run: npm test
 */

// ────────────────────────────────────────────────────────────────────────────
// Helpers — pure functions mirrored from app.js for isolated unit testing
// ────────────────────────────────────────────────────────────────────────────

/** Glossary data (subset matching app.js GLOSSARY_TERMS) */
const GLOSSARY_TERMS = [
  { term: 'Absentee Ballot',   letter: 'A', def: 'A ballot cast in advance.' },
  { term: 'Ballot',            letter: 'B', def: 'A document used to record choices.' },
  { term: 'Caucus',            letter: 'C', def: 'A meeting of party members.' },
  { term: 'Delegate',          letter: 'D', def: 'A person representing a group.' },
  { term: 'Electoral College', letter: 'E', def: 'Body that elects the U.S. President.' },
  { term: 'Gerrymandering',    letter: 'G', def: 'Manipulating district boundaries.' },
  { term: 'Incumbent',         letter: 'I', def: 'A politician currently in office.' },
  { term: 'Plurality',         letter: 'P', def: 'More votes than any other candidate.' },
  { term: 'Runoff',            letter: 'R', def: 'Second election when no majority.' },
  { term: 'Suffrage',          letter: 'S', def: 'The right to vote.' },
];

/** Pure glossary search — case-insensitive substring match */
function filterGlossaryBySearch(terms, query) {
  const q = query.toLowerCase().trim();
  if (!q) return terms;
  return terms.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.def.toLowerCase().includes(q)
  );
}

/** Pure A–Z filter */
function filterGlossaryByLetter(terms, letter) {
  if (!letter || letter === 'ALL') return terms;
  return terms.filter((t) => t.letter === letter);
}

/** Chat history trimmer — keeps at most maxLen entries */
function trimHistory(history, maxLen = 10) {
  return history.slice(-maxLen);
}

/** Message validator — returns true if message is valid to send */
function isValidMessage(msg) {
  if (typeof msg !== 'string') return false;
  return msg.trim().length > 0;
}

/** Quiz score percentage */
function calcScorePct(score, total) {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

/** Quiz result label based on percentage */
function getScoreLabel(pct) {
  if (pct >= 80) return 'Election expert — impressive knowledge.';
  if (pct >= 50) return 'Good effort! Keep learning.';
  return "Keep studying — you'll get there!";
}

/** Flashcard index navigation with wrap-around */
function fcNavIndex(currentIdx, dir, total) {
  return (currentIdx + dir + total) % total;
}

/** Journey node resolver — returns the node object or null if not found */
const JOURNEY_NODES = {
  start:        { choices: [{ next: 'registered' }, { next: 'not_registered' }] },
  registered:   { choices: [{ next: 'with_id' }, { next: 'no_id' }] },
  not_registered:{ choices: [{ next: 'same_day' }, { next: 'bad_end' }] },
  with_id:      { choices: [{ next: 'voted_well' }, { next: 'rushed' }] },
  no_id:        { choices: [{ next: 'provisional' }, { next: 'bad_end' }] },
  same_day:     { choices: [{ next: 'voted_well' }] },
  provisional:  { choices: [{ next: 'ok_end' }] },
  voted_well:   { choices: [{ next: 'great_end' }] },
  rushed:       { choices: [{ next: 'ok_end' }] },
  bad_end:      { end: true },
  great_end:    { end: true },
  ok_end:       { end: true },
};

function resolveJourneyNode(nodeId) {
  return JOURNEY_NODES[nodeId] || null;
}

function journeyChoose(currentNodeId, choiceIndex) {
  const node = resolveJourneyNode(currentNodeId);
  if (!node || !node.choices || choiceIndex >= node.choices.length) return null;
  return node.choices[choiceIndex].next;
}

/** Theme toggle — pure logic */
function computeNextTheme(currentTheme) {
  return currentTheme === 'dark' ? 'light' : 'dark';
}

/** Score badge copy text */
function buildScoreBadgeText(score, total) {
  const pct = Math.round((score / total) * 100);
  return `I scored ${score}/${total} (${pct}%) on the ElectED Election Quiz! Test your civic knowledge.`;
}

// ────────────────────────────────────────────────────────────────────────────
// TEST SUITES
// ────────────────────────────────────────────────────────────────────────────

// ── 1. Glossary Search ──────────────────────────────────────────────────────
describe('Glossary — Search', () => {
  test('returns all terms when query is empty', () => {
    const results = filterGlossaryBySearch(GLOSSARY_TERMS, '');
    expect(results).toHaveLength(GLOSSARY_TERMS.length);
  });

  test('finds a term by exact name (case-insensitive)', () => {
    const results = filterGlossaryBySearch(GLOSSARY_TERMS, 'ballot');
    const names = results.map((r) => r.term);
    expect(names).toContain('Ballot');
    expect(names).toContain('Absentee Ballot');
  });

  test('finds terms by partial name match', () => {
    const results = filterGlossaryBySearch(GLOSSARY_TERMS, 'uffrag');
    expect(results).toHaveLength(1);
    expect(results[0].term).toBe('Suffrage');
  });

  test('finds terms by definition keyword', () => {
    const results = filterGlossaryBySearch(GLOSSARY_TERMS, 'district');
    expect(results.length).toBeGreaterThan(0);
    // Gerrymandering's definition mentions "district"
    expect(results.some((r) => r.term === 'Gerrymandering')).toBe(true);
  });

  test('returns empty array when no match', () => {
    const results = filterGlossaryBySearch(GLOSSARY_TERMS, 'zzzznonexistent');
    expect(results).toHaveLength(0);
  });

  test('is case-insensitive for UPPERCASE queries', () => {
    const results = filterGlossaryBySearch(GLOSSARY_TERMS, 'CAUCUS');
    expect(results).toHaveLength(1);
    expect(results[0].term).toBe('Caucus');
  });
});

// ── 2. Glossary A–Z Filter ──────────────────────────────────────────────────
describe('Glossary — A–Z Filter', () => {
  test('returns all terms when letter is ALL', () => {
    const results = filterGlossaryByLetter(GLOSSARY_TERMS, 'ALL');
    expect(results).toHaveLength(GLOSSARY_TERMS.length);
  });

  test('returns only terms starting with the given letter', () => {
    const results = filterGlossaryByLetter(GLOSSARY_TERMS, 'S');
    expect(results).toHaveLength(1);
    expect(results[0].term).toBe('Suffrage');
  });

  test('returns empty array for a letter with no terms', () => {
    const results = filterGlossaryByLetter(GLOSSARY_TERMS, 'Z');
    expect(results).toHaveLength(0);
  });

  test('returns terms for letter E', () => {
    const results = filterGlossaryByLetter(GLOSSARY_TERMS, 'E');
    expect(results.some((r) => r.term === 'Electoral College')).toBe(true);
  });
});

// ── 3. Chat History Management ───────────────────────────────────────────────
describe('Chat History', () => {
  test('returns history unchanged when under the limit', () => {
    const hist = [
      { role: 'user', parts: [{ text: 'hi' }] },
      { role: 'model', parts: [{ text: 'hello' }] },
    ];
    const result = trimHistory(hist, 10);
    expect(result).toHaveLength(2);
  });

  test('trims history to the last 10 entries when over the limit', () => {
    const hist = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'model',
      parts: [{ text: `message ${i}` }],
    }));
    const result = trimHistory(hist, 10);
    expect(result).toHaveLength(10);
    // Should keep the last 10 entries
    expect(result[0].parts[0].text).toBe('message 10');
    expect(result[9].parts[0].text).toBe('message 19');
  });

  test('returns empty array for empty history', () => {
    expect(trimHistory([], 10)).toHaveLength(0);
  });
});

// ── 4. Message Validation ────────────────────────────────────────────────────
describe('Message Validation', () => {
  test('accepts a normal message string', () => {
    expect(isValidMessage('What is voter registration?')).toBe(true);
  });

  test('rejects an empty string', () => {
    expect(isValidMessage('')).toBe(false);
  });

  test('rejects a whitespace-only string', () => {
    expect(isValidMessage('   \t\n  ')).toBe(false);
  });

  test('rejects null', () => {
    expect(isValidMessage(null)).toBe(false);
  });

  test('rejects a number', () => {
    expect(isValidMessage(42)).toBe(false);
  });

  test('accepts a message with leading/trailing whitespace', () => {
    // trim() makes it valid
    expect(isValidMessage('  hello  ')).toBe(true);
  });
});

// ── 5. Quiz Score Logic ───────────────────────────────────────────────────────
describe('Quiz Score Logic', () => {
  test('calculates 100% for a perfect score', () => {
    expect(calcScorePct(10, 10)).toBe(100);
  });

  test('calculates 0% for zero correct', () => {
    expect(calcScorePct(0, 10)).toBe(0);
  });

  test('calculates 50% correctly', () => {
    expect(calcScorePct(5, 10)).toBe(50);
  });

  test('rounds to nearest integer', () => {
    expect(calcScorePct(1, 3)).toBe(33); // 33.33...
  });

  test('returns 0 when total is 0 (division guard)', () => {
    expect(calcScorePct(0, 0)).toBe(0);
  });

  test('returns "Election expert" label for scores ≥80%', () => {
    expect(getScoreLabel(80)).toMatch(/election expert/i);
    expect(getScoreLabel(100)).toMatch(/election expert/i);
  });

  test('returns "Good effort" label for scores 50–79%', () => {
    expect(getScoreLabel(50)).toMatch(/good effort/i);
    expect(getScoreLabel(79)).toMatch(/good effort/i);
  });

  test('returns "Keep studying" label for scores below 50%', () => {
    expect(getScoreLabel(49)).toMatch(/keep studying/i);
    expect(getScoreLabel(0)).toMatch(/keep studying/i);
  });
});

// ── 6. Flashcard Navigation ───────────────────────────────────────────────────
describe('Flashcard Navigation', () => {
  const total = 20;

  test('advances to the next card', () => {
    expect(fcNavIndex(0, 1, total)).toBe(1);
    expect(fcNavIndex(5, 1, total)).toBe(6);
  });

  test('goes to the previous card', () => {
    expect(fcNavIndex(5, -1, total)).toBe(4);
  });

  test('wraps forward from last card to first', () => {
    expect(fcNavIndex(total - 1, 1, total)).toBe(0);
  });

  test('wraps backward from first card to last', () => {
    expect(fcNavIndex(0, -1, total)).toBe(total - 1);
  });
});

// ── 7. Voter Journey State Transitions ──────────────────────────────────────
describe('Voter Journey — State Transitions', () => {
  test('start → registered on choice 0', () => {
    expect(journeyChoose('start', 0)).toBe('registered');
  });

  test('start → not_registered on choice 1', () => {
    expect(journeyChoose('start', 1)).toBe('not_registered');
  });

  test('registered → with_id on choice 0', () => {
    expect(journeyChoose('registered', 0)).toBe('with_id');
  });

  test('registered → no_id on choice 1', () => {
    expect(journeyChoose('registered', 1)).toBe('no_id');
  });

  test('not_registered → bad_end on choice 1', () => {
    expect(journeyChoose('not_registered', 1)).toBe('bad_end');
  });

  test('voted_well leads to great_end', () => {
    expect(journeyChoose('voted_well', 0)).toBe('great_end');
  });

  test('great_end is a terminal node (has end flag)', () => {
    const node = resolveJourneyNode('great_end');
    expect(node.end).toBe(true);
  });

  test('bad_end is a terminal node (has end flag)', () => {
    const node = resolveJourneyNode('bad_end');
    expect(node.end).toBe(true);
  });

  test('returns null for an unknown node', () => {
    expect(journeyChoose('nonexistent_node', 0)).toBeNull();
  });

  test('returns null when choice index is out of bounds', () => {
    expect(journeyChoose('start', 99)).toBeNull();
  });
});

// ── 8. Dark Mode Toggle ───────────────────────────────────────────────────────
describe('Dark Mode Toggle', () => {
  test('toggles from light to dark', () => {
    expect(computeNextTheme('light')).toBe('dark');
  });

  test('toggles from dark to light', () => {
    expect(computeNextTheme('dark')).toBe('light');
  });

  test('treats any non-dark value as light', () => {
    // Defensive: undefined or null treated as not-dark → becomes dark
    expect(computeNextTheme(undefined)).toBe('dark');
    expect(computeNextTheme(null)).toBe('dark');
  });
});

// ── 9. Score Badge Copy Text ─────────────────────────────────────────────────
describe('Score Badge Copy Text', () => {
  test('generates correct badge text for 10/10', () => {
    const text = buildScoreBadgeText(10, 10);
    expect(text).toContain('10/10');
    expect(text).toContain('100%');
    expect(text).toContain('ElectED Election Quiz');
  });

  test('generates correct badge text for 7/10', () => {
    const text = buildScoreBadgeText(7, 10);
    expect(text).toContain('7/10');
    expect(text).toContain('70%');
  });

  test('generates correct badge text for 0/10', () => {
    const text = buildScoreBadgeText(0, 10);
    expect(text).toContain('0/10');
    expect(text).toContain('0%');
  });
});
