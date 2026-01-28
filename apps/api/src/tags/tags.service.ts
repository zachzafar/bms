import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { InsertTag } from '@repo/api-contract';
import { ObjectStorageService } from 'src/object-storage/object-storage.service';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
    private readonly objectStorageService: ObjectStorageService,
  ) {}

  async createTag(data: InsertTag) {
  try {
    const result = await this.db
      .insert(schema.Tags)
      .values(data)
      .$returningId();
    
    return result[0]; // { id, name }
  } catch (error: any) {
    console.error('Create tag error:', error);
    throw new InternalServerErrorException(error?.message || 'Failed to create tag');
  }
}


  async getTags(tenantId: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Tags)
      .where(and(eq(schema.Tags.tenantId, tenantId),isNull(schema.Tags.deletedAt)))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    const results = await this.db
      .select()
      .from(schema.Tags)
      .where(and(eq(schema.Tags.tenantId, tenantId), isNull(schema.Tags.deletedAt)))
      .limit(pageSize)
      .offset(offset)
      .execute();

    // Convert tagImage paths to signed URLs
    const tagsWithSignedUrls = await Promise.all(
      results.map(async (tag) => {
        if (tag.tagImage) {
          try {
            const signedUrl = await this.objectStorageService.getObjectUrl(tag.tagImage);
            return { ...tag, tagImage: signedUrl };
          } catch (error) {
            this.logger.warn(`Failed to get signed URL for tag ${tag.id}: ${error}`);
            return { ...tag, tagImage: null };
          }
        }
        return tag;
      })
    );

    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    return {
      data: tagsWithSignedUrls,
      pagination: paginationData,
    };
  }

  async getTag(id: number, withSignedUrl: boolean = false) {
    const tag = await this.db.query.Tags.findFirst({
      where: (tag, { eq, and, isNull }) => and(eq(tag.id, id), isNull(tag.deletedAt)),
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Convert tagImage to signed URL if requested
    if (withSignedUrl && tag.tagImage) {
      try {
        const signedUrl = await this.objectStorageService.getObjectUrl(tag.tagImage);
        return { ...tag, tagImage: signedUrl };
      } catch (error) {
        this.logger.warn(`Failed to get signed URL for tag ${id}: ${error}`);
        return { ...tag, tagImage: null };
      }
    }

    return tag;
  }

  async deleteTag(id: number) {
    await this.db
      .update(schema.Tags)
      .set({ deletedAt: new Date() })
      .where(eq(schema.Tags.id, id));

    return { message: 'Tag deleted' };
  }

  async updateTag(id: number, data: Partial<InsertTag>) {
    const tag = await this.getTag(id);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      return { message: 'No changes to update' };
    }

    await this.db
      .update(schema.Tags)
      .set(updateData)
      .where(eq(schema.Tags.id, id));

    return { message: 'Tag updated successfully' };
  }

  async uploadTagImage(tenantId: string, tagId: number, imageBuffer: Buffer): Promise<string> {
    const tag = await this.getTag(tagId);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Delete old image if exists
    if (tag.tagImage) {
      try {
        await this.objectStorageService.deleteObject(tag.tagImage);
      } catch (error) {
        this.logger.warn(`Failed to delete old tag image: ${error}`);
      }
    }

    // Upload new image - using 'tags' as the asset folder for organization
    const imagePath = await this.objectStorageService.uploadObject(
      imageBuffer,
      'image',
      tenantId,
      `tags/${tagId}`
    );

    // Update tag with new image path
    await this.db
      .update(schema.Tags)
      .set({ tagImage: imagePath })
      .where(eq(schema.Tags.id, tagId));

    return imagePath;
  }

  async getTagsBySubdomain(subdomain: string, page: number = 1, pageSize: number = 10) {
    // First, find the tenant by subdomain
    const tenant = await this.db.query.Tenant.findFirst({
      where: (tenant, { eq }) => eq(tenant.subdomain, subdomain),
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with subdomain '${subdomain}' not found`);
    }

    const offset = (page - 1) * pageSize;

    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Tags)
      .where(and(eq(schema.Tags.tenantId, tenant.id), isNull(schema.Tags.deletedAt)))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    const results = await this.db
      .select({
        id: schema.Tags.id,
        name: schema.Tags.name,
        description: schema.Tags.description,
        tagImage: schema.Tags.tagImage,
      })
      .from(schema.Tags)
      .where(and(eq(schema.Tags.tenantId, tenant.id), isNull(schema.Tags.deletedAt)))
      .limit(pageSize)
      .offset(offset)
      .execute();

    // Convert tagImage paths to signed URLs
    const tagsWithSignedUrls = await Promise.all(
      results.map(async (tag) => {
        if (tag.tagImage) {
          try {
            const signedUrl = await this.objectStorageService.getObjectUrl(tag.tagImage);
            return { ...tag, tagImage: signedUrl };
          } catch (error) {
            this.logger.warn(`Failed to get signed URL for tag ${tag.id}: ${error}`);
            return { ...tag, tagImage: null };
          }
        }
        return tag;
      })
    );

    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    return {
      data: tagsWithSignedUrls,
      pagination: paginationData,
    };
  }
}
