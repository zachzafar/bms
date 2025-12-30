import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, gte, lte } from 'drizzle-orm';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { InsertRate, UpdateRate } from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';

@Injectable()
export class RatesService {
  constructor(
    private readonly tenantService: TenantService,
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

 async createRate(data: InsertRate, assetIds?: string[]): Promise<string> {
  try {
    // Insert Rate record, convert dates properly
    const [inserted] = await this.db
      .insert(schema.Rate)
      .values({
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      })
      .$returningId();

    const newRateId = inserted.id.toString();

    // If assetIds provided, bulk insert join rows
    if (assetIds && assetIds.length > 0) {
      await this.db.insert(schema.AssetHasRates).values(
        assetIds.map((assetId) => ({
          assetId,
          rateId: inserted.id,
        }))
      );
    }

    return newRateId;
  } catch (e) {
    throw new ConflictException('Failed to create rate: ' + e);
  }
}




  async getRates(assetId?: string) {
  if (assetId) {
    // Join Rate with AssetHasRates and filter on assetId
    const rows = await this.db
      .select({
        rate: schema.Rate,
        assetHasRate: schema.AssetHasRates,
      })
      .from(schema.Rate)
      .innerJoin(schema.AssetHasRates, eq(schema.Rate.id, schema.AssetHasRates.rateId))
      .where(eq(schema.AssetHasRates.assetId, assetId));

    const grouped = new Map<
      number,
      { rate: typeof schema.Rate.$inferSelect; assetIds: string[] }
    >();

    for (const { rate, assetHasRate } of rows) {
      if (!grouped.has(rate.id)) {
        grouped.set(rate.id, { rate, assetIds: [] });
      }
      grouped.get(rate.id)!.assetIds.push(assetHasRate.assetId);
    }

    return Array.from(grouped.values());
  }

  // No asset filter - fetch all rates 
  const rows = await this.db
    .select({
      rate: schema.Rate,
      assetHasRate: schema.AssetHasRates,
    })
    .from(schema.Rate)
    .leftJoin(schema.AssetHasRates, eq(schema.Rate.id, schema.AssetHasRates.rateId));

  const grouped = new Map<
    number,
    { rate: typeof schema.Rate.$inferSelect; assetIds: string[] }
  >();

  for (const { rate, assetHasRate } of rows) {
    if (!grouped.has(rate.id)) {
      grouped.set(rate.id, { rate, assetIds: [] });
    }
    if (assetHasRate) {
      grouped.get(rate.id)!.assetIds.push(assetHasRate.assetId);
    }
  }

  return Array.from(grouped.values());
}




async getRate(id: string) {
  const numericId = Number(id);
  if (isNaN(numericId)) throw new NotFoundException('Invalid rate id');

  const rate = await this.db.query.Rate.findFirst({
    where: (r, { eq }) => eq(r.id, numericId),
    with: {
      assets: true,
    },
  });

  if (!rate) {
    throw new NotFoundException('Rate not found');
  }

  return rate;
}

async updateRate(id: string, updateData: UpdateRate & { assetIds?: string[] }) {
  const numericId = Number(id);
  if (isNaN(numericId)) throw new NotFoundException('Invalid rate id');

  const existing = await this.db.query.Rate.findFirst({
    where: (r, { eq }) => eq(r.id, numericId),
  });

  if (!existing) {
    throw new NotFoundException('Rate not found');
  }

  try {
    const safeUpdate = {
      ...updateData,
      startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
      endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
    } as Omit<typeof updateData, 'startDate' | 'endDate' | 'assetIds'> & {
      startDate?: Date;
      endDate?: Date;
    };

    await this.db.update(schema.Rate)
      .set(safeUpdate)
      .where(eq(schema.Rate.id, numericId));

    if (updateData.assetIds) {
      await this.db.delete(schema.AssetHasRates).where(eq(schema.AssetHasRates.rateId, numericId));

      if (updateData.assetIds.length > 0) {
        await this.db.insert(schema.AssetHasRates).values(
          updateData.assetIds.map(assetId => ({
            assetId,
            rateId: numericId,
          }))
        );
      }
    }
  } catch (e) {
    throw new ConflictException('Error updating rate: ' + e);
  }
}


async deleteRate(id: string) {
  const numericId = Number(id);
  if (isNaN(numericId)) throw new NotFoundException('Invalid rate id');

  const existing = await this.db.query.Rate.findFirst({
    where: (r, { eq }) => eq(r.id, numericId),
  });

  if (!existing) {
    throw new NotFoundException('Rate not found');
  }

  // Delete associated asset
  await this.db.delete(schema.AssetHasRates).where(eq(schema.AssetHasRates.rateId, numericId));

  // Then delete the rate itself
  await this.db.delete(schema.Rate)
    .where(eq(schema.Rate.id, numericId));
}
}