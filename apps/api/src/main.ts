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
import { json, urlencoded } from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  app.use(json({limit: '50mb'}))
  app.use(urlencoded({ limit: '50mb', extended: true }));
  
  // Get CORS origins from environment or use defaults
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : [
        'http://localhost:3000', // Web app
        'https://app.bookos.xyz',
        'https://www.app.bookos.xyz',
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