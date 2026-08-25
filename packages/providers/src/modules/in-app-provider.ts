export interface InAppPayload {
    to: number;
    body: string;
}

export class InAppProvider {
    async send(payload: InAppPayload) {
        console.log('IN APP DISPATECHED BY THE WORKER');
        console.log(`payload ${payload}`)
        return { success: true };
    }
}

export const inAppProvider = new InAppProvider();