import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { ResponseEnvelopeInterceptor } from './common/response-envelope.interceptor';

interface ValidationDetail {
  field: string;
  issue: string;
}

const flattenValidationErrors = (
  errors: ValidationError[],
  parent = '',
): ValidationDetail[] =>
  errors.flatMap((error) => {
    const field = parent ? parent + '.' + error.property : error.property;
    const own = Object.values(error.constraints ?? {}).map((issue) => ({
      field,
      issue,
    }));
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const origins = config
    .get<string>('CORS_ORIGINS', 'http://localhost:8080')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Accept',
      'Idempotency-Key',
      'X-Guest-Order-Token',
      'X-Request-Id',
    ],
    exposedHeaders: ['X-Request-Id', 'Location', 'Retry-After'],
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: flattenValidationErrors(errors),
        }),
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log('Bootyard API listening on port ' + port);
}

bootstrap().catch((error: unknown) => {
  console.error('Backend bootstrap failed', error);
  process.exitCode = 1;
});
