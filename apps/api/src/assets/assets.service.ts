import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { and, eq, inArray } from 'drizzle-orm';
import type { InsertAsset, UpdateAsset } from '@repo/api-contract';
import { ObjectStorageService } from 'src/object-storage/object-storage.service';



@Injectable()
export class AssetsService {
    private readonly logger = new Logger(AssetsService.name);
    constructor(
        @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
        private objectStorageService: ObjectStorageService
    ) {}

    async getAssets(query: any,tenantId: string) {
        return await this.db.query.Asset.findMany({where: (asset,{eq}) => eq(asset.tenantId,tenantId)})
    }

    async getAssetById(id: string) {
        return this.db.query.Asset.findFirst({ where: (asset, { eq }) => eq(asset.id, id) });
    }

    async createAsset(data: InsertAsset) {
        let assetTypeId = data.assetTypeId ? BigInt(data.assetTypeId) : undefined;
        try{
            const result = await this.db.insert(schema.Asset).values({...data, assetTypeId}).$returningId()
            return result[0].id
        } catch (e) {
            throw new InternalServerErrorException("Error occured while creating asset") 
        }
    }

    async updateAsset(id: string, data: UpdateAsset) {
        let assetTypeId = data.assetTypeId ? BigInt(data.assetTypeId) : undefined;
        await this.db.update(schema.Asset).set({...data, assetTypeId }).where(eq(schema.Asset.id, id)).execute()
        return this.getAssetById(id);
    }

    async deleteAsset(id: string) {
        return this.db.delete(schema.Asset).where(eq(schema.Asset.id, id));
    }

    async addPropertyValues(assetId: string, propertyValues: {propertyId: number,value:string}[]){
       await this.db.delete(schema.AssetHasProperties).where(eq(schema.AssetHasProperties.assetId, assetId)).execute(); 

       return await this.db.insert(schema.AssetHasProperties).values(
            propertyValues.map(({propertyId,value}) => ({
                assetId,
                assetPropertyId: BigInt(propertyId),
                value
            }))
        ).$returningId().execute();
    }

    async getPropertyValues(assetId: string) {
        return await this.db.query.AssetHasProperties.findMany({where: (assetHasProperties,{eq}) => eq(assetHasProperties.assetId,assetId), with: {assetProperty: true}})
    }
    
    async uploadAssetImages(tenant:string,assetId: string, images: Buffer[]) {
        this.logger.log("Attempting to use storage service")
        const imageUrls = await Promise.all(images.map(async (image) => {
            const imageUrl = await this.objectStorageService.uploadObject(image,"image",tenant,assetId);
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
        const images = await this.db.query.AssetImages.findMany({where: (assetImages,{eq}) => eq(assetImages.assetId,assetId)})
        const results = await Promise.allSettled(images.map( async (image) => {
            try {
                const url = await this.objectStorageService.getObjectUrl(image.filePath)
                return { success: true, url, image}  
            } catch (e) {
                return { success: false, error: e}
            }
        }))
        const imagesWithSignedUrls:schema.SelectAssetImages[] = []
        results.forEach((result) => {
            if (result.status === "rejected") {
                this.logger.error(result.reason)
            } else if (result.status === "fulfilled" && result.value.success) {
               if (result.value.url) {
                    imagesWithSignedUrls.push({...result.value.image, filePath: result.value.url})
               }
            }
        })

        return imagesWithSignedUrls;
    }

    async deleteAssetImages(imageIds: number[],assetId: string) {
        const images = await this.db.query.AssetImages.findMany({where: (assetImages,{eq,inArray}) => eq(assetImages.assetId,assetId) && inArray(assetImages.id,imageIds)})
        const results = await Promise.allSettled(images.map(async (image) => {
            try {
                await this.objectStorageService.deleteObject(image.filePath);
                return { success: true, imageId: image.id}
            } catch (e) {
                return { success: false, imageId: image.id}
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
        
        await this.db.delete(schema.AssetImages).where(and(eq(schema.AssetImages.assetId,assetId),inArray(schema.AssetImages.id,successfulDeletes))).execute();

        return unsuccessfulDeletes
    }
}
