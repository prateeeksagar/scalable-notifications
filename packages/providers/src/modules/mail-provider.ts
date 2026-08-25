import { EmailPayload } from "@project/shared-types";
import { INotificationProvider, NormalizeResponse } from "../interfaces/notification";



export class EmailProvider implements INotificationProvider<"EMAIL"> {
    channel = "EMAIL" as const;
    async send(payload: EmailPayload): Promise<NormalizeResponse> {
        console.log('EMAIL DISPATECHED BY THE WORKER');
        console.log(`payload ${payload}`)
        return { success: true, providerMessageId: "123", rawResponse: "" };
    }
}

export const emailProvider = new EmailProvider();