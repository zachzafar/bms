import { Inject, Injectable, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from 'src/database-schema';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { randomBytes } from 'crypto';
import { PasswordResetEvent } from './events';
import { hash } from 'argon2';
import { eq } from 'drizzle-orm';

@Injectable()
export class PasswordRestService {
    private logger = new Logger(PasswordRestService.name);

    constructor(
        @Inject(DrizzleAsyncProvider) private db : MySql2Database<typeof schema>,
        private eventEmitter: EventEmitter2,
    ) {}

    async updatePassword(token: string, password: string): Promise<boolean> {
        const row = await this.db.query.PasswordReset.findFirst({
            where: (reset, { eq }) => eq(reset.token, token),
        })
        if (!row) {
            return false
        }
        if (row.expiresAt < new Date()) {
            return false
        }
        const hashedPassword = await hash(password)
        await this.db.update(schema.User).set({
            password: hashedPassword,
        }).where(eq(schema.User.id, row.userId))
        
        await this.db.delete(schema.PasswordReset).where(eq(schema.PasswordReset.id, row.id))

        return true
    }

    async createPasswordResetToken(email: string): Promise<boolean> {
        try {
            const user = await this.db.query.User.findFirst({
                where: (user, { eq }) => eq(user.email, email),
            })

            if (!user) {
                return true
            }

            const resetToken = `rk_${randomBytes(32).toString('hex')}`
            const expiresAt = new Date(Date.now() + 3600000)

            const [{id}] = await this.db.insert(schema.PasswordReset).values({
                userId: user.id,
                token: resetToken,
                expiresAt
            }).$returningId()

            this.eventEmitter.emit('password.reset', {
                email: user.email,
                token: resetToken,
                expiresAt,
                userId: user.id,
                resetId: id,
            })
        } catch (error) {
            this.logger.error(error)
            return false
        }

        return true;
    }

    @OnEvent('password.reset')
    async handlePasswordResetNotification(payload: PasswordResetEvent) {
        this.logger.log(`Sending password reset email to ${payload.email} for user ${payload.userId}`)
        this.eventEmitter.emit('send-email', {
            email: payload.email,
            subject: 'Bookos password Reset',
            content: `
                <h1>Password Reset</h1>
                <p>Click <a href="${process.env.FRONTEND_URL}/password-reset/${payload.token}">here</a> to reset your password.</p>
            `,
        })
    }

    @OnEvent('admin.registered')
    async handleAdminRegistrationNotification(payload: any) {
        this.logger.log(`Sending admin welcome email to ${payload.email} for user ${payload.userId}`)
        this.eventEmitter.emit('send-email', {
            email: payload.email,
            subject: 'Welcome to BookOS - Set Your Admin Password',
            content: `
                <h1>Welcome to BookOS, ${payload.name}!</h1>
                <p>Your admin account has been created successfully.</p>
                <p>Click <a href="${process.env.FRONTEND_URL}/password-reset/${payload.token}">here</a> to set your password and complete your account setup.</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't request this account, please contact support immediately.</p>
            `,
        })
    }
}
