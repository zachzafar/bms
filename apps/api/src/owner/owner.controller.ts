import { Controller, Logger, Req, UseGuards } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { bookingContract, maintenanceContract, assetsContract } from '@repo/api-contract';
import { OwnerGuard } from 'src/auth/guards/owner/owner.guard';
import { BookingService } from 'src/booking/booking.service';
import { MaintenanceService } from 'src/maintenance/maintenance.service';
import { AssetsService } from 'src/assets/assets.service';

@Controller()
@UseGuards(OwnerGuard)
export class OwnerController {
  private readonly logger = new Logger(OwnerController.name);

  constructor(
    private readonly bookingService: BookingService,
    private readonly maintenanceService: MaintenanceService,
    private readonly assetsService: AssetsService,
  ) {}

  // ==========================================
  // Owner Booking Endpoints
  // ==========================================

  @TsRestHandler(bookingContract.getOwnerBookings)
  async getOwnerBookings(@Req() request: any) {
    return tsRestHandler(bookingContract.getOwnerBookings, async ({ query }) => {
      const ownerAssets = request.ownerAssets || [];
      const ownerId = request.user.sub;

      this.logger.log(`Owner ${ownerId} fetching bookings for ${ownerAssets.length} assets`);

      const result = await this.bookingService.getOwnerBookings(
        ownerId,
        ownerAssets,
        query.assetId,
        query.page || 1,
        query.pageSize || 10
      );

      return {
        status: 200 as const,
        body: result,
      };
    });
  }

  @TsRestHandler(bookingContract.getOwnerBooking)
  async getOwnerBooking(@Req() request: any) {
    return tsRestHandler(bookingContract.getOwnerBooking, async ({ params }) => {
      const ownerAssets = request.ownerAssets || [];
      const ownerId = request.user.sub;

      try {
        const booking = await this.bookingService.getOwnerBooking(
          ownerId,
          ownerAssets,
          params.id
        );

        return {
          status: 200 as const,
          body: booking as any,
        };
      } catch (error) {
        this.logger.error(`Error fetching booking ${params.id} for owner ${ownerId}:`, error);
        return {
          status: 404 as const,
          body: undefined,
        };
      }
    });
  }

  // ==========================================
  // Owner Maintenance Endpoints
  // ==========================================

  @TsRestHandler(maintenanceContract.getOwnerMaintenances)
  async getOwnerMaintenances(@Req() request: any) {
    return tsRestHandler(maintenanceContract.getOwnerMaintenances, async ({ query }) => {
      const ownerAssets = request.ownerAssets || [];
      const ownerId = request.user.sub;

      this.logger.log(`Owner ${ownerId} fetching maintenance for ${ownerAssets.length} assets`);

      const result = await this.maintenanceService.getOwnerMaintenances(
        ownerId,
        ownerAssets,
        query.page || 1,
        query.pageSize || 10
      );

      return {
        status: 200 as const,
        body: result,
      };
    });
  }

  @TsRestHandler(maintenanceContract.getOwnerMaintenance)
  async getOwnerMaintenance(@Req() request: any) {
    return tsRestHandler(maintenanceContract.getOwnerMaintenance, async ({ params }) => {
      const ownerAssets = request.ownerAssets || [];
      const ownerId = request.user.sub;
      console.log(`ownerid ${ownerId}`)
      try {
        const maintenance = await this.maintenanceService.getOwnerMaintenance(
          ownerId,
          ownerAssets,
          params.id
        );

        return {
          status: 200 as const,
          body: maintenance,
        };
      } catch (error) {
        this.logger.error(`Error fetching maintenance ${params.id} for owner ${ownerId}:`, error);
        return {
          status: 404 as const,
          body: undefined,
        };
      }
    });
  }

  // ==========================================
  // Owner Asset Endpoints
  // ==========================================

  @TsRestHandler(assetsContract.getOwnerAssets)
  async getOwnerAssets(@Req() request: any) {
    return tsRestHandler(assetsContract.getOwnerAssets, async ({ query }) => {
      const ownerId = request.user.sub;

      this.logger.log(`Owner ${ownerId} fetching assets`);

      const result = await this.assetsService.getOwnerAssets(
        ownerId,
        query.page || 1,
        query.pageSize || 10
      );

      return {
        status: 200 as const,
        body: result,
      };
    });
  }

  @TsRestHandler(assetsContract.getOwnerAsset)
  async getOwnerAsset(@Req() request: any) {
    return tsRestHandler(assetsContract.getOwnerAsset, async ({ params }) => {
      const ownerId = request.user.sub;

      const asset = await this.assetsService.getOwnerAsset(
        ownerId,
        params.id
      );

      if (!asset) {
        this.logger.error(`Asset ${params.id} not found or not accessible for owner ${ownerId}`);
        return {
          status: 404 as const,
          body: undefined,
        };
      }

      return {
        status: 200 as const,
        body: asset as any,
      };
    });
  }
}
