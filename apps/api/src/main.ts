import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { generateOpenApi } from '@ts-rest/open-api';
import { contract } from '@repo/api-contract';
import { Reflector } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { TenantGuard } from './auth/guards/tenant/tenant.guard';
import { TenantService } from './tenant/tenant.service';
import { UniversalGuard } from './auth/guards/universal-guard/universal-guard.guard';
import { KeysService } from './keys/keys.service';
import { UsersService } from './users/users.service';
import { PermissionsGuard } from './auth/guards/permissions/permissions.guard';
import { AdminGuard } from './auth/guards/admin/admin.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get CORS origins from environment or use defaults
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : [
        'http://localhost:3000', // Web app
        'http://localhost:3001', // CRM app
        'http://localhost:3002', // Auth app
        'http://localhost:3003', // System Admin app
        'http://localhost:4000', // API itself
        'http://localhost:3004',
        'https://bookos.xyz',
        'https://crm.bookos.xyz',
        'https://auth.bookos.xyz',
        'https://admin.bookos.xyz',
        'https://booking.bookos.xyz',
        'https://www.bookos.xyz',
        'https://www.crm.bookos.xyz',
        'https://www.auth.bookos.xyz',
        'https://www.admin.bookos.xyz',
        'https://www.booking.bookos.xyz'
      ];

  // Enable CORS for development
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-tenant-id',
      'x-api-key',
    ],
  });

  //
  const document = generateOpenApi(contract, {
    info: {
      title: 'BookOS API',
      version: '1.0.0',
    },
  });

  SwaggerModule.setup('api-docs', app, document);

  const logger = new Logger('Bootstrap');

  const reflector = app.get(Reflector);
  const tenantService = app.get(TenantService)
  const keysService = app.get(KeysService)
  const usersService = app.get(UsersService)
  
  app.useGlobalGuards(new UniversalGuard(reflector),new TenantGuard(reflector,tenantService,keysService,usersService));

  await app.listen(process.env.PORT ?? 4000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
