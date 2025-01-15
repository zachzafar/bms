import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { eq } from 'drizzle-orm';

@Injectable()
export class GroupService {
    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>
    ){}

    async getGroups() {
        return this.db.query.Group.findMany();
    }

    async getGroupById(id: number) {
        return this.db.query.Group.findFirst({ where: (group, { eq }) => eq(group.id, id) });
    }

    async createGroup(data: schema.InsertGroup) {
        const newGroupId = await this.db.insert(schema.Group).values(data).$returningId().execute();
        
        return this.getGroupById(newGroupId[0].id);
    }

    async updateGroup(id: number, data: schema.UpdateGroup) {
        await this.db.update(schema.Group).set(data).where(eq(schema.Group.id, id)).execute()
        return this.getGroupById(id);
    }

    async deleteGroup(id: number) {
        return this.db.delete(schema.Group).where(eq(schema.Group.id, id));
    }
    
}
