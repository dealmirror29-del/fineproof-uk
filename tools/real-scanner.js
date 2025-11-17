#!/usr/bin/env node
const puppeteer = require('puppeteer');

async function run(url) {
  if (!url) {
    console.error('Usage: node tools/real-scanner.js <url>');
    process.exit(2);
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const text = await page.evaluate(() => document.body.innerText || '');
    const title = await page.title();
    const screenshotBase64 = await page.screenshot({ encoding: 'base64', fullPage: false });

    console.log(JSON.stringify({ url, title, textSnippet: text.slice(0, 2000), screenshotBase64 }, null, 2));
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const url = process.argv[2];
  run(url).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
