import { Injectable, Inject, InternalServerErrorException, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '@repo/api-contract';
import { InsertUser, SelectUser, UpdateUser } from '@repo/api-contract';
import { eq, and, sql } from 'drizzle-orm';
import { hash } from 'argon2';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>) { }

    async createUser(userData: InsertUser, tenantId: string, roles: number[]): Promise<string> {
        let tenantUser_id: number;
        let userId: string;

        await this.db.transaction(async (tx) => {
            const existingUser = await tx.query.User.findFirst({
                where: (user, { eq }) => eq(user.email, userData.email)
            });

            if (existingUser) {
                const existingTenantUser = await tx.query.TenantHasUsers.findFirst({
                    where: (tu, { and, eq }) => and(
                        eq(tu.userId, existingUser.id),
                        eq(tu.tenantId, tenantId)
                    )
                });

                if (existingTenantUser) {
                    tenantUser_id = existingTenantUser.id;
                    userId = existingUser.id;
                } else {
                    const [{ id }] = await tx.insert(schema.TenantHasUsers).values({
                        tenantId,
                        userId: existingUser.id
                    }).$returningId();

                    tenantUser_id = id;
                    userId = existingUser.id;
                }
            } else {
                const hashedPassword = await hash(userData.password);
                await tx.insert(schema.User).values({
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    userType: userData.userType
                });

                const user = await tx.query.User.findFirst({
                    where: (user, { eq }) => eq(user.email, userData.email)
                });

                if (!user) throw new InternalServerErrorException("Error occurred while creating user");

                const [{ id }] = await tx.insert(schema.TenantHasUsers).values({
                    tenantId,
                    userId: user.id
                }).$returningId();

                tenantUser_id = id;
                userId = user.id;
            }

            // Handle roles
            for (const role of roles) {
                const existingRole = await tx.query.UserHasRoles.findFirst({
                    where: (ur, { and, eq }) => and(
                        eq(ur.userId, userId),
                        eq(ur.roleId, role),
                        eq(ur.tenantId, tenantId)
                    )
                });

                if (!existingRole) {
                    await tx.insert(schema.UserHasRoles).values({
                        userId,
                        roleId: role,
                        tenantId
                    });
                }
            }
        });

        const tenantUser = await this.db.query.TenantHasUsers.findFirst({
            where: (tenant_user, { eq }) => eq(tenant_user.id, tenantUser_id)
        });

        if (!tenantUser) throw new InternalServerErrorException("Error occurred while adding a tenant user");

        return tenantUser.userId;
    }

    async findAll(tenantId: string, page: number = 1, pageSize: number = 10): Promise<{ data: (Omit<SelectUser, 'roles'> & { roles: { roleId: number; roleName: string }[] })[]; pagination: any }> {
        const offset = (page - 1) * pageSize;

        const totalCountResult = await this.db
            .select({ count: sql<number>`COUNT(DISTINCT ${schema.User.id})` })
            .from(schema.TenantHasUsers)
            .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id))
            .where(and(
                eq(schema.TenantHasUsers.tenantId, tenantId),
                eq(schema.User.userType, 'system')
            ))
            .execute();
        const totalCount = totalCountResult[0]?.count || 0;

        const usersWithRoles = await this.db
            .select({
                user: schema.User,
                userRole: schema.UserHasRoles,
                role: schema.Roles
            })
            .from(schema.TenantHasUsers)
            .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id))
            .leftJoin(schema.UserHasRoles, eq(schema.UserHasRoles.userId, schema.User.id))
            .leftJoin(schema.Roles, eq(schema.UserHasRoles.roleId, schema.Roles.id))
            .where(and(
                eq(schema.TenantHasUsers.tenantId, tenantId),
                eq(schema.User.userType, 'system')
            ))
            .limit(pageSize)
            .offset(offset);

        const userMap = new Map<string, Omit<SelectUser, 'roles'> & { roles: { roleId: number; roleName: string }[] }>();

        usersWithRoles.forEach(row => {
            if (!userMap.has(row.user.id)) {
                userMap.set(row.user.id, {
                    ...row.user,
                    roles: row.userRole?.roleId && row.role?.name
                        ? [{ roleId: row.userRole.roleId, roleName: row.role.name }]
                        : []
                });
            } else if (row.userRole?.roleId && row.role?.name) {
                const user = userMap.get(row.user.id)!;
                if (!user.roles.some(r => r.roleId === row.userRole!.roleId)) {
                    user.roles.push({ roleId: row.userRole.roleId, roleName: row.role.name });
                }
            }
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
            data: Array.from(userMap.values()),
            pagination: paginationData,
        };
    }

    async findOne(id: string, tenantId?: string): Promise<Omit<SelectUser, 'roles'> & { roles: { roleId: number; roleName: string }[] } | Omit<SelectUser, "roles"> | undefined> {
        if (!tenantId)
            return this.db.query.User.findFirst({ where: (user, { eq }) => eq(user.id, id) });

        const userWithRoles = await this.db.select({
            user: schema.User,
            userRoles: schema.UserHasRoles,
            role: schema.Roles
        })
            .from(schema.TenantHasUsers)
            .where(and(
                eq(schema.TenantHasUsers.tenantId, tenantId),
                eq(schema.TenantHasUsers.userId, id)
            ))
            .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id))
            .leftJoin(schema.UserHasRoles, eq(schema.UserHasRoles.userId, schema.User.id))
            .leftJoin(schema.Roles, eq(schema.UserHasRoles.roleId, schema.Roles.id));

        if (userWithRoles.length === 0) return undefined;

        const roles: { roleId: number; roleName: string }[] = [];
        userWithRoles.forEach(row => {
            if (row.userRoles?.roleId && row.role?.name && !roles.some(r => r.roleId === row.userRoles!.roleId)) {
                roles.push({ roleId: row.userRoles.roleId, roleName: row.role.name });
            }
        });

        return {
            ...userWithRoles[0].user,
            roles
        };
    }

    async findByEmail(email: string): Promise<Omit<SelectUser, "roles"> | undefined> {
        return this.db.query.User.findFirst({ where: (user, { eq }) => eq(user.email, email) });
    }

    async update(id: string, tenantId: string, userData: UpdateUser, roles: number[]): Promise<void> {
        await this.db.transaction(async (tx) => {
            let hashedPassword: string | undefined;
            if (userData.password) {
                hashedPassword = await hash(userData.password);
                userData.password = hashedPassword;
            }

            if (Object.keys(userData).length > 0)
                await tx.update(schema.User).set({ ...userData, password: hashedPassword }).where(eq(schema.User.id, id));

            // Handle roles
            const existingRoles = await tx.query.UserHasRoles.findMany({
                where: (userRole, { eq }) => eq(userRole.userId, id)
            });

            const existingRoleIds = existingRoles.map(role => role.roleId);

            for (const roleId of roles) {
                if (!existingRoleIds.includes(roleId)) {
                    await tx.insert(schema.UserHasRoles).values({
                        userId: id,
                        roleId,
                        tenantId
                    });
                }
            }

            const rolesToRemove = existingRoleIds.filter(existingId => !roles.includes(existingId));
            for (const roleId of rolesToRemove) {
                await tx.delete(schema.UserHasRoles)
                    .where(and(
                        eq(schema.UserHasRoles.userId, id),
                        eq(schema.UserHasRoles.roleId, roleId)
                    ));
            }
        });
    }

    async remove(id: string, tenantId: string): Promise<void> {
        await this.db.transaction(async (tx) => {
            const admins = await tx.select()
                .from(schema.TenantHasUsers)
                .where(and(eq(schema.TenantHasUsers.tenantId, tenantId), eq(schema.TenantHasUsers.isAdmin, true)))
                .innerJoin(schema.User, eq(schema.TenantHasUsers.userId, schema.User.id));

            const isUserAdmin = admins.some(admin => admin.users.id === id);
            if (isUserAdmin && admins.length <= 1) {
                throw new InternalServerErrorException("Cannot remove the last admin from a tenant");
            }

            await tx.delete(schema.TenantHasUsers)
                .where(and(
                    eq(schema.TenantHasUsers.userId, id),
                    eq(schema.TenantHasUsers.tenantId, tenantId)
                ));

            const otherTenants = await tx.query.TenantHasUsers.findMany({
                where: (tenantUser, { eq }) => eq(tenantUser.userId, id)
            });

            if (otherTenants.length === 0) {
                await tx.delete(schema.User).where(eq(schema.User.id, id));
            }
        });
    }

    async isAdminUser(userId: string): Promise<boolean> {
        const user = await this.db.query.User.findFirst({
            where: (user, { eq, and }) => and(eq(user.id, userId), eq(user.userType, 'admin')),
        })
        return user !== null;
    }
}
