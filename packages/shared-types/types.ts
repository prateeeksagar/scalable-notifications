// supported channels
export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN-APP' | 'WHATSAPP'

export interface EmailPayload {
    to: string;
    subject: string;
    body: string;
    from?: string;
}

export interface SmsPayload {
    to: string;
    body: string;
}

export interface InAppPayload {
    userId: string;
    title: string;
    body: string;
    actionUrl: string;
}

export interface WhatsappPayload {
    to: string;
    templateName: string;
    parameters?: Record<string, string>;
}

export type ChannelPayloadMap = {
    'SMS': SmsPayload,
    'EMAIL': EmailPayload,
    'IN-APP': InAppPayload,
    'WHATSAPP': WhatsappPayload
}


// discriminated union for API Ingestion
export type NotificationRequest = {
    [K in NotificationChannel]: {
        channel: K;
        payload: ChannelPayloadMap[K];
    }
}[NotificationChannel];