import puppeteer from 'puppeteer';

// Simple in-memory rate limiter and concurrency limiter.
// NOTE: This is per-instance and will not work across multiple serverless instances.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // per IP
const MAX_CONCURRENT_SCANS = 3;

const ipRequests = new Map(); // ip -> [timestamps]
let activeScans = 0;

const getFetch = async () => {
  if (typeof fetch === 'function') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
};

function rateLimitCheck(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const arr = ipRequests.get(ip) || [];
  // purge old
  const recent = arr.filter((t) => t >= windowStart);
  recent.push(now);
  ipRequests.set(ip, recent);
  return recent.length <= MAX_REQUESTS_PER_WINDOW;
}

// POST /api/scan
// body: { url: string }
// Response: { url, text, screenshotBase64, grok?: any }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth (API Key)
  const headerAuth = req.headers['authorization'] || req.headers['Authorization'];
  const headerKey = req.headers['x-api-key'] || req.headers['X-Api-Key'];
  const provided = (headerAuth && String(headerAuth).startsWith('Bearer '))
    ? String(headerAuth).slice(7)
    : headerKey || '';
  const expected = process.env.SCAN_API_KEY || '';
  if (!expected) {
    // If no key configured, only allow localhost/dev to avoid accidental public exposure
    if (req.headers.host && !req.headers.host.includes('localhost') && req.headers['x-forwarded-for'] !== '127.0.0.1') {
      return res.status(403).json({ error: 'Server not configured with SCAN_API_KEY' });
    }
  } else if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid API key' });
  }

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url in request body' });

  // Basic URL validation
  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'Invalid URL protocol' });
  }

  const ip = req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress;
  if (!rateLimitCheck(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  if (activeScans >= MAX_CONCURRENT_SCANS) {
    return res.status(429).json({ error: 'Server busy, try again later' });
  }

  activeScans += 1;
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const text = await page.evaluate(() => document.body.innerText || '');
    const screenshotBuffer = await page.screenshot({ encoding: 'base64', fullPage: false });

    let grokResult = null;
    const GROK_API_KEY = process.env.GROK_API_KEY;
    const GROK_API_URL = process.env.GROK_API_URL; // e.g. https://api.grok.ai/v1/analyze

    if (GROK_API_KEY && GROK_API_URL) {
      try {
        const _fetch = await getFetch();
        const grokResp = await _fetch(GROK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROK_API_KEY}`,
          },
          body: JSON.stringify({ url, text }),
        });
        grokResult = await grokResp.json();
      } catch (err) {
        // Non-fatal — include error message in response
        grokResult = { error: String(err) };
      }
    }

    return res.status(200).json({ url, text, screenshotBase64: screenshotBuffer, grok: grokResult });
  } catch (err) {
    console.error('scan error', err);
    return res.status(500).json({ error: String(err) });
  } finally {
    if (browser) await browser.close();
    activeScans = Math.max(0, activeScans - 1);
  }
}
