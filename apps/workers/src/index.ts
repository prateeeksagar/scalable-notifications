import 'dotenv/config';
import { NOTIFICATION_QUEUE_NAME, Worker, connection } from "@project/broker";
import { db, notifications } from "@project/db";
import { eq } from "drizzle-orm";
import { emailProvider } from '@project/providers'

const worker = new Worker(NOTIFICATION_QUEUE_NAME, async (job) => {
    const { notificationId, channel, payload } = job.data;

    console.log(`processing job ${job.id} for ${notificationId}`);
    try {
        if (channel == "EMAIL") {
            await emailProvider.send(payload);
        }

        // update DB for 'SENT'
        await db.update(notifications).set({ status: 'SENT', updatedAt: new Date() }).where(eq(notifications.id, notificationId));

        console.log(`Notification ${notificationId} marked as SENT`);


    } catch (error) {
        console.log(error);
        await db.update(notifications).set({ status: 'FAILED', updatedAt: new Date() }).where(eq(notifications.id, notificationId));
        throw error;
    }
}, { connection })

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error: ${err.message}`);
});
