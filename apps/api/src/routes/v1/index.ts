import { FastifyInstance } from "fastify";
import { getNotificationHandler, sendNotificationHandler } from "../../modules/notification/controllers/notification-controller";
import { getDeadLetterHandler, replayDeadLetterHandler } from "../../modules/notification/controllers/dlq-controllers";
import { resendWebhookHandler } from "../../modules/notification/controllers/webhook-controller";

export async function v1Routes(fastify: FastifyInstance) {
    fastify.get('/notification', getNotificationHandler)
    fastify.post('/notification', sendNotificationHandler);

    // DEAD LETTER QUEUE
    fastify.get('/dlq', getDeadLetterHandler)
    fastify.post('/dlq/replay/:id', replayDeadLetterHandler)

    //  INBOUND WEBHOOKS
    fastify.post('/webhooks/resend', resendWebhookHandler)
}