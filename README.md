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

Run worker with Docker (local)

1. Start Redis + worker using docker-compose:

```bash
docker compose up --build
```

2. Or run worker directly (requires `REDIS_URL`):

```bash
REDIS_URL=redis://localhost:6379 node tools/worker.js
```

Notes:
- The `docker/worker.Dockerfile` builds a minimal image that runs `node tools/worker.js` and connects to Redis.
- To enable Grok integration in the worker container, set `GROK_API_KEY` and `GROK_API_URL` in your environment or a `.env` used by Docker Compose.

Persistent results & webhooks
- Worker saves job results in Redis under `scan:result:<jobId>` for 24 hours (configurable via `RESULT_TTL_SECONDS`).
- When enqueueing a job, you can pass `callbackUrl` in the POST body. The worker will POST `{ jobId, result }` to that URL when the job completes.

Webhook signing
- If you set `WEBHOOK_SECRET`, the worker will sign webhook payloads using HMAC-SHA256 and include the header `x-signature: sha256=<hex>` and `x-signature-timestamp` (milliseconds since epoch). Verify the signature on the receiver by computing HMAC-SHA256 of the request body with the same secret and comparing.

Replay protection and verification
- The worker signs the payload together with the timestamp: signature = HMAC_SHA256(WEBHOOK_SECRET, `${timestamp}.${body}`). The worker includes both `x-signature` (format `sha256=<hex>`) and `x-signature-timestamp` (milliseconds since epoch).
- Receiver verification steps:
	1. Read `x-signature` and `x-signature-timestamp` from headers and the raw request body.
	2. Compute `expected = 'sha256=' + HMAC_SHA256(WEBHOOK_SECRET, `${timestamp}.${body}`)`.
	3. Compare `expected` and `x-signature` using `crypto.timingSafeEqual`.
	4. Validate timestamp is recent (within `WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS`, default 300 seconds) to prevent replay attacks.

Example Node/Express verification (copy-paste):
```js
const crypto = require('crypto');
const express = require('express');
const app = express();

// Use raw body parsing so signature verifies exactly against the bytes
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
	const secret = process.env.WEBHOOK_SECRET;
	const sigHeader = req.headers['x-signature'] || '';
	const timestamp = req.headers['x-signature-timestamp'];
	const bodyRaw = req.body.toString();

	if (!sigHeader || !timestamp) return res.status(401).send('Missing signature headers');

	// Check timestamp freshness
	const tolerance = (parseInt(process.env.WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS || '300', 10)) * 1000;
	const ts = parseInt(timestamp, 10);
	if (Math.abs(Date.now() - ts) > tolerance) return res.status(400).send('Stale timestamp');

	const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(`${timestamp}.${bodyRaw}`).digest('hex');
	try {
		const a = Buffer.from(sigHeader);
		const b = Buffer.from(expected);
		if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).send('Invalid signature');
	} catch (e) {
		return res.status(401).send('Invalid signature');
	}

	const payload = JSON.parse(bodyRaw);
	// handle payload
	res.status(200).send('ok');
});
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

Security and rate-limits
- `SCAN_API_KEY` (recommended): set this to a secret value and include it in requests using `Authorization: Bearer <key>` or the `x-api-key` header. If not set, the API will refuse non-local requests.
- Rate limiting: in-memory per-IP limit of 5 requests per minute.
- Concurrency: max 3 concurrent scans per instance. If the server is busy you'll receive HTTP 429.

Notes:
- The rate-limiting and concurrency controls are in-memory and per-instance — they are NOT durable across multiple serverless instances. For production you should use a centralized store (Redis) or a job queue.
- On Vercel, running headless Chromium in serverless functions may require additional configuration or a custom chromium build. Consider running scans on a dedicated server or worker if you need reliability.

Notes:
- Puppeteer requires a headless Chromium. On Vercel, use their recommended chromium build or run scans from a server you control.
- Keep `GROK_API_KEY` secret; set it in Vercel environment variables if you want the API to call Grok.
