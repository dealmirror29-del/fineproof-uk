import puppeteer from 'puppeteer';

// POST /api/scan
// body: { url: string }
// Response: { url, text, screenshotBase64, grok?: any }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url in request body' });

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
        const grokResp = await fetch(GROK_API_URL, {
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
  }
}
