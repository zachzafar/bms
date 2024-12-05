import { Injectable,Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { InsertUser, SelectTenant, SelectUser } from '@repo/api-contract';

@Injectable()
export class UsersService {
    constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>){}

    async create(userData: InsertUser): Promise<void> {
        await this.db.insert(schema.User).values(userData);
    }

    async findAll(): Promise<SelectUser[]> {
        return this.db.query.User.findMany();
    }

    async findOne(id: string): Promise<SelectUser | undefined> {
        return this.db.query.User.findFirst({ where: (user, { eq }) => eq(user.id, id) });
    }

    async findByEmail(email: string): Promise<SelectUser | undefined> {
        return this.db.query.User.findFirst({ where: (user, { eq }) => eq(user.email, email) });
    }

}
