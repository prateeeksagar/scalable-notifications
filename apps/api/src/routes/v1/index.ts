import { FastifyInstance } from "fastify";
import { getNotificationHandler, sendNotificationHandler } from "../../modules/notification/controllers/notification-controller";

export async function v1Routes(fastify: FastifyInstance) {
    fastify.get('/notification', getNotificationHandler)
    fastify.post('/notification', sendNotificationHandler);
}