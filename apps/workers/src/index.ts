import 'dotenv/config';
import { NOTIFICATION_QUEUE_NAME, Worker, connection } from "@project/broker";
import { db, notifications, templates } from "@project/db";
import { eq } from "drizzle-orm";
import { ProviderFactory } from '@project/providers'
import Mustache from 'mustache'

const worker = new Worker(NOTIFICATION_QUEUE_NAME, async (job) => {
    const { notificationId, channel, payload } = job.data;

    console.log(`processing job ${job.id} for ${notificationId}`);
    try {

        let finalPayload = { ...payload }

        if (payload.templateId) {
            const [template] = await db.select().from(templates).where(eq(templates.templateId, payload.templateId));
            if (!template) {
                throw new Error(`Template not found: ${payload.templateId}`);
            }

            const vars = payload.variables || {};

            // render dynamic body % subject with mustache
            finalPayload.body = Mustache.render(template.body, vars);
            if (template.subject) {
                finalPayload.subject = Mustache.render(template.subject, vars)
            }

            console.log("Final payload----------", finalPayload)
        }

        // dispatch by provider factory
        const provider = ProviderFactory.getProvider(channel)
        const result = await provider.send(finalPayload);
        if (!result.success) {
            throw new Error(result.error || 'Provider failed to send');
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
