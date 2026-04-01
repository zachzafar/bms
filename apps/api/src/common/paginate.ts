import { sql, desc, SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';

export function buildPagination(page: number, pageSize: number, totalCount: number) {
  return {
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    hasNextPage: page * pageSize < totalCount,
    hasPreviousPage: page > 1,
  };
}

export function emptyPaginatedResult(page: number, pageSize: number) {
  return { data: [], pagination: buildPagination(page, pageSize, 0) };
}

export async function paginate<T>(
  db: MySql2Database<typeof schema>,
  table: any,
  where: SQL,
  page: number,
  pageSize: number,
): Promise<{ data: T[]; pagination: ReturnType<typeof buildPagination> }> {
  const offset = (page - 1) * pageSize;
  const [countResult, data] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(table).where(where).execute(),
    db.select().from(table).where(where).limit(pageSize).offset(offset).orderBy(desc(table.createdAt)),
  ]);
  return {
    data: data as T[],
    pagination: buildPagination(page, pageSize, countResult[0]?.count ?? 0),
  };
}
