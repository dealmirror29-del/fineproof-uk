#!/usr/bin/env node
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const puppeteer = require('puppeteer');

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error('REDIS_URL is required to run worker');
  process.exit(1);
}

const connection = new Redis(REDIS_URL);
const { saveResult } = require('../lib/results');
const crypto = require('crypto');
const connection = new Redis(REDIS_URL);
const { saveResult } = require('../lib/results');
const crypto = require('crypto');
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || null;
const { queue } = require('../lib/queue');

// Single worker handles both 'scan' jobs and 'webhook' delivery jobs.
const worker = new Worker('scans', async (job) => {
  if (job.name === 'scan') {
    const { url, callbackUrl } = job.data;
    let browser;
    try {
      browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const text = await page.evaluate(() => document.body.innerText || '');
      const screenshotBase64 = await page.screenshot({ encoding: 'base64', fullPage: false });

      // Optional Grok
      let grokResult = null;
      const GROK_API_KEY = process.env.GROK_API_KEY;
      const GROK_API_URL = process.env.GROK_API_URL;
      if (GROK_API_KEY && GROK_API_URL) {
        try {
          const fetch = (await import('node-fetch')).default;
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
          grokResult = { error: String(err) };
        }
      }

      const result = { url, text, screenshotBase64, grok: grokResult };

      // Persist result to Redis (for 24h default TTL)
      try {
        await saveResult(job.id, result);
      } catch (e) {
        console.error('failed to persist job result', e);
      }

      // If callbackUrl provided, enqueue a webhook delivery job with retries/backoff
      if (callbackUrl && queue) {
        try {
          await queue.add('webhook', { jobId: job.id, callbackUrl, result }, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
          });
        } catch (e) {
          console.error('failed to enqueue webhook job', e);
        }
      } else if (callbackUrl) {
        // Fallback: attempt immediate delivery if no queue available
        try {
          const fetch = (await import('node-fetch')).default;
          const payload = JSON.stringify({ jobId: job.id, result });
          const headers = { 'Content-Type': 'application/json' };
          if (WEBHOOK_SECRET) {
            const timestamp = String(Date.now());
            const toSign = `${timestamp}.${payload}`;
            const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(toSign).digest('hex');
            headers['x-signature'] = `sha256=${signature}`;
            headers['x-signature-timestamp'] = timestamp;
          }
          await fetch(callbackUrl, { method: 'POST', headers, body: payload });
        } catch (err) {
          console.error('webhook callback failed (no queue)', err);
        }
      }

      return result;
    } finally {
      if (browser) await browser.close();
    }
  }

  if (job.name === 'webhook') {
    const { jobId, callbackUrl, result } = job.data;
    try {
      // increment attempt counter
      try { await connection.incr(`scan:webhook:attempts:${jobId}`); } catch (e) { /* ignore */ }

      const fetch = (await import('node-fetch')).default;
      const payload = JSON.stringify({ jobId, result });
      const headers = { 'Content-Type': 'application/json' };
      if (WEBHOOK_SECRET) {
        const timestamp = String(Date.now());
        const toSign = `${timestamp}.${payload}`;
        const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(toSign).digest('hex');
        headers['x-signature'] = `sha256=${signature}`;
        headers['x-signature-timestamp'] = timestamp;
      }
      const resp = await fetch(callbackUrl, { method: 'POST', headers, body: payload });
      if (!resp.ok) {
        const text = await resp.text();
        // store last error
        try { await connection.set(`scan:webhook:lastError:${jobId}`, text); } catch (e) {}
        throw new Error(`Webhook responded ${resp.status}: ${text}`);
      }
      // success -> optionally store success marker
      try { await connection.set(`scan:webhook:lastSuccess:${jobId}`, String(Date.now())); } catch (e) {}
      return { ok: true };
    } catch (err) {
      console.error('webhook job failed', jobId, err);
      // Re-throw to allow BullMQ to retry according to attempts/backoff
      throw err;
    }
  }

  // Unknown job type
  return null;
}, { connection });

worker.on('completed', (job) => {
  console.log('job completed', job.id, job.name);
});
worker.on('failed', (job, err) => {
  console.error('job failed', job.id, job.name, err);
});

console.log('Worker started for scans queue');
