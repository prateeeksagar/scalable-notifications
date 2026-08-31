import { z } from 'zod';

export const EmailPayloadSchema = z.object({
    to: z.email('Invalid email format'),
    subject: z.string().optional(),
    body: z.string().optional(),
    from: z.email().optional(),
    templateId: z.string().optional(),
    variables: z.record(z.string(), z.any()).optional()
}).refine(data => data.body || data.templateId, {
    message: "Either 'body' or templateId' must be provided"
})

export const SmsPayloadSchema = z.object({
    to: z.string().min(5, 'Phone must be atleast 5 digits'),
    body: z.string().min(1, 'SMS message body cannot be empty'),
    templateId: z.string().optional(),
    variables: z.record(z.string(), z.any()).optional(),
}).refine(data => data.body || data.templateId, {
    message: "Either 'body' or templateId' must be provided"
})

export const InAppPayloadScheme = z.object({
    userId: z.string().min(1, 'User Id is required'),
    title: z.string().min(1, 'Title cannot be empty').optional(),
    body: z.string().min(1, 'body cannot be empty').optional(),
    actionUrl: z.url('Action URL must be in valid URL').optional(),
    templateId: z.string().optional(),
    variables: z.record(z.string(), z.any()).optional(),
})

export const WhatsappPayloadSchema = z.object({
    to: z.string().min(5, 'Phone number must be at least 5 digits'),
    templateName: z.string().optional(),
    templateId: z.string().optional(),
    variables: z.record(z.string(), z.any()).optional(),
    body: z.string().optional()
})

// Discriminated Union: Validates the payload on the basis of channel
export const SendNotificationSchema = z.discriminatedUnion('channel', [
    z.object({ channel: z.literal('EMAIL'), payload: EmailPayloadSchema }),
    z.object({ channel: z.literal('SMS'), payload: SmsPayloadSchema }),
    z.object({ channel: z.literal('IN-APP'), payload: InAppPayloadScheme }),
    z.object({ channel: z.literal('WHATSAPP'), payload: WhatsappPayloadSchema })
])

// infer typescript types from zod automatically
// supported channels

export type SendNotificationDTO = z.infer<typeof SendNotificationSchema>

export type EmailPayload = z.infer<typeof EmailPayloadSchema>

export type SmsPayload = z.infer<typeof SmsPayloadSchema>

export type InAppPayload = z.infer<typeof InAppPayloadScheme>

export type WhatsappPayload = z.infer<typeof WhatsappPayloadSchema>


export type ChannelPayloadMap = {
    'SMS': SmsPayload,
    'EMAIL': EmailPayload,
    'IN-APP': InAppPayload,
    'WHATSAPP': WhatsappPayload
}

export type NotificationChannel = SendNotificationDTO['channel']


// discriminated union for API Ingestion
export type NotificationRequest = {
    [K in NotificationChannel]: {
        channel: K;
        payload: ChannelPayloadMap[K];
    }
}[NotificationChannel];