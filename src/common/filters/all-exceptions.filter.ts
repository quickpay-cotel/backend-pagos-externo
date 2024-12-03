
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'An internal server error occurred';


    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message:
          typeof message === 'object' ? message['message'] || message : message,
        details: exception.stack || null,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
