const { Queue } = require('bullmq');
const REDIS_URL = process.env.REDIS_URL || null;
const { promisify } = require('util');

let inMemoryActive = 0;
try {
  // import activeScans from pages/api/scan.js if possible
  // fallback: 0
  const mod = require('../../pages/api/scan');
  if (mod && typeof mod.activeScans === 'number') inMemoryActive = mod.activeScans;
} catch (e) {
  // ignore
}

export default async function handler(req, res) {
  const result = { activeScans: inMemoryActive };
  if (REDIS_URL) {
    try {
      const queue = new Queue('scans', { connection: REDIS_URL });
      const counts = await queue.getJobCounts();
      result.queue = counts;
    } catch (err) {
      result.queueError = String(err);
    }
  }
  return res.status(200).json(result);
}
