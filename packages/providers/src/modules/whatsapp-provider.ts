export interface WhatsappPayload {
    to: number;
    body: string;
}

export class WhatsappProvider {
    async send(payload: WhatsappPayload) {
        console.log('Whatsapp DISPATECHED BY THE WORKER');
        console.log(`payload ${payload}`)
        return { success: true };
    }
}

export const whatsappProvider = new WhatsappProvider();