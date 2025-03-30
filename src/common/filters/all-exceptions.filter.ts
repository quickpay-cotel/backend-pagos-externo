import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "An internal server error occurred";
    const endpoint = request.route?.path; // Obtener el endpoint solicitado

    let responseBody;

    if (endpoint === "/pagos/confirma-pago-qr") { // para SIP
      // esto es para SIP
      responseBody = {
        codigo: "9999",
        mensaje: message,
      };
    }
    else if (endpoint.startsWith("/cotel-caja/")) { // para cotel
      responseBody= {
        mensaje: "RESPUESTA_ERROR ",
        mensajeDescripcion: message["message"]
      };
    }
    else {
      // esto es para los demas
      responseBody = {
        success: false,
        message: typeof message === "object" ? message["message"] || message : message,
        timestamp: new Date().toISOString(),
      };
    }

    response.status(status).json(responseBody);
  }
}
