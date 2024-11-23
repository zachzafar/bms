import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { generateOpenApi } from '@ts-rest/open-api';
import { contract } from '@repo/api-contract';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //
  const document = generateOpenApi(contract, {
    info: {
      title: 'Posts API',
      version: '1.0.0',
    },
  });

  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
