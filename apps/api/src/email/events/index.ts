export class EmailEvent {
    constructor(
        public readonly email: string,
        public readonly subject: string,
        public readonly content: string,
    ) {}
}