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
    //const request = context.switchToHttp().getRequest();
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

    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {

        // Cambiar el código de estado a 200
        response.status(200);

        // Modificar la respuesta dependiendo del endpoint
        const request = context.switchToHttp().getRequest();
        const endpoint = request.route.path; // Obtienes el endpoint solicitado

        if (endpoint === "/pagos/confirma-pago-qr") { // para SIP
          return {
            codigo: "0000",
            mensaje: "Registro Exitoso",
          };
        }
        else {
          return {
            success: true,
            message: data.message,
            result: data.result,
            timestamp: new Date().toISOString(),
          };
        }
      }),
    );
  }
}
