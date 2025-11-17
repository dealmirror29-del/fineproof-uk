const { connection } = require('./queue');

const RESULT_TTL_SECONDS = 60 * 60 * 24; // keep results for 24 hours by default

async function saveResult(jobId, result) {
  if (!connection) return false;
  try {
    await connection.set(`scan:result:${jobId}`, JSON.stringify(result));
    await connection.expire(`scan:result:${jobId}`, RESULT_TTL_SECONDS);
    return true;
  } catch (err) {
    console.error('saveResult error', err);
    return false;
  }
}

async function getResult(jobId) {
  if (!connection) return null;
  try {
    const raw = await connection.get(`scan:result:${jobId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('getResult error', err);
    return null;
  }
}

module.exports = { saveResult, getResult };
