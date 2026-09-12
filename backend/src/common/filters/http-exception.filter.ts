import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res) {
        const body = res as Record<string, unknown>;
        message = String(body.message ?? message);
        code = String(body.error ?? body.code ?? HttpStatus[status] ?? code);
        details = body.details ?? body.message;
      }
      const statusCode = Number(status);
      code =
        statusCode === HttpStatus.UNAUTHORIZED
          ? 'UNAUTHORIZED'
          : statusCode === HttpStatus.FORBIDDEN
            ? 'FORBIDDEN'
            : statusCode === HttpStatus.NOT_FOUND
              ? 'NOT_FOUND'
              : statusCode === HttpStatus.CONFLICT
                ? 'CONFLICT'
                : statusCode === HttpStatus.TOO_MANY_REQUESTS
                  ? 'RATE_LIMITED'
                  : code;
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    const statusCode = Number(status);
    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message: Array.isArray(message) ? message.join(', ') : message,
        details: statusCode >= 500 ? undefined : details,
      },
      requestId: request.requestId,
    });
  }
}
