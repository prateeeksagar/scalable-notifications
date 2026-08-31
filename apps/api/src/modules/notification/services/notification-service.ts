import { db, notifications } from "@project/db";
import { notificationQueue, connection } from '@project/broker'
import { NotificationRequest } from "@project/shared-types";
import { eq } from 'drizzle-orm'


export class NotificationService {
    async getNotification() {
        try {
            return await db.select().from(notifications);
        } catch (error) {
            throw error;
        }
    }

    async sendNotification(input: NotificationRequest, idempotencyKey?: string | undefined) {
        try {

            if (idempotencyKey) {
                const cached = await connection.get(`idempotency:${idempotencyKey}`);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    console.log('duplicate request detected for key');
                    return { ...parsed, isDuplicate: true };
                }

                // secoundary check in the postgreSQL
                const [existing] = await db.select().from(notifications).where(eq(notifications.idempotencyKey, idempotencyKey))

                if (existing) {
                    return { ...existing, isDuplicate: true };
                }
            }

            // 1. saved in db with initial status 'QUEUED'
            const [saved] = await db.insert(notifications).values({
                channel: input.channel,
                idempotencyKey: idempotencyKey || null,
                status: "QUEUED",
                payload: input.payload
            }).onConflictDoNothing({ target: notifications.idempotencyKey }).returning()


            if (!saved && idempotencyKey) {
                const [existing] = await db.select().from(notifications).where(eq(notifications.idempotencyKey, idempotencyKey));
                return { existing, isDuplicate: true }
            }

            // 2. push job into bullmq
            await notificationQueue.add('send-notification', {
                notificationId: saved.id,
                channel: input.channel,
                payload: input.payload
            }, {
                jobId: saved.id,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 }
            })

            if (idempotencyKey) {
                await connection.set(`idempotency:${idempotencyKey}`, JSON.stringify(saved), 'EX', 86400);
            }

            return { saved, isDuplicate: false };

        } catch (error) {
            console.log("This is the error---------", error)
            throw error;
        }
    }
}

export const notificationService = new NotificationService();