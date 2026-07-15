import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({ origin: process.env.WEB_ORIGIN?.split(',') ?? false, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const openApi = new DocumentBuilder()
    .setTitle('M365 Intelligence Platform API')
    .setDescription('Local-first tenant-scoped security, governance, and automation API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, openApi));

  await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
}

void bootstrap();
