import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { and, eq, gte, inArray, isNull, lte, ne, sql } from 'drizzle-orm';
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

  async getAssets(tenantId: string,query: {search?:string,assetTypeId?:number}, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions: any[] = [eq(schema.Asset.tenantId, tenantId), isNull(schema.Asset.deletedAt)];
    if (query?.assetTypeId) conditions.push(eq(schema.Asset.assetTypeId, query.assetTypeId));
    if (query?.search) conditions.push(sql`${schema.Asset.name} LIKE ${`%${query.search}%`}`);

    // Get total count
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Asset)
      .where(and(...conditions))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated assets
    const assets = await this.db.query.Asset.findMany({
      where: (asset, { eq, and, like, isNull }) =>
        and(
          eq(asset.tenantId, tenantId),
          isNull(asset.deletedAt),
          query?.assetTypeId ? eq(asset.assetTypeId, query.assetTypeId) : undefined,
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



    return {
      data: assets,
      pagination: paginationData,
    };
  }

  async getAssetById(id: string) {
    const asset = await this.db.query.Asset.findFirst({
      where: (asset, { eq, and, isNull }) => and(eq(asset.id, id), isNull(asset.deletedAt)),
      with: {
        bookingForms: {
           with: {
            bookingForm: true
           }
        },
        tags: {
          with: {
            tag: true,
          }
        }
      }
    });
    if (!asset) return null;

    return asset
  }

  async createAsset(data: InsertAsset, formIds?: number[], tagIds?: number[]) {
    this.logger.log(`Creating asset "${data.name}" for tenant ${data.tenantId}`);
    try {
      const result = await this.db
        .insert(schema.Asset)
        .values(data)
        .$returningId();

      const assetId = result[0].id;

      if (formIds && formIds.length > 0) {
        for (const formId of formIds) {
          await this.db.insert(schema.AssetHasBookingForms).values({
            assetId,
            bookingFormId: formId,
          });
        }
      }

      if (tagIds && tagIds.length > 0) {
        await this.db.insert(schema.AssetHasTags).values(
          tagIds.map(tagId => ({ assetId, tagId }))
        );
      }

      return assetId;
    } catch (e) {
      throw new InternalServerErrorException(
        'Error occurred while creating asset'
      );
    }
  }

  async updateAsset(id: string, data: UpdateAsset & { formIds?: number[]; tagIds?: number[] }) {
    this.logger.log(`Updating asset ${id}`);
    const { formIds, tagIds, ...assetData } = data;
    let assetTypeId = assetData.assetTypeId ? (assetData.assetTypeId) : undefined;

    await this.db
      .update(schema.Asset)
      .set({ ...assetData, assetTypeId })
      .where(eq(schema.Asset.id, id))
      .execute();

    // Update forms if provided
    if (formIds !== undefined) {
      await this.db.delete(schema.AssetHasBookingForms).where(eq(schema.AssetHasBookingForms.assetId, id));
      if (formIds.length > 0) {
        for (const formId of formIds) {
          await this.db.insert(schema.AssetHasBookingForms).values({
            assetId: id,
            bookingFormId: formId,
          });
        }
      }
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      await this.db.delete(schema.AssetHasTags).where(eq(schema.AssetHasTags.assetId, id));
      if (tagIds.length > 0) {
        await this.db.insert(schema.AssetHasTags).values(
          tagIds.map(tagId => ({ assetId: id, tagId }))
        );
      }
    }

    return this.getAssetById(id);
  }

  async deleteAsset(id: string): Promise<{ success: boolean; message?: string }> {
    this.logger.log(`Deleting asset ${id}`);
    // Check for bookings (not deleted)
    const bookings = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Booking)
      .where(
        and(
          eq(schema.Booking.assetId, id),
          isNull(schema.Booking.deletedAt)
        )
      )
      .execute();

    const bookingCount = bookings[0]?.count || 0;
    if (bookingCount > 0) {
      throw new BadRequestException(
        `Cannot delete asset. It has ${bookingCount} booking(s) associated with it.`
      );
    }

    // If no bookings, proceed with soft delete
    const now = new Date();
    await this.db
      .update(schema.Asset)
      .set({ deletedAt: now })
      .where(eq(schema.Asset.id, id));

    return { success: true };
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
    this.logger.log(`Uploading ${images.length} image(s) for asset ${assetId} tenant ${tenant}`)
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
    const conditions: any[] = [eq(schema.Asset.tenantId, tenant), isNull(schema.Asset.deletedAt)];
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
      where: (asset, { eq, and, inArray, isNull }) =>
        and(
          eq(asset.tenantId, tenant),
          isNull(asset.deletedAt),
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

        return {
          ...asset,
          assetImages,
          propertyValues,
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
      .where(and(eq(schema.Asset.tenantId, tenantId),isNull(schema.Asset.deletedAt)));

    this.logger.log(`Fetched ${allAssets.length} assets for tenant ${tenantId}`);

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

    this.logger.log(`Found ${bookings.length} conflicting bookings for date range`);

    const bookedAssetIds = new Set(bookings.map((b) => b.assetId));

    // 4. Filter available assets for the tenant
    const availableAssets = allAssets.filter(
      (asset) => !bookedAssetIds.has(asset.id)
    );

    this.logger.log(`${availableAssets.length} assets available out of ${allAssets.length}`);

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
    pageSize: number = 10,
    filters: {
      assetTypeId?: number;
      tagSlugs?: string[];
      propertyFilters?: { name: string; value: string; operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'like' }[];
      returnRates?: boolean;
    } = {}
  ) {
    const offset = (page - 1) * pageSize;

    // Build base conditions
    const conditions: any[] = [
      eq(schema.Tenant.subdomain, subdomain),
      isNull(schema.Asset.deletedAt),
    ];

    if (filters.assetTypeId) {
      conditions.push(eq(schema.Asset.assetTypeId, filters.assetTypeId));
    }

    // Tag filter: asset must have at least one of the specified tag slugs
    if (filters.tagSlugs && filters.tagSlugs.length > 0) {
      const tagSubquery = this.db
        .selectDistinct({ assetId: schema.AssetHasTags.assetId })
        .from(schema.AssetHasTags)
        .innerJoin(schema.Tags, eq(schema.AssetHasTags.tagId, schema.Tags.id))
        .where(inArray(schema.Tags.slug, filters.tagSlugs));
      conditions.push(inArray(schema.Asset.id, tagSubquery));
    }

    // Property filters: asset must satisfy each filter (AND logic)
    if (filters.propertyFilters && filters.propertyFilters.length > 0) {
      for (const { name, value, operator } of filters.propertyFilters) {
        const numericValue = parseFloat(value);
        const valueCondition = operator === 'contains'
          ? sql`FIND_IN_SET(${value}, ${schema.AssetHasProperties.value}) > 0`
          : operator === 'like'
          ? sql`${schema.AssetHasProperties.value} LIKE ${`%${value}%`}`
          : (operator === 'eq' || isNaN(numericValue))
          ? eq(schema.AssetHasProperties.value, value)
          : operator === 'gt'
            ? sql`CAST(REPLACE(${schema.AssetHasProperties.value}, ',', '') AS DECIMAL(20,2)) > ${numericValue}`
            : operator === 'gte'
              ? sql`CAST(REPLACE(${schema.AssetHasProperties.value}, ',', '') AS DECIMAL(20,2)) >= ${numericValue}`
              : operator === 'lt'
                ? sql`CAST(REPLACE(${schema.AssetHasProperties.value}, ',', '') AS DECIMAL(20,2)) < ${numericValue}`
                : sql`CAST(REPLACE(${schema.AssetHasProperties.value}, ',', '') AS DECIMAL(20,2)) <= ${numericValue}`;

        const propSubquery = this.db
          .selectDistinct({ assetId: schema.AssetHasProperties.assetId })
          .from(schema.AssetHasProperties)
          .innerJoin(schema.assetProperty, eq(schema.AssetHasProperties.assetPropertyId, schema.assetProperty.id))
          .where(and(
            eq(schema.assetProperty.name, name),
            valueCondition,
          ));
        conditions.push(inArray(schema.Asset.id, propSubquery));
      }
    }

    const whereClause = and(...conditions);

    // Get total count for pagination metadata
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.Asset)
      .innerJoin(schema.Tenant, eq(schema.Asset.tenantId, schema.Tenant.id))
      .where(whereClause)
      .execute();

    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated results
    const results = await this.db
      .select()
      .from(schema.Asset)
      .innerJoin(schema.Tenant, eq(schema.Asset.tenantId, schema.Tenant.id))
      .where(whereClause)
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

    // Fetch tags, properties, images, and location for each asset
    const assetsWithDetails = await Promise.all(
      results.map(async (res) => {
        const [propertyValues, assetImages, location, rates] = await Promise.all([
          this.getPropertyValues(res.assets.id),
          this.getAssetImages(res.assets.id),
          this.getAssetLocation(res.assets.id),
          filters.returnRates ? this.getAssetRates(res.assets.id) : Promise.resolve(undefined),
        ]);

        return {
          id: res.assets.id,
          slug: res.assets.slug ?? null,
          name: res.assets.name,
          description: res.assets.description || undefined,
          images: assetImages.map((img) => img.filePath),
          properties: propertyValues.map((prop) => ({
            id: prop.assetProperty.id,
            name: prop.assetProperty.name,
            value: prop.value,
          })),
          location: location ?? null,
          ...(rates !== undefined && { rates }),
        };
      })
    );

    return {
      data: assetsWithDetails,
      pagination: paginationData,
    };
  }

  async getAssetDetailsBySubdomain(subdomain: string, slug: string) {
    // Look up by slug first, fall back to id for backward compatibility
    const result = await this.db
      .select()
      .from(schema.Asset)
      .innerJoin(schema.Tenant, eq(schema.Asset.tenantId, schema.Tenant.id))
      .where(and(
        eq(schema.Tenant.subdomain, subdomain),
        isNull(schema.Asset.deletedAt),
        sql`(${schema.Asset.slug} = ${slug} OR ${schema.Asset.id} = ${slug})`
      ))
      .execute()
      .then((rows) => rows[0]);

    if (!result) {
      return null;
    }

    const asset = result.assets;

    // Fetch related data
    const [assetImages, propertyValues, location] = await Promise.all([
      this.getAssetImages(asset.id),
      this.getPropertyValues(asset.id),
      this.getAssetLocation(asset.id),
    ]);

    return {
      ...asset,
      images: assetImages,
      properties: propertyValues,
      location: location ?? null,
    };
  }

  async updateAssetIsAvailable(available:boolean,assetId:string){
    await this.db.update(schema.Asset).set({available}).where(eq(schema.Asset.id,assetId)).execute();

    return { message: 'Asset availability updated successfully' };
  }

  // -----------------------------
  // Owner-specific Methods
  // -----------------------------

  async getOwnerInformation(ownerId: number) {
    const owner = await this.db.query.Owner.findFirst({
      where: (owner, { eq }) => eq(owner.id, ownerId),
    });

    if (!owner) {
      return null;
    }

    // Get owner's assets
    const ownerAssets = await this.db.query.OwnerHasAssets.findMany({
      where: (uha, { eq }) => eq(uha.ownerId, ownerId),
      with: {
        asset: true,
      }
    });

    return {
      ...owner,
      assets: ownerAssets.map(ua => ua.asset),
    };
  }

  async getOwnerAssets(ownerId: number, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    // Get total count of assets for this owner using OwnerHasAssets junction table
    const totalCountResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.OwnerHasAssets)
      .innerJoin(schema.Asset, eq(schema.OwnerHasAssets.assetId, schema.Asset.id))
      .where(and(eq(schema.OwnerHasAssets.ownerId, ownerId),isNull(schema.Asset.deletedAt)))
      .execute();
    const totalCount = totalCountResult[0]?.count || 0;

    // Get paginated assets for this owner using OwnerHasAssets junction table
    const rows = await this.db
      .select()
      .from(schema.OwnerHasAssets)
      .innerJoin(schema.Asset, eq(schema.OwnerHasAssets.assetId, schema.Asset.id))
      .where(and(eq(schema.OwnerHasAssets.ownerId, ownerId),isNull(schema.Asset.deletedAt)))
      .limit(pageSize)
      .offset(offset)
      .execute();

    const assets = rows.map(row => row.assets);

    // Fetch tags, images, and property values for each asset
    const assetsWithDetails = await Promise.all(
      assets.map(async (asset) => {
        const [ images, propertyValues] = await Promise.all([
          this.getAssetImages(asset.id),
          this.getPropertyValues(asset.id)
        ]);

        return {
          ...asset,
          images,
          propertyValues
        };
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
      data: assetsWithDetails,
      pagination: paginationData,
    };
  }

  // -----------------------------
  // Location Methods
  // -----------------------------

  async setAssetLocation(
    assetId: string,
    data: { address?: string | null; lat?: number | null; lng?: number | null }
  ): Promise<number> {
    this.logger.log(`Setting location for asset ${assetId}`);
    const existing = await this.db.query.AssetLocation.findFirst({
      where: (l, { eq }) => eq(l.assetId, assetId),
    });

    if (existing) {
      await this.db.update(schema.AssetLocation)
        .set({
          address: data.address ?? null,
          lat: data.lat != null ? String(data.lat) : null,
          lng: data.lng != null ? String(data.lng) : null,
        })
        .where(eq(schema.AssetLocation.id, existing.id));
      return existing.id;
    }

    const [{ id }] = await this.db.insert(schema.AssetLocation).values({
      assetId,
      address: data.address ?? null,
      lat: data.lat != null ? String(data.lat) : null,
      lng: data.lng != null ? String(data.lng) : null,
    }).$returningId();
    return id;
  }

  async getAssetLocation(assetId: string): Promise<schema.SelectAssetLocation | undefined> {
    return this.db.query.AssetLocation.findFirst({
      where: (l, { eq }) => eq(l.assetId, assetId),
    });
  }

  async getAssetRates(assetId: string) {
    const rows = await this.db.query.AssetHasRates.findMany({
      where: (r, { eq }) => eq(r.assetId, assetId),
      with: { rate: { with: { rateType: true } } },
    });
    return rows.map((r) => ({ ...r.rate, rateType: r.rate.rateType ?? null }));
  }

  async deleteAssetLocation(assetId: string): Promise<void> {
    await this.db.delete(schema.AssetLocation)
      .where(eq(schema.AssetLocation.assetId, assetId));
  }

  async checkAssetSlug(tenantId: string, slug: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(schema.Asset.tenantId, tenantId),
      eq(schema.Asset.slug, slug),
      isNull(schema.Asset.deletedAt),
    ];
    if (excludeId) {
      conditions.push(ne(schema.Asset.id, excludeId));
    }
    const existing = await this.db.query.Asset.findFirst({
      where: (_, { and }) => and(...conditions as any),
      columns: { id: true },
    });
    return existing === undefined;
  }

  async getOwnerAsset(ownerId: number, assetId: string) {
    // Verify owner owns the asset by checking OwnerHasAssets junction table
    const ownerAssetLink = await this.db.query.OwnerHasAssets.findFirst({
      where: (uha, { eq, and }) => and(
        eq(uha.ownerId, ownerId),
        eq(uha.assetId, assetId)
      ),
      with: {
        asset: true,
      }
    });

    if (!ownerAssetLink || !ownerAssetLink.asset || ownerAssetLink.asset.deletedAt) {
      return null;
    }

    const asset = ownerAssetLink.asset;

    // Fetch tags, images, and property values
    const [ images, propertyValues] = await Promise.all([
      this.getAssetImages(assetId),
      this.getPropertyValues(assetId)
    ]);

    return {
      ...asset,
      images,
      propertyValues
    };
  }


}
