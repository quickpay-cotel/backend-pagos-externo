
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException? exception.getStatus(): HttpStatus.INTERNAL_SERVER_ERROR;
    const message =exception instanceof HttpException? exception.getResponse(): 'An internal server error occurred';
    const endpoint = request.route?.path; // Obtener el endpoint solicitado

    let responseBody;

    // Modificar la respuesta en función del endpoint
    if (endpoint === '/pagos/confirma-pago') {
      responseBody = {
        codigo: "9999",
        mensaje: "Algo salio mal , comuniquese con sistemas de QUICKPAY"
      };
    } else {
      responseBody = {
        success: false,
        message: typeof message === 'object' ? message['message'] || message : message,
        timestamp: new Date().toISOString(),
      };
    }

    response.status(status).json(responseBody);
  }
}
