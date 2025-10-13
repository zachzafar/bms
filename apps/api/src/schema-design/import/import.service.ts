import { Injectable } from '@nestjs/common';
import csv from 'csv-parser';
import { Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { AssetTypeService } from '../asset-type/asset-type.service';
import { TenantService } from 'src/tenant/tenant.service';
import { AssetsService } from 'src/assets/assets.service';

type ImportItem = {
    properties: {[key: string]: any},
    images: string[]
}

type PropertyValue = {
    propertyId: number,
    value: string
}

@Injectable()
export class ImportService {
    private readonly logger = new Logger(AssetTypeService.name);

    constructor(
        private assetTypeService: AssetTypeService,
        private assetService: AssetsService,
        private tenantService: TenantService
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
                console.log("Row", rows);
                console.log("Schema", schema);

                resolve({ schema, rows: rows.slice(0, 5) });
            }).on('error', (error: any) => {
                reject(error);
            })
        })

    }


    // Accepts tenantId and JSON file image urls are downloaded and added to the tenant's assets the property fields are mapped to fields that exist for the asset type
    async BulkAssetUpload(tenantId: string, file: Express.Multer.File, assetTypeId: number) {
        try {
            
            const dataStr = file.buffer
                ? file.buffer.toString('utf-8')
                : await fs.readFile(file.path, 'utf-8');

            const jsonData = JSON.parse(dataStr)
            
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
            console.log(assetType)
            const extractData:ImportItem[] = []
            for (const item of jsonData) {
                const extractedItem: ImportItem = {
                    properties: {},
                    images: []
                };

                if (item.images && Array.isArray(item.images)) {
                    extractedItem.images = item.images;
                }

                if(!item.name) continue

                extractedItem.properties = item;
                extractData.push(extractedItem);
            }

            const extractedData = jsonData.map((item: any) => {
                const extractedItem: ImportItem = {
                    properties: {},
                    images: []
                };

                if (item.images && Array.isArray(item.images)) {
                    extractedItem.images = item.images;
                }

                extractedItem.properties = item;
                return extractedItem;
            })

            for (const item of extractedData) {
                const asset = await this.assetService.createAsset({
                    tenantId,
                    assetTypeId,
                    name: item.properties.name,
                });

                if (!asset) continue;

                this.logger.log(`Created asset ${asset}`);
                if (item.images && item.images.length > 0) {
                    const imageBuffers = await Promise.all(item.images.map(async (imageUrl) => {
                        const response = await fetch(imageUrl);
                        const arrayBuffer = await response.arrayBuffer();
                        return Buffer.from(arrayBuffer);
                    }));
                    await this.assetService.uploadAssetImages(tenantId, asset, imageBuffers);
                    this.logger.log(`Uploaded ${imageBuffers.length} images for asset ${asset}`);
                }
                this.logger.log(`Attempting to add asset properties: ${JSON.stringify(item.properties)}`);

                const propertyValues: PropertyValue[] = [];
                const assetTypeSchema = assetType.properties
                console.log(assetTypeSchema)

                for (const property of assetTypeSchema) {
                    if (property.name in item.properties && item.properties[property.name] !== undefined && item.properties[property.name] !== null) {
                        switch (property.propertyType) {
                            case 'string':
                                propertyValues.push({
                                    propertyId: property.id,
                                    value: item.properties[property.name],
                                });
                                break;
                            case 'number':
                                propertyValues.push({
                                    propertyId: property.id,
                                    value: item.properties[property.name],
                                });
                                break;
                            case 'list':
                                if (!Array.isArray(item.properties[property.name])) continue;
                                propertyValues.push({
                                    propertyId: property.id,
                                    value: item.properties[property.name].join(','),
                                });
                                break;
                            default:
                                break;
                        }
                    }
                }

                console.log(propertyValues)

                await this.assetService.addPropertyValues(asset, propertyValues);
                this.logger.log(`Added ${propertyValues.length} property values for asset ${asset}`);
            }
        } catch (error: any) {
            throw error;
        }
    }

}