
import { ConfigService } from '@nestjs/config';
import {init }from '@repo/drizzle';
export const DrizzleAsyncProvider = 'DrizzleAsyncProvider';
import { Provider } from '@nestjs/common';

export const drizzleProvider: Provider[] = [
  {
    provide: DrizzleAsyncProvider,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const connectionString = configService.get<string>('DATABASE_URL') as string 

      return init(connectionString)
    },
  },
];