import { BadRequestException, Body, Controller, HttpCode, Logger, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { contract,} from '@repo/api-contract';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { IsAdminRoute } from 'src/auth/decorators/admin.decorator';

import { TenantService } from 'src/tenant/tenant.service';
import { AssetTypeService } from '../asset-type/asset-type.service';
import { AssetsService } from 'src/assets/assets.service';
import * as schema from "@repo/api-contract"
import { ImportService } from './import.service';

@Controller()
export class ImportController {
    private readonly logger = new Logger(ImportController.name);

    constructor(
        private readonly tenantService: TenantService,
        private readonly importService: ImportService,
    ) {}


    // Replace TsRestHandler with a standard NestJS route
    @Post('/system-admin/bulk-upload')
    @IsAdminRoute()
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(200)
    async bulkUpload(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { tenantId: string; assetTypeId: number }
    ): Promise<{ message: string }> {

        await this.tenantService.validateTenantAccess(body.tenantId, schema.AssetType, body.assetTypeId);

        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        this.logger.log(`Uploading file for asset type: ${body.assetTypeId}`);
        await this.importService.BulkAssetUpload(body.tenantId, file, body.assetTypeId);

        return { message: 'Successfully uploaded assets' };
    }
}
