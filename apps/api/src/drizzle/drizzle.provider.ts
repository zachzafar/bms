import { drizzle } from 'drizzle-orm/mysql2';
import  mysql from 'mysql2/promise';
import { ConfigService } from '@nestjs/config';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
export const DrizzleAsyncProvider = 'DrizzleAsyncProvider';
import { Provider } from '@nestjs/common';

export const init = async (connectionString: string) => {
  const connection =  mysql.createPool(connectionString);

    return drizzle(connection, { schema, mode: 'default' }) as MySql2Database<typeof schema>;
}

export const drizzleProvider: Provider[] = [
  {
    provide: DrizzleAsyncProvider,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      
      const connectionOptions: mysql.PoolOptions = {
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        user: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        waitForConnections: true,
        connectionLimit: 10, // Adjust this based on traffic
        queueLimit: 0,
        enableKeepAlive: true, // Ensures the connection doesn't close unexpectedly
        keepAliveInitialDelay: 10000, 
      };
      const connection =  mysql.createPool(connectionOptions);

      setInterval(() => {
        connection.query('SELECT 1');
      },60000)

      return drizzle(connection, { schema, mode: 'default' }) as MySql2Database<typeof schema>;
    },
  },
];