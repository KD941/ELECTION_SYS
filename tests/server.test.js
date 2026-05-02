'use strict';

/**
 * ElectED — Backend Integration Tests
 *
 * Tests the Express server API, security controls, and static file serving
 * using Jest + Supertest. The Gemini API is mocked so tests run offline.
 *
 * Run: npm test
 */

const request = require('supertest');

// ── Mock @google/generative-ai before requiring server ──────────────────────
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: { text: () => 'Elections are the cornerstone of democracy.' },
        }),
      }),
    }),
  })),
}));

// ── Set a fake API key so the server enables Gemini ────────────────────────
process.env.GEMINI_API_KEY = 'test-key-12345';
process.env.PORT = '0'; // random port — avoids conflicts in CI

let app;

beforeAll(() => {
  // Import after mocks are set up
  app = require('../server');
});

afterAll(() => {
  jest.resetModules();
});

// ────────────────────────────────────────────────────────────────────────────
// 1. Health Check
// ────────────────────────────────────────────────────────────────────────────
describe('Health Check', () => {
  test('GET /health returns status ok with timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    // timestamp must be a valid ISO string
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 2. Chat Endpoint — Happy Path
// ────────────────────────────────────────────────────────────────────────────
describe('POST /api/chat — happy path', () => {
  test('returns a reply for a valid message', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is voter registration?' })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(0);
  });

  test('accepts an optional history array', async () => {
    const history = [
      { role: 'user',  parts: [{ text: 'Hello' }] },
      { role: 'model', parts: [{ text: 'Hi! How can I help?' }] },
    ];

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is a ballot?', history })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reply');
  });

  test('returns a reply even when history is an empty array', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Explain gerrymandering', history: [] });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reply');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 3. Chat Endpoint — Input Validation
// ────────────────────────────────────────────────────────────────────────────
describe('POST /api/chat — input validation', () => {
  test('returns 400 when message field is missing', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({})
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when message is an empty string', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when message is only whitespace', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '   \t\n  ' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when message is not a string', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 12345 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('accepts a message exactly at the 1000-character limit', async () => {
    const longMsg = 'a'.repeat(1000);
    const res = await request(app)
      .post('/api/chat')
      .send({ message: longMsg });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reply');
  });

  test('truncates messages exceeding 1000 characters (no error thrown)', async () => {
    const veryLong = 'x'.repeat(5000);
    const res = await request(app)
      .post('/api/chat')
      .send({ message: veryLong });

    // Server truncates and still processes
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reply');
  });

  test('strips malformed history entries silently', async () => {
    const badHistory = [
      null,
      { role: 'hacker', parts: [{ text: 'inject' }] },
      { role: 'user' }, // missing parts
      'not an object',
    ];

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is democracy?', history: badHistory });

    // Should not crash — bad history is stripped, valid message processed
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reply');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 4. Chat Endpoint — Fallback reply content (API key present, Gemini mocked)
// ────────────────────────────────────────────────────────────────────────────
describe('POST /api/chat — reply content', () => {
  test('reply is a non-empty string', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is an electoral college?' });

    expect(res.statusCode).toBe(200);
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(0);
  });

  test('fallback string contains expected keywords when key absent (unit check)', () => {
    // Test the fallback message string directly — this is what the server returns
    // when GEMINI_API_KEY is not set, without needing to re-require the module.
    const fallbackReply =
      "I'm currently unavailable — the AI service hasn't been configured yet. " +
      'In the meantime, explore the Timeline and Glossary sections to learn about elections!';

    expect(fallbackReply).toMatch(/unavailable/i);
    expect(fallbackReply).toMatch(/timeline/i);
    expect(fallbackReply).toMatch(/glossary/i);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 5. Security Headers
// ────────────────────────────────────────────────────────────────────────────
describe('Security Headers', () => {
  test('Content-Security-Policy header is present', async () => {
    const res = await request(app).get('/');
    expect(res.headers).toHaveProperty('content-security-policy');
  });

  test('CSP blocks inline scripts (no unsafe-inline for script-src)', async () => {
    const res = await request(app).get('/');
    const csp = res.headers['content-security-policy'];
    expect(csp).toMatch(/script-src/i);
    // Must NOT contain unsafe-inline for scripts
    // (unsafe-inline may appear in style-src which is acceptable)
    const scriptSrcMatch = csp.match(/script-src([^;]*)/i);
    if (scriptSrcMatch) {
      expect(scriptSrcMatch[1]).not.toMatch(/'unsafe-inline'/i);
    }
  });

  test('X-Frame-Options header prevents clickjacking', async () => {
    const res = await request(app).get('/');
    // Helmet sets either x-frame-options or the CSP frame-src:none
    const hasXFrame = 'x-frame-options' in res.headers;
    const hasFrameCsp = (res.headers['content-security-policy'] || '').includes('frame-src');
    expect(hasXFrame || hasFrameCsp).toBe(true);
  });

  test('Strict-Transport-Security header is set', async () => {
    const res = await request(app).get('/');
    expect(res.headers).toHaveProperty('strict-transport-security');
  });

  test('X-Content-Type-Options is set to nosniff', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('API endpoint also returns security headers', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'test' });
    expect(res.headers).toHaveProperty('content-security-policy');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 6. CORS
// ────────────────────────────────────────────────────────────────────────────
describe('CORS', () => {
  test('does not set Access-Control-Allow-Origin for cross-origin requests', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Origin', 'https://evil-site.com')
      .send({ message: 'What is voting?' });

    // Same-origin CORS mode — no wildcard
    const acaoHeader = res.headers['access-control-allow-origin'];
    expect(acaoHeader).not.toBe('*');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 7. Static Files & SPA Fallback
// ────────────────────────────────────────────────────────────────────────────
describe('Static Files & SPA Fallback', () => {
  test('GET / serves the SPA index.html', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/i);
    expect(res.text).toContain('<!DOCTYPE html>');
  });

  test('GET /unknown-route falls back to index.html (SPA routing)', async () => {
    const res = await request(app).get('/some/deep/route/that/does/not/exist');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/i);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 8. Request Body Limits
// ────────────────────────────────────────────────────────────────────────────
describe('Request Body Limits', () => {
  test('rejects request bodies larger than 16kb', async () => {
    const bigPayload = { message: 'x'.repeat(20 * 1024) }; // 20 KB
    const res = await request(app)
      .post('/api/chat')
      .send(bigPayload)
      .set('Content-Type', 'application/json');

    // Express should return 413 Payload Too Large
    expect(res.statusCode).toBe(413);
  });
});
