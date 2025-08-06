import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import type { InsertAsset, UpdateAsset } from '@repo/api-contract';
import { ObjectStorageService } from 'src/object-storage/object-storage.service';



@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
    private objectStorageService: ObjectStorageService
  ) { }

  async getAssets(query: any, tenantId: string) {
    const assets = await this.db.query.Asset.findMany({
      where: (asset, { eq }) => eq(asset.tenantId, tenantId),
    });

    return Promise.all(
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


  async createAsset(data: InsertAsset, tagIds?: string[]) {
    let assetTypeId = data.assetTypeId ? BigInt(data.assetTypeId) : undefined;

    try {
      const result = await this.db
        .insert(schema.Asset)
        .values({ ...data, assetTypeId })
        .$returningId();

      const assetId = result[0].id;

      if (tagIds && tagIds.length > 0) {
        for (const tagId of tagIds) {
          await this.db.insert(schema.AssetHasTags).values({
            assetId,
            tagId: BigInt(tagId),
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

  async updateAsset(id: string, data: UpdateAsset) {
    let assetTypeId = data.assetTypeId ? BigInt(data.assetTypeId) : undefined;
    await this.db
      .update(schema.Asset)
      .set({ ...data, assetTypeId })
      .where(eq(schema.Asset.id, id))
      .execute();
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

      // Step 6: Finally delete the asset
      await tx.delete(schema.Asset).where(eq(schema.Asset.id, id));
    });
  }

  async addPropertyValues(assetId: string, propertyValues: { propertyId: number, value: string }[]) {
    await this.db.delete(schema.AssetHasProperties).where(eq(schema.AssetHasProperties.assetId, assetId)).execute();

    return await this.db.insert(schema.AssetHasProperties).values(
      propertyValues.map(({ propertyId, value }) => ({
        assetId,
        assetPropertyId: BigInt(propertyId),
        value
      }))
    ).$returningId().execute();
  }

  async getPropertyValues(assetId: string) {
    return await this.db.query.AssetHasProperties.findMany({ where: (assetHasProperties, { eq }) => eq(assetHasProperties.assetId, assetId), with: { assetProperty: true } })
  }

  async uploadAssetImages(tenant: string, assetId: string, images: Buffer[]) {
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

  async getAssetsWithDetails(tenant: string, assetTypes?: number[]) {
    const assets = await this.db.query.Asset.findMany({
      where: (asset, { eq, and, inArray }) =>
        and(
          eq(asset.tenantId, tenant),
          assetTypes ? inArray(asset.assetTypeId, assetTypes.map((id) => BigInt(id))) : undefined
        ),
      with: {
        assetType: true,
        assetImages: true,
      },
    });

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

    return assetsWithDetails;
  }

  async getAvailableAssets(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 1. Get all assets
  const allAssets = await this.db
    .select({
      id: schema.Asset.id,
      name: schema.Asset.name
    })
    .from(schema.Asset);

  const allAssetIds = allAssets.map((a) => a.id);

  // 2. Get bookings that overlap with the range
  const bookings = await this.db
    .select({ assetId: schema.Booking.assetId })
    .from(schema.Booking)
    .where(
      and(
        inArray(schema.Booking.assetId, allAssetIds),
        lte(schema.Booking.startDate, end),
        gte(schema.Booking.endDate, start)
      )
    );

  const bookedAssetIds = new Set(bookings.map((b) => b.assetId));

  // 3. Filter available
  const availableAssets = allAssets.filter(
    (asset) => !bookedAssetIds.has(asset.id)
  );

  return availableAssets;
}


}
