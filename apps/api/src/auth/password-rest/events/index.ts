export class PasswordResetEvent {
    constructor(
        public readonly email: string,
        public readonly token: string,
        public readonly expiresAt: Date,
        public readonly userId: string,
        public readonly resetId: string,
    ) {}
}