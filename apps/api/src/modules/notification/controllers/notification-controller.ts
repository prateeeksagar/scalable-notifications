import { FastifyRequest, FastifyReply } from "fastify";
import { notificationService } from "../services/notification-service";
import { SendNotificationSchema } from '@project/shared-types';

export async function getNotificationHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const data = await notificationService.getNotification();
        return reply.status(200).send({
            success: true,
            data
        })
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: 'Failed to fetch notifications'
        })
    }
}

export async function sendNotificationHandler(request: FastifyRequest, reply: FastifyReply) {
    try {

        const parseResult = SendNotificationSchema.safeParse(request.body);
        if (!parseResult.success) {
            return reply.status(400).send({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.issues
            })
        }

        // idempotency key
        const idempotencyKey = (request.headers['idempotency-key'] || request.headers['x-idempotency-key']) as string | undefined

        const result = await notificationService.sendNotification(parseResult.data, idempotencyKey);

        // 202 for accepted
        return reply.status(202).send({
            success: true,
            message: result.isDuplicate ? 'Duplicate request acknowledged(already queued)' : 'Notification queued successfully',
            notificationId: result.id,
            isDuplicate: result.isDuplicate
        })
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            successs: false,
            message: 'failed to send notification'
        })
    }
}