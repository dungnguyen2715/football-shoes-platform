import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { ApiErrorBody } from './api-exception';

type RequestWithId = Request & { requestId?: string };

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const requestId = request.requestId ?? 'unknown';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiErrorBody = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      body = this.fromHttpException(status, exception.getResponse());
    } else if (
      exception instanceof MongoServerError &&
      exception.code === 11000
    ) {
      status = HttpStatus.CONFLICT;
      body = {
        code: 'DUPLICATE_RESOURCE',
        message: 'A resource with these values already exists',
      };
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'name' in exception &&
      (exception.name === 'CastError' || exception.name === 'ValidationError')
    ) {
      status = HttpStatus.BAD_REQUEST;
      body = {
        code:
          exception.name === 'CastError' ? 'INVALID_ID' : 'VALIDATION_ERROR',
        message: 'The request contains invalid data',
      };
    } else {
      this.logger.error(
        'Unhandled exception requestId=' + requestId,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({ error: body, meta: { requestId } });
  }

  private fromHttpException(status: number, value: unknown): ApiErrorBody {
    if (
      typeof value === 'object' &&
      value !== null &&
      'code' in value &&
      'message' in value
    ) {
      const body = value as ApiErrorBody;
      return {
        code: body.code,
        message: body.message,
        ...(body.details ? { details: body.details } : {}),
      };
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      Array.isArray(value.message)
    ) {
      const messages = value.message.filter(
        (item): item is string => typeof item === 'string',
      );
      return {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: messages.map((issue) => ({ field: '', issue })),
      };
    }

    const message =
      typeof value === 'string'
        ? value
        : typeof value === 'object' && value !== null && 'message' in value
          ? String(value.message)
          : (HttpStatus[status] ?? 'Request failed');
    const codeByStatus: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHENTICATED',
      403: 'FORBIDDEN',
      404: 'RESOURCE_NOT_FOUND',
      409: 'RESOURCE_CONFLICT',
      422: 'BUSINESS_RULE_VIOLATION',
      429: 'RATE_LIMITED',
      503: 'SERVICE_UNAVAILABLE',
    };
    return { code: codeByStatus[status] ?? 'HTTP_ERROR', message };
  }
}
