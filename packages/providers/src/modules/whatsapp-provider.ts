import { WhatsappPayload } from "@project/shared-types";
import { INotificationProvider, NormalizeResponse } from "../interfaces/notification";


export class WhatsappProvider implements INotificationProvider<"WHATSAPP"> {
    channel = "WHATSAPP" as const;
    async send(payload: WhatsappPayload): Promise<NormalizeResponse> {
        console.log('Whatsapp DISPATECHED BY THE WORKER');
        console.log(`payload ${payload}`)
        return { success: true, rawResponse: "", providerMessageId: "" };
    }
}

export const whatsappProvider = new WhatsappProvider();