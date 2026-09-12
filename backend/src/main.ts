import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.get<string[]>('corsOrigins')?.length
      ? config.get<string[]>('corsOrigins')
      : true,
    credentials: true,
  });

  const prefix = config.get<string>('apiPrefix') ?? 'api/v1';
  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('NomadStay Platform API')
    .setDescription('Multi-hotel booking platform backend (Phase 1)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = config.get<number>('port') ?? 4000;
  await app.listen(port);

  console.log(`NomadStay API listening on http://localhost:${port}/${prefix}`);

  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

void bootstrap();
