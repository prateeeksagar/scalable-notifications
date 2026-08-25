
import { ChannelPayloadMap, NotificationChannel } from '@project/shared-types'

export interface NormalizeResponse {
    success: boolean;
    providerMessageId: string,
    error?: string
    rawResponse: unknown
}

export interface INotificationProvider<TChannel extends NotificationChannel> {
    channel: TChannel;
    send(payload: ChannelPayloadMap[TChannel]): Promise<NormalizeResponse>

}