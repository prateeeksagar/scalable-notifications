import { notificationQueue } from "@project/broker";
import { db, notifications } from "@project/db";
import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";

export async function getDeadLetterHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const deadLetters = await db.select().from(notifications).where(eq(notifications.status, 'DEAD_LETTER'));

        return reply.status(200).send({
            success: true,
            count: deadLetters.length,
            data: deadLetters
        })

    } catch (error: any) {
        return reply.status(500).send({
            success: false,
            message: error.message
        })
    }
}

export async function replayDeadLetterHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
        const { id } = request.params;

        const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));

        if (!notification) {
            return reply.status(404).send({
                success: false,
                message: `Notification not found`
            })
        }

        if (notification.status !== 'DEAD_LETTER') {
            return reply.status(400).send({
                success: false,
                message: `Notification is in ${notification.status} state, not 'DEAD_LETTER`
            })
        }

        await notificationQueue.add('send-notification', {
            notificationId: notification.id,
            channel: notification.channel,
            priority: notification.priority,
            payload: notification.payload
        }, {
            attempts: 3,
            backoff: { type: "exponential", delay: 1000 }
        })

        // update status back to QUEUED
        await db.update(notifications).set({ status: 'QUEUED', failedReason: null, updatedAt: new Date() })

        return reply.status(200).send({
            success: true,
            message: `Notification ${id} re-requested successfully for processing`
        })

    } catch (error: any) {
        return reply.status(500).send({
            success: false,
            message: error.message
        })
    }
}