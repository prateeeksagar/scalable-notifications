import { InAppPayload } from "@project/shared-types";
import { INotificationProvider, NormalizeResponse } from "../interfaces/notification";


export class InAppProvider implements INotificationProvider<'IN-APP'> {
    channel = 'IN-APP' as const
    async send(payload: InAppPayload): Promise<NormalizeResponse> {
        console.log('IN APP DISPATECHED BY THE WORKER');
        console.log(`payload ${payload}`)
        return { success: true, rawResponse: "", providerMessageId: "" };
    }
}

export const inAppProvider = new InAppProvider();