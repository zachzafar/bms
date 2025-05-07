import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailEvent } from './events';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private logger = new Logger(EmailService.name);
    private resend = new Resend(process.env.RESEND)

    constructor() {}

    @OnEvent('send-email')
     async sendEmail(payload: EmailEvent) {
        const { data,error } = await this.resend.emails.send({
            from: 'info@updates.bookos.xyz',
            to: payload.email,
            subject: payload.subject,
            html: payload.content,
        })
        if (error) {
            this.logger.error(error)
        }

    }
}
