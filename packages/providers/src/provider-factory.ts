import { NotificationChannel } from "@project/shared-types";
import { INotificationProvider } from "./interfaces/notification";
import { emailProvider } from "./modules/mail-provider";
import { smsProvider } from "./modules/sms-provider";
import { inAppProvider } from "./modules/in-app-provider";
import { whatsappProvider } from "./modules/whatsapp-provider";


type ProviderMap = {
    [K in NotificationChannel]: INotificationProvider<K>
}

const providerMap: ProviderMap = {
    'EMAIL': emailProvider,
    'SMS': smsProvider,
    'IN-APP': inAppProvider,
    'WHATSAPP': whatsappProvider
}

export class ProviderFactory {
    static getProvider<K extends NotificationChannel>(channel: K): INotificationProvider<K> {
        const provider = providerMap[channel];
        if (!provider) {
            throw new Error('Invalid Service Requested');
        }

        return provider;
    }
}
