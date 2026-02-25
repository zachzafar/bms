import { Injectable } from '@nestjs/common';
import csv from 'csv-parser';
import { Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { AssetTypeService } from '../asset-type/asset-type.service';
import { TenantService } from 'src/tenant/tenant.service';
import { AssetsService } from 'src/assets/assets.service';
import { TagsService } from 'src/tags/tags.service';

type ImportItem = {
    name: string;
    slug?: string;
    tags: string[];
    properties: { [key: string]: any };
    images: string[];
    coordinates?: { lat: number; lng: number };
}

type PropertyValue = {
    propertyId: number,
    value: string
}

@Injectable()
export class ImportService {
    private readonly logger = new Logger(ImportService.name);

    constructor(
        private assetTypeService: AssetTypeService,
        private assetService: AssetsService,
        private tenantService: TenantService,
        private tagsService: TagsService,
    ) { }

    async parseCsvSchema(fileBuffer: Buffer): Promise<any> {
        const rows: any[] = []
        const schema: any[] = [];

        return new Promise((resolve, reject) => {
            const stream = require('stream');
            const bufferStream = new stream.PassThrough();
            bufferStream.end(fileBuffer);

            bufferStream.pipe(csv()).on('headers', (row: any) => {
                if (schema.length === 0) {
                    Object.keys(row).forEach((key) => {
                        schema.push({
                            name: row[key],
                            type: typeof row[key],
                        });
                    });
                }
            }).on('data', (row: any) => {
                rows.push(row);
            }).on('end', () => {
                resolve({ schema, rows: rows.slice(0, 5) });
            }).on('error', (error: any) => {
                reject(error);
            })
        })
    }

    // Accepts tenantId and JSON file; image urls are downloaded and added to the tenant's assets;
    // property fields are mapped to fields that exist for the asset type.
    async BulkAssetUpload(tenantId: string, file: Express.Multer.File, assetTypeId: number) {
        try {
            const dataStr = file.buffer
                ? file.buffer.toString('utf-8')
                : await fs.readFile(file.path, 'utf-8');

            const jsonData = JSON.parse(dataStr);

            if (!Array.isArray(jsonData)) {
                throw new Error('JSON file must contain an array of assets');
            }

            const tenant = await this.tenantService.getTenantsDetails([tenantId]);
            if (!tenant || tenant.length === 0) {
                throw new Error(`Tenant with ID ${tenantId} not found`);
            }

            const assetType = await this.assetTypeService.getAssetType(assetTypeId);
            if (assetType.tenantId !== tenantId) {
                throw new Error(`Asset type with ID ${assetTypeId} does not belong to tenant ${tenantId}`);
            }

            // Collect all unique tag slugs referenced across the whole batch, then resolve them once
            const allTagSlugs: string[] = [];
            for (const item of jsonData) {
                if (Array.isArray(item.tag)) {
                    for (const s of item.tag) {
                        if (typeof s === 'string' && !allTagSlugs.includes(s)) {
                            allTagSlugs.push(s);
                        }
                    }
                }
            }
            const resolvedTags = await this.tagsService.getTagsBySlug(allTagSlugs, tenantId);
            const tagSlugToId = new Map<string, number>(resolvedTags.map((t) => [t.slug, t.id]));

            for (const item of jsonData) {
                if (!item.name) continue;

                // --- Resolve slug (skip if duplicate) ---
                let slug: string | undefined;
                if (item.slug) {
                    const available = await this.assetService.checkAssetSlug(tenantId, item.slug);
                    slug = available ? item.slug : undefined;
                    if (!available) {
                        this.logger.warn(`Slug "${item.slug}" already taken for asset "${item.name}", creating without slug`);
                    }
                }

                // --- Resolve tag IDs from tag slug array ---
                const tagSlugs: string[] = Array.isArray(item.tag) ? item.tag : [];
                const tagIds = tagSlugs
                    .map((s: string) => tagSlugToId.get(s))
                    .filter((id): id is number => id !== undefined);

                // --- Create asset ---
                const assetId = await this.assetService.createAsset(
                    { tenantId, assetTypeId, name: item.name, slug },
                    undefined,
                    tagIds.length > 0 ? tagIds : undefined,
                );

                if (!assetId) continue;
                this.logger.log(`Created asset ${assetId} ("${item.name}")`);

                // --- Set location from coordinates ---
                if (item.coordinates?.lat != null && item.coordinates?.lng != null) {
                    await this.assetService.setAssetLocation(assetId, {
                        lat: item.coordinates.lat,
                        lng: item.coordinates.lng,
                        address: null,
                    });
                    this.logger.log(`Set location for asset ${assetId}`);
                }

                // --- Upload images ---
                const imageUrls: string[] = Array.isArray(item.images) ? item.images : [];
                if (imageUrls.length > 0) {
                    const imageBuffers = await Promise.all(
                        imageUrls.map(async (imageUrl) => {
                            const response = await fetch(imageUrl);
                            const arrayBuffer = await response.arrayBuffer();
                            return Buffer.from(arrayBuffer);
                        })
                    );
                    await this.assetService.uploadAssetImages(tenantId, assetId, imageBuffers);
                    this.logger.log(`Uploaded ${imageBuffers.length} images for asset ${assetId}`);
                }

                // --- Map properties to asset type schema ---
                const propertyValues: PropertyValue[] = [];
                const assetProperties = item.properties ?? {};

                for (const property of assetType.properties) {
                    const rawValue = assetProperties[property.name];
                    if (rawValue === undefined || rawValue === null || rawValue === '') continue;

                    switch (property.propertyType) {
                        case 'string':
                        case 'number':
                            propertyValues.push({ propertyId: property.id, value: String(rawValue) });
                            break;
                        case 'list':
                            if (!Array.isArray(rawValue)) break;
                            propertyValues.push({ propertyId: property.id, value: rawValue.join(',') });
                            break;
                        default:
                            break;
                    }
                }

                await this.assetService.addPropertyValues(assetId, propertyValues);
                this.logger.log(`Added ${propertyValues.length} property values for asset ${assetId}`);
            }
        } catch (error: any) {
            throw error;
        }
    }
}
