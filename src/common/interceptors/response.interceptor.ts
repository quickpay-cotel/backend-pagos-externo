import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    /*if (request.url === "/pagos/confirma-pago-qr") {
      return next.handle(); // No pasa por el interceptor
    }*/
    /*return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );*/
    return next.handle().pipe(
      map((data) => {
        // Modificar la respuesta dependiendo del endpoint
        const request = context.switchToHttp().getRequest();
        const endpoint = request.route.path; // Obtienes el endpoint solicitado

        if (endpoint === "/pagos/confirma-pago-qr") {
          return {
            codigo: "0000",
            mensaje: "Registro Exitoso",
          };
        } else {
          // Respuesta por defecto para otros endpoints
          return {
            success: true,
            message: "Exito",
            result: data,
            timestamp: new Date().toISOString(),
          };
        }
      }),
    );
  }
}
