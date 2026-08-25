import { db, notifications } from "@project/db";
import { notificationQueue } from '@project/broker'

export interface CreateNotificationInput {
    channel: "EMAIL" | "SMS";
    payload: {
        to: string;
        subject: string;
        body: string;
    }
}

export class NotificationService {
    async getNotification() {
        try {
            return await db.select().from(notifications);
        } catch (error) {
            throw error;
        }
    }

    async sendNotification(input: CreateNotificationInput) {
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