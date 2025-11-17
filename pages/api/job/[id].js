const { Queue } = require('bullmq');
const REDIS_URL = process.env.REDIS_URL || null;

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing job id' });

  if (!REDIS_URL) {
    return res.status(400).json({ error: 'No REDIS_URL configured' });
  }

  try {
    const queue = new Queue('scans', { connection: REDIS_URL });
    const job = await queue.getJob(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const state = await job.getState();
    const returnValue = job.returnvalue || null;
    return res.status(200).json({ id: job.id, state, returnValue });
  } catch (err) {
    console.error('job fetch error', err);
    return res.status(500).json({ error: String(err) });
  }
}
