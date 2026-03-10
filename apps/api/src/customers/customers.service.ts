import { Injectable, Inject, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { SelectCustomerType } from '@repo/api-contract';
import { eq, and, sql, or, like, isNull } from 'drizzle-orm';

@Injectable()
export class CustomersService {
    private readonly logger = new Logger(CustomersService.name);
    constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) {}

    async createCustomer(
        tenantId: string,
        data: { name: string; email: string; phone?: string | null; address?: string | null; customerTypeId?: number | null }
    ): Promise<number> {
        this.logger.log(`Creating customer "${data.name}" for tenant ${tenantId}`);
        const [{ id }] = await this.db.insert(schema.Customer).values({
            tenantId,
            name: data.name,
            email: data.email,
            phone: data.phone ?? null,
            address: data.address ?? null,
            customerTypeId: data.customerTypeId ?? null,
        }).$returningId();

        return id;
    }

    async getCustomers(
        tenantId: string,
        page: number = 1,
        pageSize: number = 10,
        search?: string
    ): Promise<{ data: schema.SelectCustomer[]; pagination: any }> {
        const offset = (page - 1) * pageSize;

        const baseConditions = [
            eq(schema.Customer.tenantId, tenantId),
            isNull(schema.Customer.deletedAt),
        ];

        const searchCondition = search ? or(
            like(schema.Customer.name, `%${search}%`),
            like(schema.Customer.email, `%${search}%`),
            like(schema.Customer.phone, `%${search}%`),
            like(schema.Customer.address, `%${search}%`)
        ) : undefined;

        const whereConditions = searchCondition
            ? and(...baseConditions, searchCondition)
            : and(...baseConditions);

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.Customer)
            .where(whereConditions)
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const customers = await this.db
            .select()
            .from(schema.Customer)
            .where(whereConditions)
            .limit(pageSize)
            .offset(offset);

        const paginationData = {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            hasNextPage: page * pageSize < totalCount,
            hasPreviousPage: page > 1,
        };

        return {
            data: customers,
            pagination: paginationData,
        };
    }

    async getCustomerById(tenantId: string, id: number): Promise<schema.SelectCustomer | undefined> {
        return this.db.query.Customer.findFirst({
            where: (c, { eq, and, isNull }) => and(
                eq(c.tenantId, tenantId),
                eq(c.id, id),
                isNull(c.deletedAt)
            )
        });
    }

    async updateCustomer(
        tenantId: string,
        id: number,
        data: { name?: string; email?: string; phone?: string | null; address?: string | null; customerTypeId?: number | null }
    ): Promise<void> {
        this.logger.log(`Updating customer ${id} for tenant ${tenantId}`);
        await this.db.update(schema.Customer)
            .set(data)
            .where(and(
                eq(schema.Customer.tenantId, tenantId),
                eq(schema.Customer.id, id)
            ));
    }

    async deleteCustomer(tenantId: string, id: number): Promise<void> {
        this.logger.log(`Deleting customer ${id} for tenant ${tenantId}`);
        await this.db.update(schema.Customer)
            .set({ deletedAt: new Date() })
            .where(and(
                eq(schema.Customer.tenantId, tenantId),
                eq(schema.Customer.id, id)
            ));
    }

    async findOrCreateCustomer(
        tenantId: string,
        data: { name: string; email: string; phone?: string }
    ): Promise<number> {
        this.logger.log(`Finding or creating customer "${data.email}" for tenant ${tenantId}`);
        const existing = await this.db.query.Customer.findFirst({
            where: (c, { eq, and }) => and(
                eq(c.tenantId, tenantId),
                eq(c.email, data.email)
            )
        });

        if (existing) return existing.id;

        return this.createCustomer(tenantId, data);
    }

    // ==================== CUSTOMER TYPES CRUD ====================

    async createCustomerType(
        tenantId: string,
        data: { name: string; description?: string | null }
    ): Promise<number> {
        this.logger.log(`Creating customer type "${data.name}" for tenant ${tenantId}`);
        const existing = await this.db.query.CustomerType.findFirst({
            where: (ct, { eq, and }) => and(
                eq(ct.tenantId, tenantId),
                eq(ct.name, data.name)
            )
        });

        if (existing) {
            if (!existing.deletedAt) {
                throw new BadRequestException('Customer type with this name already exists');
            }
            await this.db.update(schema.CustomerType)
                .set({ deletedAt: null, description: data.description ?? existing.description })
                .where(eq(schema.CustomerType.id, existing.id));
            return existing.id;
        }

        const [{ id }] = await this.db.insert(schema.CustomerType).values({
            tenantId,
            name: data.name,
            description: data.description ?? null
        }).$returningId();

        return id;
    }

    async getCustomerTypes(
        tenantId: string,
        page: number = 1,
        pageSize: number = 10
    ): Promise<{ data: SelectCustomerType[]; pagination: any }> {
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.CustomerType)
            .where(and(
                eq(schema.CustomerType.tenantId, tenantId),
                isNull(schema.CustomerType.deletedAt)
            ))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const customerTypes = await this.db.query.CustomerType.findMany({
            where: (ct, { eq, and, isNull }) => and(
                eq(ct.tenantId, tenantId),
                isNull(ct.deletedAt)
            ),
            limit: pageSize,
            offset: offset,
        });

        const paginationData = {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            hasNextPage: page * pageSize < totalCount,
            hasPreviousPage: page > 1,
        };

        return {
            data: customerTypes,
            pagination: paginationData,
        };
    }

    async getCustomerTypeById(
        tenantId: string,
        customerTypeId: number
    ): Promise<SelectCustomerType | undefined> {
        return this.db.query.CustomerType.findFirst({
            where: (ct, { eq, and, isNull }) => and(
                eq(ct.tenantId, tenantId),
                eq(ct.id, customerTypeId),
                isNull(ct.deletedAt)
            )
        });
    }

    async updateCustomerType(
        tenantId: string,
        customerTypeId: number,
        data: { name?: string; description?: string | null }
    ): Promise<void> {
        if (data.name) {
            const existingType = await this.db.query.CustomerType.findFirst({
                where: (ct, { eq, and, isNull }) => and(
                    eq(ct.tenantId, tenantId),
                    eq(ct.name, data.name!),
                    isNull(ct.deletedAt)
                )
            });

            if (existingType && existingType.id !== customerTypeId) {
                throw new BadRequestException('Customer type with this name already exists');
            }
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;

        if (Object.keys(updateData).length > 0) {
            await this.db.update(schema.CustomerType)
                .set(updateData)
                .where(and(
                    eq(schema.CustomerType.tenantId, tenantId),
                    eq(schema.CustomerType.id, customerTypeId)
                ));
        }
    }

    async deleteCustomerType(tenantId: string, customerTypeId: number): Promise<void> {
        this.logger.log(`Deleting customer type ${customerTypeId} for tenant ${tenantId}`);
        await this.db.update(schema.CustomerType)
            .set({ deletedAt: new Date() })
            .where(and(
                eq(schema.CustomerType.tenantId, tenantId),
                eq(schema.CustomerType.id, customerTypeId)
            ));
    }
}
