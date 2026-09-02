import { NotificationChannel } from "@project/shared-types";
import { INotificationProvider, NormalizeResponse } from "./interfaces/notification";
import { smsProvider } from "./modules/sms-provider";
import { inAppProvider } from "./modules/in-app-provider";
import { whatsappProvider } from "./modules/whatsapp-provider";
import { resendEmailProvider } from "./modules/mails/resend";


const providerChains: Record<NotificationChannel, INotificationProvider<any>[]> = {
    'EMAIL': [resendEmailProvider],
    'SMS': [smsProvider],
    'WHATSAPP': [whatsappProvider],
    'IN-APP': [inAppProvider]
}

export class ProviderFactory {


    /**
     * Dispatch notification with automatic failover!
     * If primary fails, it immediately tries Secondary
     */
    static async dispatch(channel: NotificationChannel, payload: any): Promise<NormalizeResponse> {

        const providers = providerChains[channel];
        if (!providers || providers.length === 0) {
            throw new Error(`No provider Configured for channel ${channel}`);
        }

        let lastError = '';

        for (const provider of providers) {
            try {
                const result = await provider.send(payload);
                if (result.success) return result;
                console.log(`Provider failed (${result.error}). Attempting Fallback to next`);

                lastError = result.error || 'Unknown error';
            } catch (error: any) {
                console.log(`Provider threw exception (${error.message}). Attempting fallback...`);
                lastError = error.message
            }
        }

        // return {
        //     success: true,
        //     providerMessageId: "",
        //     rawResponse: {}
        // }

        return {
            success: false,
            providerMessageId: '',
            error: `All providers for channel "${channel}" failed. Last error: ${lastError}`,
            rawResponse: null
        }
    }
} 
