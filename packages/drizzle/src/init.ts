import mysql from 'mysql2/promise';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/mysql2';

export const init = async (connectionString: string) => {
    const connection = await mysql.createConnection(connectionString);

      return drizzle(connection, { schema, mode: 'default' }) as MySql2Database<typeof schema>;
}