import 'dotenv/config';
import { EmailPayload } from "@project/shared-types";
import { INotificationProvider, NormalizeResponse } from "../../../interfaces/notification";
import { Resend } from 'resend'



export class ResendEmailProvider implements INotificationProvider<'EMAIL'> {
    channel = 'EMAIL' as const;
    private resend: Resend

    constructor(apiKey?: string) {
        this.resend = new Resend(apiKey || process.env.RESEND_API || '')
    }

    async send(payload: EmailPayload): Promise<NormalizeResponse> {
        console.log('RESEND API sending email')
        try {
            const { data, error } = await this.resend.emails.send({
                from: payload.from || 'noreply@notifcation.com',
                to: payload.to,
                subject: payload.subject || 'Notification',
                html: payload.body || '<p>No Content</p>'
            })

            if (error) {
                console.log(error);
                return {
                    success: false,
                    providerMessageId: '',
                    error: error.message,
                    rawResponse: error
                }
            }
            console.log(`✅ [Resend Success] Email sent! ID: ${data?.id}`);
            return {
                success: true,
                providerMessageId: data?.id || "",
                rawResponse: data
            }
        } catch (error: any) {
            console.log('resend exception error');
            return {
                success: false,
                providerMessageId: '',
                error: error.error,
                rawResponse: error
            }
        }
    }
}

export const resendEmailProvider = new ResendEmailProvider();