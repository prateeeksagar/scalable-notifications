export interface EmailPayload {
    to: string;
    subject: string;
    body: string;
}

export class EmailProvider {
    async send(payload: EmailPayload) {
        console.log('EMAIL DISPATECHED BY THE WORKER');
        console.log(`payload ${payload}`)
        return { success: true };
    }
}

export const emailProvider = new EmailProvider();