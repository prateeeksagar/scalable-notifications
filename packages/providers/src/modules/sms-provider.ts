import { SmsPayload } from "@project/shared-types";
import { INotificationProvider, NormalizeResponse } from "../interfaces/notification";

export class SMSProvider implements INotificationProvider<"SMS"> {
    channel = "SMS" as const;
    async send(payload: SmsPayload): Promise<NormalizeResponse> {
        console.log('SMS DISPATECHED BY THE WORKER');
        console.log(`payload ${payload}`)
        return { success: true, rawResponse: "", providerMessageId: "" };
    }
}

export const smsProvider = new SMSProvider();