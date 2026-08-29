import { db, notifications } from "@project/db";
import { notificationQueue } from '@project/broker'
import { NotificationRequest } from "@project/shared-types";



export class NotificationService {
    async getNotification() {
        try {
            return await db.select().from(notifications);
        } catch (error) {
            throw error;
        }
    }

    async sendNotification(input: NotificationRequest) {
        try {
            // 1. saved in db with initial status 'QUEUED'
            const [saved] = await db.insert(notifications).values({
                channel: input.channel,
                status: "QUEUED",
                payload: input.payload
            }).returning()

            // 2. push job into bullmq
            await notificationQueue.add('send-notification', {
                notificationId: saved.id,
                channel: input.channel,
                payload: input.payload
            }, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 }
            })

            return saved;

        } catch (error) {
            throw error;
        }


    }
}

export const notificationService = new NotificationService();