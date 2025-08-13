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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // app.enableCors({
  //   origin: process.env.CORS_ORIGIN,
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  // });

  //
  const document = generateOpenApi(contract, {
    info: {
      title: 'Posts API',
      version: '1.0.0',
    },
  });

  SwaggerModule.setup('api-docs', app, document);

  const logger = new Logger('Bootstrap');

  const reflector = app.get(Reflector);
  const tenantService = app.get(TenantService)
  const keysService = app.get(KeysService)
  
  app.useGlobalGuards(new UniversalGuard(reflector),new TenantGuard(reflector,tenantService,keysService));

  await app.listen(process.env.PORT ?? 4000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
