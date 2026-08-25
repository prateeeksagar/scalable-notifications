import { Queue, Worker, QueueEvents } from "bullmq";
import { Redis } from 'ioredis';


const connection = new Redis(process.env.REDIS_URL || "", {
    maxRetriesPerRequest: null
});

export const NOTIFICATION_QUEUE_NAME = 'notifications';

// 1. producer: used by apps/api to add jobs
export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
    connection
})

// 2. Export Redis connection & Worker helpers for apps/workers
export { Worker, QueueEvents, connection }