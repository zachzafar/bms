import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, gte, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import * as schema from '@repo/api-contract';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { buildPagination } from 'src/common/paginate';

type Tx = Parameters<Parameters<MySql2Database<typeof schema>['transaction']>[0]>[0];

@Injectable()
export class BookingRepository {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) { }

  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }

  // ==============================
  // Booking reads
  // ==============================

  async findBookings(tenantId?: string, assetId?: string, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    const filters: any[] = [isNull(schema.Booking.deletedAt)];

    if (assetId) filters.push(eq(schema.Booking.assetId, assetId));
    if (tenantId) filters.push(eq(schema.Asset.tenantId, tenantId));

    const where = and(...filters);

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.Booking)
        .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
        .where(where)
        .execute(),
      this.db
        .select()
        .from(schema.Booking)
        .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
        .innerJoin(schema.AssetType, eq(schema.AssetType.id, schema.Asset.assetTypeId))
        .leftJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
        .where(where)
        .limit(pageSize)
        .offset(offset)
        .execute(),
    ]);

    return {
      data: rows.map((row) => ({
        ...row.booking,
        asset: row.assets,
        customer: row.customer_details,
        assetType: row.asset_type,
      })),
      pagination: buildPagination(page, pageSize, countResult[0]?.count ?? 0),
    };
  }

  async findBookingsByAssetId(
    assetId: string,
    period?: { startDate: Date; endDate: Date },
    page = 1,
    pageSize = 10,
  ) {
    const offset = (page - 1) * pageSize;
    const conditions: any[] = [eq(schema.Booking.assetId, assetId)];

    if (period) {
      conditions.push(
        or(
          gte(schema.Booking.startDate, period.startDate),
          lte(schema.Booking.endDate, period.endDate),
        ),
      );
    }

    const where = and(...conditions);

    const [countResult, bookings] = await Promise.all([
      this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.Booking)
        .where(where)
        .execute(),
      this.db.query.Booking.findMany({
        where: (b, { eq: eqFn, and: andFn, gte: gteFn, lte: lteFn, or: orFn }) =>
          period
            ? andFn(
              eqFn(b.assetId, assetId),
              orFn(gteFn(b.startDate, period.startDate), lteFn(b.endDate, period.endDate)),
            )
            : eqFn(b.assetId, assetId),
        limit: pageSize,
        offset,
      }),
    ]);

    return {
      data: bookings,
      pagination: buildPagination(page, pageSize, countResult[0]?.count ?? 0),
    };
  }

  async findOwnerBookings(ownerAssets: string[], assetId?: string, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    const filters: any[] = [inArray(schema.Booking.assetId, ownerAssets), isNull(schema.Booking.deletedAt)];

    if (assetId) filters.push(eq(schema.Booking.assetId, assetId));
    const where = and(...filters);

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.Booking)
        .where(where)
        .execute(),
      this.db
        .select()
        .from(schema.Booking)
        .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
        .innerJoin(schema.AssetType, eq(schema.Asset.assetTypeId, schema.AssetType.id))
        .leftJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
        .where(where)
        .limit(pageSize)
        .offset(offset)
        .execute(),
    ]);

    return {
      data: rows.map((row) => ({
        ...row.booking,
        asset: row.assets,
        customer: row.customer_details,
        assetType: row.asset_type,
      })),
      pagination: buildPagination(page, pageSize, countResult[0]?.count ?? 0),
    };
  }

  async findBookingById(bookingId: string) {
    const row = await this.db
      .select()
      .from(schema.Booking)
      .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
      .innerJoin(schema.AssetType, eq(schema.AssetType.id, schema.Asset.assetTypeId))
      .leftJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
      .where(and(eq(schema.Booking.id, bookingId), isNull(schema.Booking.deletedAt)))
      .execute()
      .then((rows) => rows[0]);

    return row ?? null;
  }

  async findBookingFormResponses(bookingId: string) {
    return this.db
      .select({
        id: schema.BookingFormFieldValue.id,
        formFieldId: schema.BookingFormFieldValue.formFieldId,
        value: schema.BookingFormFieldValue.value,
        fieldName: schema.BookingFormField.name,
        fieldType: schema.BookingFormField.type,
      })
      .from(schema.BookingFormFieldValue)
      .innerJoin(schema.BookingFormField, eq(schema.BookingFormFieldValue.formFieldId, schema.BookingFormField.id))
      .where(eq(schema.BookingFormFieldValue.bookingId, bookingId))
      .execute()

  }

  async findBookingAddons(bookingId: string) {
    return this.db
      .select({
        id: schema.BookingAddon.id,
        addonItemId: schema.BookingAddon.addonItemId,
        name: schema.AddonItem.name,
        quantity: schema.BookingAddon.quantity,
        unitPrice: schema.BookingAddon.unitPrice,
        billingType: schema.BookingAddon.billingType,
        totalPrice: schema.BookingAddon.totalPrice,
      })
      .from(schema.BookingAddon)
      .innerJoin(schema.AddonItem, eq(schema.BookingAddon.addonItemId, schema.AddonItem.id))
      .where(eq(schema.BookingAddon.bookingId, bookingId))
      .execute();
  }

  async findBookingTaxFees(bookingId: string) {
    return this.db
      .select({
        id: schema.BookingTaxFee.id,
        taxFeeId: schema.BookingTaxFee.taxFeeId,
        name: schema.BookingTaxFee.name,
        type: schema.BookingTaxFee.type,
        calculationType: schema.BookingTaxFee.calculationType,
        rate: schema.BookingTaxFee.rate,
        calculationBasis: schema.BookingTaxFee.calculationBasis,
        calculatedAmount: schema.BookingTaxFee.calculatedAmount,
      })
      .from(schema.BookingTaxFee)
      .where(eq(schema.BookingTaxFee.bookingId, bookingId))
      .execute();
  }

  async findOwnerBookingById(ownerAssets: string[], bookingId: string) {
    return this.db.query.Booking.findFirst({
      where: (b, { eq: eqFn, and: andFn, isNull: isNullFn }) =>
        andFn(eqFn(b.id, bookingId), isNullFn(b.deletedAt)),
      with: { asset: true, customer: true },
    });
  }

  async findBookingWithRelationsForEmail(bookingId: string) {
    return this.db
      .select({ booking: schema.Booking, asset: schema.Asset, customer: schema.Customer })
      .from(schema.Booking)
      .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
      .innerJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
      .where(eq(schema.Booking.id, bookingId))
      .execute()
      .then((rows) => rows[0] ?? null);
  }

  async findBookingWithTokenForEmail(bookingId: string) {
    return this.db
      .select()
      .from(schema.Booking)
      .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
      .innerJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
      .innerJoin(schema.BookingUpdateToken, eq(schema.Booking.id, schema.BookingUpdateToken.bookingId))
      .where(eq(schema.Booking.id, bookingId))
      .execute()
      .then((rows) => rows[0] ?? null);
  }

  async findUpcomingConfirmedBookings(windowStart: Date, windowEnd: Date) {
    return this.db
      .select({ booking: schema.Booking, asset: schema.Asset, customer: schema.Customer })
      .from(schema.Booking)
      .innerJoin(schema.Asset, eq(schema.Booking.assetId, schema.Asset.id))
      .innerJoin(schema.Customer, eq(schema.Booking.customerId, schema.Customer.id))
      .where(
        and(
          gte(schema.Booking.startDate, windowStart),
          lte(schema.Booking.startDate, windowEnd),
          eq(schema.Booking.status, 'Confirmed'),
        ),
      )
      .execute();
  }

  // ==============================
  // Booking mutations
  // ==============================

  async insertBooking(values: typeof schema.Booking.$inferInsert, tx: Tx): Promise<string> {
    const [{ id }] = await tx.insert(schema.Booking).values(values).$returningId();
    return id;
  }

  async updateBookingDatesAndPrice(
    id: string,
    values: { startDate: Date; endDate: Date; totalPrice: string; assetId: string },
    tx: Tx,
  ) {
    await tx.update(schema.Booking).set(values).where(eq(schema.Booking.id, id)).execute();
  }

  async updateBookingStatus(id: string, status: 'Pending' | 'Confirmed' | 'Cancelled') {
    await this.db.update(schema.Booking).set({ status }).where(eq(schema.Booking.id, id)).execute();
  }

  async softDeleteBooking(id: string) {
    await this.db.update(schema.Booking).set({ deletedAt: new Date() }).where(eq(schema.Booking.id, id)).execute();
  }

  // ==============================
  // Customer
  // ==============================

  async findCustomerById(id: number, tx: Tx) {
    return tx.query.Customer.findFirst({ where: (c: any, { eq: eqFn }: any) => eqFn(c.id, id) });
  }

  async findCustomerByEmail(email: string, tenantId: string, tx: Tx) {
    return tx.query.Customer.findFirst({
      where: (c: any, { eq: eqFn, and: andFn }: any) => andFn(eqFn(c.email, email), eqFn(c.tenantId, tenantId)),
    });
  }

  async insertCustomer(values: typeof schema.Customer.$inferInsert, tx: Tx): Promise<number> {
    const [{ id }] = await tx.insert(schema.Customer).values(values).$returningId();
    return id;
  }

  // ==============================
  // Asset
  // ==============================

  async findAssetById(assetId: string, tx: Tx) {
    return tx.query.Asset.findFirst({ where: (a: any, { eq: eqFn }: any) => eqFn(a.id, assetId) });
  }

  async findTenantById(tenantId: string, tx: Tx) {
    return tx.query.Tenant.findFirst({ where: (t: any, { eq: eqFn }: any) => eqFn(t.id, tenantId) });
  }

  async findAvailableAssetOfType(
    assetTypeId: number,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<{ id: string; name: string } | null> {
    const assets = await this.db
      .select({ id: schema.Asset.id, name: schema.Asset.name })
      .from(schema.Asset)
      .where(
        and(
          eq(schema.Asset.assetTypeId, assetTypeId),
          eq(schema.Asset.tenantId, tenantId),
          eq(schema.Asset.available, true),
          isNull(schema.Asset.deletedAt),
        ),
      );

    if (assets.length === 0) {
      throw new NotFoundException(`No assets found for asset type ${assetTypeId}`);
    }

    for (const asset of assets) {
      const blocked = await this.db.query.BlockedDate.findMany({
        where: (bd, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn, or: orFn }) =>
          andFn(
            eqFn(bd.assetId, asset.id),
            orFn(
              andFn(gteFn(bd.startDate, startDate), lteFn(bd.startDate, endDate)),
              andFn(gteFn(bd.endDate, startDate), lteFn(bd.endDate, endDate)),
              andFn(lteFn(bd.startDate, startDate), gteFn(bd.endDate, endDate)),
            ),
          ),
      });

      if (blocked.length === 0) return asset;
    }

    return null;
  }

  async findAnyAssetOfType(assetTypeId: number, tenantId: string) {
    return this.db.query.Asset.findFirst({
      where: (a, { eq: eqFn, and: andFn, isNull: isNullFn }) =>
        andFn(eqFn(a.assetTypeId, assetTypeId), eqFn(a.tenantId, tenantId), isNullFn(a.deletedAt)),
    });
  }

  // ==============================
  // Blocked dates
  // ==============================

  async findBlockedDates(assetId: string, startDate: Date, endDate: Date) {
    return this.db.query.BlockedDate.findMany({
      where: (bd, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn, or: orFn }) =>
        andFn(
          eqFn(bd.assetId, assetId),
          orFn(
            andFn(gteFn(bd.startDate, startDate), lteFn(bd.startDate, endDate)),
            andFn(gteFn(bd.endDate, startDate), lteFn(bd.endDate, endDate)),
            andFn(lteFn(bd.startDate, startDate), gteFn(bd.endDate, endDate)),
          ),
        ),
    });
  }

  async findBlockedDatesExcludingBooking(assetId: string, startDate: Date, endDate: Date, bookingId: string) {
    return this.db.query.BlockedDate.findMany({
      where: (bd, { and: andFn, eq: eqFn, gte: gteFn, lte: lteFn, or: orFn, ne: neFn, isNull: isNullFn }) =>
        andFn(
          eqFn(bd.assetId, assetId),
          orFn(
            andFn(gteFn(bd.startDate, startDate), lteFn(bd.startDate, endDate)),
            andFn(gteFn(bd.endDate, startDate), lteFn(bd.endDate, endDate)),
            andFn(lteFn(bd.startDate, startDate), gteFn(bd.endDate, endDate)),
          ),
          orFn(isNullFn(bd.bookingId), neFn(bd.bookingId, bookingId)),
        ),
    });
  }

  async insertBlockedDate(values: typeof schema.BlockedDate.$inferInsert, tx: Tx) {
    await tx.insert(schema.BlockedDate).values(values);
  }

  async deleteBlockedDatesByBookingId(bookingId: string, tx?: Tx) {
    const db = tx ?? this.db;
    await db.delete(schema.BlockedDate).where(eq(schema.BlockedDate.bookingId, bookingId)).execute();
  }

  async insertBlockedDateDirect(values: typeof schema.BlockedDate.$inferInsert) {
    await this.db.insert(schema.BlockedDate).values(values).execute();
  }

  // ==============================
  // Booking addons
  // ==============================

  async insertBookingAddons(values: typeof schema.BookingAddon.$inferInsert[], tx: Tx) {
    if (values.length > 0) {
      await tx.insert(schema.BookingAddon).values(values);
    }
  }

  // ==============================
  // Booking tax fees
  // ==============================

  async insertBookingTaxFees(values: typeof schema.BookingTaxFee.$inferInsert[], tx: Tx) {
    if (values.length > 0) {
      await tx.insert(schema.BookingTaxFee).values(values);
    }
  }

  // ==============================
  // Update token
  // ==============================

  async insertBookingUpdateToken(
    values: typeof schema.BookingUpdateToken.$inferInsert,
    tx: Tx,
  ) {
    await tx.insert(schema.BookingUpdateToken).values(values);
  }

  async updateBookingUpdateTokenExpiry(bookingId: string, expiresAt: Date, tx: Tx) {
    await tx
      .update(schema.BookingUpdateToken)
      .set({ expiresAt })
      .where(eq(schema.BookingUpdateToken.bookingId, bookingId))
      .execute();
  }

  async findUpdateToken(token: string, bookingId: string) {
    return this.db.query.BookingUpdateToken.findFirst({
      where: (but, { eq: eqFn, and: andFn }) => andFn(eqFn(but.token, token), eqFn(but.bookingId, bookingId)),
    });
  }

  // ==============================
  // Form responses
  // ==============================

  async insertFormResponses(values: typeof schema.BookingFormFieldValue.$inferInsert[], tx: Tx) {
    if (values.length > 0) {
      await tx.insert(schema.BookingFormFieldValue).values(values);
    }
  }

  // ==============================
  // Invoice
  // ==============================

  async insertInvoice(values: typeof schema.Invoice.$inferInsert, tx: Tx): Promise<number> {
    const [{ id }] = await tx.insert(schema.Invoice).values(values).$returningId();
    return id;
  }

  async insertInvoiceItem(values: typeof schema.InvoiceItem.$inferInsert, tx: Tx) {
    await tx.insert(schema.InvoiceItem).values(values);
  }

  // ==============================
  // Tenant admins (for emails)
  // ==============================

  async findTenantAdmins(tenantId: string) {
    return this.db
      .select({ email: schema.User.email, name: schema.User.name })
      .from(schema.TenantHasUsers)
      .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id))
      .where(and(eq(schema.TenantHasUsers.tenantId, tenantId), eq(schema.TenantHasUsers.isAdmin, true)))
      .execute();
  }
}
