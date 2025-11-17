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

const worker = new Worker('scans', async (job) => {
  const { url } = job.data;
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

    return { url, text, screenshotBase64, grok: grokResult };
  } finally {
    if (browser) await browser.close();
  }
}, { connection });

worker.on('completed', (job) => {
  console.log('job completed', job.id);
});
worker.on('failed', (job, err) => {
  console.error('job failed', job.id, err);
});

console.log('Worker started for scans queue');
