import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { eq } from 'drizzle-orm';
import type { InsertTag } from '@repo/api-contract';

@Injectable()
export class TagsService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  async createTag(data: InsertTag) {
    try {
      const result = await this.db
        .insert(schema.Tags)
        .values(data)
        .$returningId();

      return result[0]; // { id, name }
    } catch (error) {
        console.error('Create tag error:', error);
      throw new InternalServerErrorException('Failed to create tag');
    }
  }

  async getTags() {
    return this.db.select().from(schema.Tags).execute(); // returns array of tags
  }

  async getTag(id: number) {
    const tag = await this.db.query.Tags.findFirst({
      where: (tag, { eq }) => eq(tag.id, id),
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async deleteTag(id: number) {
    const deleted = await this.db
      .delete(schema.Tags)
      .where(eq(schema.Tags.id, Number(id)));

    // if (deleted.length === 0) {
    //   throw new NotFoundException('Tag not found or already deleted');
    // }

    return { message: 'Tag deleted' };
  }
}
