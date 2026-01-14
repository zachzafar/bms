import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import type { InsertAsset, UpdateAsset } from '@repo/api-contract';
import { ObjectStorageService } from 'src/object-storage/object-storage.service';
import { Readable } from 'stream';


@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
    private objectStorageService: ObjectStorageService
  ) { }

  async getAssets(query: any, tenantId: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions: any[] = [eq(schema.Asset.tenantId, tenantId)];
    if (query?.userId) conditions.push(eq(schema.Asset.userId, query.userId));

    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Asset)
      .where(and(...conditions))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated assets
    const assets = await this.db.query.Asset.findMany({
      where: (asset, { eq, and, like }) =>
        and(
          eq(asset.tenantId, tenantId),
          query?.userId ? eq(asset.userId, query.userId) : undefined,
          query?.search ? like(asset.name, `%${query.search}%`) : undefined
        ),
      limit: pageSize,
      offset: offset,
    });

    // Calculate pagination metadata
    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    const assetsWithTags = await Promise.all(
      assets.map(async (asset) => {
        const assetTags = await this.getTagsForAsset(asset.id);
        return {
          ...asset,
          tags: assetTags
            .map((rel) => rel.tag)
            .filter((tag): tag is NonNullable<typeof tag> => tag !== null),
        };
      })
    );

    return {
      data: assetsWithTags,
      pagination: paginationData,
    };
  }

  async getAssetById(id: string) {
    const asset = await this.db.query.Asset.findFirst({
      where: (asset, { eq }) => eq(asset.id, id),
    });
    if (!asset) return null;

    const assetTags = await this.getTagsForAsset(id);

    return {
      ...asset,
      tags: assetTags
        .map((rel) => rel.tag)
        .filter((tag): tag is NonNullable<typeof tag> => tag !== null),
    };
  }

  async getTagsForAsset(assetId: string) {
    return this.db.query.AssetHasTags.findMany({
      where: (aht, { eq }) => eq(aht.assetId, assetId),
      with: {
        tag: true,
      },
    });
  }


  async createAsset(data: InsertAsset, tagIds?: number[], formIds?: number[]) {

    try {
      const result = await this.db
        .insert(schema.Asset)
        .values(data)
        .$returningId();

      const assetId = result[0].id;

      if (tagIds && tagIds.length > 0) {
        for (const tagId of tagIds) {
          await this.db.insert(schema.AssetHasTags).values({
            assetId,
            tagId: (tagId),
          });
        }
      }

      if (formIds && formIds.length > 0) {
        for (const formId of formIds) {
          await this.db.insert(schema.AssetHasBookingForms).values({
            assetId,
            bookingFormId: formId,
          });
        }
      }

      return assetId;
    } catch (e) {
      throw new InternalServerErrorException(
        'Error occurred while creating asset'
      );
    }
  }

  async updateAsset(id: string, data: UpdateAsset & { tagIds?: number[], formIds?: number[] }) {
    const { tagIds, formIds, ...assetData } = data;
    let assetTypeId = assetData.assetTypeId ? (assetData.assetTypeId) : undefined;

    await this.db
      .update(schema.Asset)
      .set({ ...assetData, assetTypeId })
      .where(eq(schema.Asset.id, id))
      .execute();

    // Update tags if provided
    if (tagIds !== undefined) {
      // Delete existing tags
      await this.db.delete(schema.AssetHasTags).where(eq(schema.AssetHasTags.assetId, id));

      // Insert new tags
      if (tagIds.length > 0) {
        for (const tagId of tagIds) {
          await this.db.insert(schema.AssetHasTags).values({
            assetId: id,
            tagId: tagId,
          });
        }
      }
    }

    // Update forms if provided
    if (formIds !== undefined) {
      // Delete existing forms
      await this.db.delete(schema.AssetHasBookingForms).where(eq(schema.AssetHasBookingForms.assetId, id));

      // Insert new forms
      if (formIds.length > 0) {
        for (const formId of formIds) {
          await this.db.insert(schema.AssetHasBookingForms).values({
            assetId: id,
            bookingFormId: formId,
          });
        }
      }
    }

    return this.getAssetById(id);
  }

  async deleteAsset(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Step 1: Get booking IDs for this asset
      const bookings = await tx
        .select({ id: schema.Booking.id })
        .from(schema.Booking)
        .where(eq(schema.Booking.assetId, id));

      const bookingIds = bookings.map((b) => b.id);

      if (bookingIds.length > 0) {
        // Step 2: Delete from user_has_bookings where booking_id IN (...)
        await tx.delete(schema.UserHasBookings).where(
          inArray(schema.UserHasBookings.bookingId, bookingIds)
        );

        // Step 3: Delete from booking
        await tx.delete(schema.Booking).where(
          inArray(schema.Booking.id, bookingIds)
        );
      }

      // Step 4: Delete from asset_has_tags
      await tx.delete(schema.AssetHasTags).where(eq(schema.AssetHasTags.assetId, id));

      // Step 5: Delete from asset_has_properties
      await tx
        .delete(schema.AssetHasProperties)
        .where(eq(schema.AssetHasProperties.assetId, id));

      // Step 6: Delete from asset_has_booking_forms
      await tx
        .delete(schema.AssetHasBookingForms)
        .where(eq(schema.AssetHasBookingForms.assetId, id));

      // Step 7: Finally delete the asset
      await tx.delete(schema.Asset).where(eq(schema.Asset.id, id));
    });
  }

  async addPropertyValues(assetId: string, propertyValues: { propertyId: number, value: string }[]) {
    await this.db.delete(schema.AssetHasProperties).where(eq(schema.AssetHasProperties.assetId, assetId)).execute();

    return await this.db.insert(schema.AssetHasProperties).values(
      propertyValues.map(({ propertyId, value }) => ({
        assetId,
        assetPropertyId: (propertyId),
        value
      }))
    ).$returningId().execute();
  }

  async getPropertyValues(assetId: string) {
    return await this.db.query.AssetHasProperties.findMany({ where: (assetHasProperties, { eq }) => eq(assetHasProperties.assetId, assetId), with: { assetProperty: true } })
  }

  async uploadAssetImages(tenant: string, assetId: string, images: (Buffer | Readable)[]) {
    this.logger.log("Attempting to use storage service")
    const imageUrls = await Promise.all(images.map(async (image) => {
      const imageUrl = await this.objectStorageService.uploadObject(image, "image", tenant, assetId);
      return imageUrl;
    }));

    await this.db.insert(schema.AssetImages).values(
      imageUrls.map((imageUrl) => ({
        assetId,
        filePath: imageUrl,
      }))
    ).execute();
  }

  async getAssetImages(assetId: string) {
    const images = await this.db.query.AssetImages.findMany({ where: (assetImages, { eq }) => eq(assetImages.assetId, assetId) })
    const results = await Promise.allSettled(images.map(async (image) => {
      try {
        const url = await this.objectStorageService.getObjectUrl(image.filePath)
        return { success: true, url, image }
      } catch (e) {
        return { success: false, error: e }
      }
    }))
    const imagesWithSignedUrls: schema.SelectAssetImages[] = []
    results.forEach((result) => {
      if (result.status === "rejected") {
        this.logger.error(result.reason)
      } else if (result.status === "fulfilled" && result.value.success) {
        if (result.value.url) {
          imagesWithSignedUrls.push({ ...result.value.image, filePath: result.value.url })
        }
      }
    })

    return imagesWithSignedUrls;
  }

  async deleteAssetImages(imageIds: number[], assetId: string) {
    const images = await this.db.query.AssetImages.findMany({ where: (assetImages, { eq, inArray }) => eq(assetImages.assetId, assetId) && inArray(assetImages.id, imageIds) })
    const results = await Promise.allSettled(images.map(async (image) => {
      try {
        await this.objectStorageService.deleteObject(image.filePath);
        return { success: true, imageId: image.id }
      } catch (e) {
        return { success: false, imageId: image.id }
      }

    }));
    const successfulDeletes: number[] = []
    const unsuccessfulDeletes: number[] = []
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successfulDeletes.push(result.value.imageId)
      } else if (result.status === 'fulfilled' && result.value.success === false) {
        unsuccessfulDeletes.push(result.value.imageId)
      }
    })

    await this.db.delete(schema.AssetImages).where(and(eq(schema.AssetImages.assetId, assetId), inArray(schema.AssetImages.id, successfulDeletes))).execute();

    return unsuccessfulDeletes
  }

  async getAssetsWithDetails(tenant: string, assetTypes?: number[], page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions: any[] = [eq(schema.Asset.tenantId, tenant)];
    if (assetTypes && assetTypes.length > 0) {
      conditions.push(inArray(schema.Asset.assetTypeId, assetTypes.map((id) => (id))));
    }

    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Asset)
      .where(and(...conditions))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated assets
    const assets = await this.db.query.Asset.findMany({
      where: (asset, { eq, and, inArray }) =>
        and(
          eq(asset.tenantId, tenant),
          assetTypes ? inArray(asset.assetTypeId, assetTypes.map((id) => (id))) : undefined
        ),
      with: {
        assetType: true,
        assetImages: true,
      },
      limit: pageSize,
      offset: offset,
    });

    // Calculate pagination metadata
    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    const assetsWithDetails = await Promise.all(
      assets.map(async (asset) => {
        const propertyValues = await this.getPropertyValues(asset.id);
        const assetImages = await this.getAssetImages(asset.id);
        const tagRels = await this.getTagsForAsset(asset.id);
        const tags = tagRels
          .map((rel) => rel.tag)
          .filter((tag): tag is NonNullable<typeof tag> => tag !== null);


        return {
          ...asset,
          assetImages,
          propertyValues,
          tags,
        };
      })
    );

    return {
      data: assetsWithDetails,
      pagination: paginationData,
    };
  }

  async getAvailableAssets(startDate: Date, endDate: Date, tenantId: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // 1. Get total count of all assets for the current tenant
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Asset)
      .where(eq(schema.Asset.tenantId, tenantId))
      .execute();
    const totalAssetCount = totalCountResult[0]?.count || 0;

    // 2. Get all assets for the current tenant (needed for filtering)
    const allAssets = await this.db
      .select({
        id: schema.Asset.id,
        name: schema.Asset.name,
        tenantId: schema.Asset.tenantId,
      })
      .from(schema.Asset)
      .where(eq(schema.Asset.tenantId, tenantId));

    console.log('Fetched Assets for Tenant:', allAssets);

    const allAssetIds = allAssets.map((a) => a.id);

    // 3. Get bookings that overlap with the range for the current tenant's assets
    const bookings = await this.db
      .select({ assetId: schema.Booking.assetId })
      .from(schema.Booking)
      .where(
        and(
          inArray(schema.Booking.assetId, allAssetIds),
          lte(schema.Booking.startDate, endDate),
          gte(schema.Booking.endDate, startDate)
        )
      );

    console.log('Bookings Found:', bookings);

    const bookedAssetIds = new Set(bookings.map((b) => b.assetId));

    // 4. Filter available assets for the tenant
    const availableAssets = allAssets.filter(
      (asset) => !bookedAssetIds.has(asset.id)
    );

    console.log('Filtered Available Assets:', availableAssets);

    // 5. Apply pagination
    const totalCount = availableAssets.length;
    const paginatedAssets = availableAssets.slice(offset, offset + pageSize);

    // Calculate pagination metadata
    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    return {
      data: paginatedAssets,
      pagination: paginationData,
    };
  }

  async getAssetsBySubdomain(
    subdomain: string,
    page: number = 1,
    pageSize: number = 10
  ) {
    const offset = (page - 1) * pageSize;

    // Get total count for pagination metadata
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Asset)
      .innerJoin(schema.Tenant, eq(schema.Asset.tenantId, schema.Tenant.id))
      .where(eq(schema.Tenant.subdomain, subdomain))
      .execute();

    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated results
    const results = await this.db
      .select()
      .from(schema.Asset)
      .innerJoin(schema.Tenant, eq(schema.Asset.tenantId, schema.Tenant.id))
      .where(eq(schema.Tenant.subdomain, subdomain))
      .limit(pageSize)
      .offset(offset)
      .execute();

    // Calculate pagination metadata
    const paginationData = {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };

    // Fetch tags, properties, and images for each asset
    const assetsWithDetails = await Promise.all(
      results.map(async (res) => {
        const assetTags = await this.getTagsForAsset(res.assets.id);
        const propertyValues = await this.getPropertyValues(res.assets.id);
        const assetImages = await this.getAssetImages(res.assets.id);

        return {
          id: res.assets.id,
          name: res.assets.name,
          description: res.assets.description || undefined,
          images: assetImages.map((img) => img.filePath),
          properties: propertyValues.map((prop) => ({
            id: prop.assetProperty.id,
            name: prop.assetProperty.name,
            value: prop.value,
          })),
          tags: assetTags
            .map((rel) => rel.tag)
            .filter((tag): tag is NonNullable<typeof tag> => tag !== null)
            .map((tag) => ({
              id: tag.id,
              name: tag.name,
            })),
          pagination: paginationData,
        };
      })
    );

    return {
      data: assetsWithDetails,
    };
  }

  async getAssetDetailsBySubdomain(subdomain: string, assetId: string) {
    // First verify the asset belongs to this subdomain's tenant
    const result = await this.db
      .select()
      .from(schema.Asset)
      .innerJoin(schema.Tenant, eq(schema.Asset.tenantId, schema.Tenant.id))
      .where(and(eq(schema.Tenant.subdomain, subdomain), eq(schema.Asset.id, assetId)))
      .execute()
      .then((rows) => rows[0]);

    if (!result) {
      return null;
    }

    const asset = result.assets;

    // Fetch related data
    const [assetTags, assetImages, propertyValues] = await Promise.all([
      this.getTagsForAsset(assetId),
      this.getAssetImages(assetId),
      this.getPropertyValues(assetId),
    ]);

    return {
      ...asset,
      tags: assetTags
        .map((rel) => rel.tag)
        .filter((tag): tag is NonNullable<typeof tag> => tag !== null),
      images: assetImages,
      properties: propertyValues,
    };
  }

  async updateAssetIsAvailable(available:boolean,assetId:string){
    await this.db.update(schema.Asset).set({available}).where(eq(schema.Asset.id,assetId)).execute();

    return { message: 'Asset availability updated successfully' };
  }


}
