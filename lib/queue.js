const { Queue, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || null;

let queue = null;
let scheduler = null;
let connection = null;

if (REDIS_URL) {
  connection = new IORedis(REDIS_URL);
  queue = new Queue('scans', { connection: connection });
  scheduler = new QueueScheduler('scans', { connection: connection });
}

module.exports = { queue, scheduler, connection };
