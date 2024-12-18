import { drizzle } from 'drizzle-orm/mysql2';
import  mysql from 'mysql2/promise';
import { ConfigService } from '@nestjs/config';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '@repo/api-contract';
export const DrizzleAsyncProvider = 'DrizzleAsyncProvider';
import { Provider } from '@nestjs/common';

export const init = async (connectionString: string) => {
  const connection = await mysql.createConnection(connectionString);

    return drizzle(connection, { schema, mode: 'default' }) as MySql2Database<typeof schema>;
}

export const drizzleProvider: Provider[] = [
  {
    provide: DrizzleAsyncProvider,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      console.log(configService.get<string>('DATABASE_HOST'));
      
      const connectionOptions: mysql.ConnectionOptions = {
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        user: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
      };
      const connection = await mysql.createConnection(connectionOptions);

      return drizzle(connection, { schema, mode: 'default' }) as MySql2Database<typeof schema>;
    },
  },
];