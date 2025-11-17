# FineProof.uk – GDPR + AI Act Compliance

**We pay your ICO fine up to £10,000.**

### Features
- Free compliance scanner
- 1-click cookie banner
- Auto privacy policies
- Shopify App ready

### Local Dev
```bash
npm install
npm run dev
```

### Generate Favicons
```bash
npm install -D sharp png-to-ico
node tools/generate-favicon.js
```
This creates `public/favicon.ico` and PNG variants from `app/favicon.svg`.

Deploy
Vercel → Connected to dealmirror29-del/fineproof-uk
# fineproof-uk
GDPR Fine-Proof for Shopify

## Real scanner (Puppeteer + optional Grok AI)

This repo includes a simple serverless scan API and a local CLI scanner.

- API: `POST /api/scan` accepts JSON `{ "url": "https://example.com" }` and returns `{ url, text, screenshotBase64, grok }`.
- CLI: `node tools/real-scanner.js https://example.com` (prints JSON).

Environment variables:
- `GROK_API_KEY` — optional: API key for Grok AI
- `GROK_API_URL` — optional: Grok AI endpoint to analyze extracted text

Notes:
- Puppeteer requires a headless Chromium. On Vercel, use their recommended chromium build or run scans from a server you control.
- Keep `GROK_API_KEY` secret; set it in Vercel environment variables if you want the API to call Grok.
