export interface SMSPayload {
    to: number;
    body: string;
}

export class SMSProvider {
    async send(payload: SMSPayload) {
        console.log('SMS DISPATECHED BY THE WORKER');
        console.log(`payload ${payload}`)
        return { success: true };
    }
}

export const smsProvider = new SMSProvider();