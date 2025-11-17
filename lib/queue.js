const { Queue, QueueScheduler } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL || null;

let queue = null;
let scheduler = null;

if (REDIS_URL) {
  const connection = { connection: REDIS_URL };
  queue = new Queue('scans', connection);
  scheduler = new QueueScheduler('scans', connection);
}

module.exports = { queue, scheduler };
