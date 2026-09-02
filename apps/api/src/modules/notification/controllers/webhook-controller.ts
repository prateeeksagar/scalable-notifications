import { db, notifications } from "@project/db";
import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";

// Map Resend event types to our internal notification status
const RESEND_STATUS_MAP: Record<string, string> = {
    'email.sent': 'SENT',
    'email.delivered': 'DELIVERED',
    'email.bounced': 'BOUNCED',
    'email.opened': 'OPENED',
    'email.clicked': 'CLICKED',
    'email.complained': 'SPAM_COMPLAINT'
};

export async function resendWebhookHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const body = request.body as any;
        const eventType = body?.type;
        const emailId = body.data.email_id

        if (!emailId || !eventType) {
            return reply.status(400).send({
                success: false,
                message: "Invalid webhook payload"
            })
        }

        const newStatus = RESEND_STATUS_MAP[eventType] || 'SENT';

        // update notification status in postgreSQL
        const [updated] = await db.update(notifications).set({
            status: newStatus,
            updatedAt: new Date()
        }).where(eq(notifications.providerMessageId, emailId)).returning();

        if (updated) {
            console.log('webhook processed successfully')
        } else {
            console.warn('webook warn! no notification found')
        }

        return reply.status(200).send({
            success: true, status: newStatus
        })

    } catch (error: any) {
        console.log('webhook error');
        return reply.status(500).send({
            success: false,
            message: error.message
        })
    }
}