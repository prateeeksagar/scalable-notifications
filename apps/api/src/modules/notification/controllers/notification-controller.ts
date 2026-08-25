import { FastifyRequest, FastifyReply } from "fastify";
import { CreateNotificationInput, notificationService } from "../services/notification-service";

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
        const body = request.body as CreateNotificationInput;
        const result = await notificationService.sendNotification(body);

        // 202 for accepted
        return reply.status(202).send({
            success: true,
            message: 'Notification queued successfully',
            notificationId: result.id
        })
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            successs: false,
            message: 'failed to send notification'
        })
    }
}