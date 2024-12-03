import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Pool } from 'pg';  // Asegúrate de que el tipo Pool esté importado


@Injectable()
export class LoggingInterceptor implements NestInterceptor {

  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,  // Inyectamos el pool de conexiones
  ) {}
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, params, query, body, ip } = request;

    return next.handle().pipe(
      tap(async (data) => {
        let responseBody = { respuesta: '[Error serializing response]' }
        try {  responseBody = JSON.parse(JSON.stringify(data)); } catch (error) { }
        const statusCode = response.statusCode;
        await this.pool.query(
          ` INSERT INTO tesla.http_logs (method, endpoint, status_code, client_ip, request_params, request_body, response_body) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [method,url,statusCode,ip,JSON.stringify({ ...params, ...query }),JSON.stringify(body),responseBody,],
        );
      },
        async (error) => {
          let responseBody = { respuesta: '[Error serializing response]' }
          try { responseBody = JSON.parse(JSON.stringify(error)); } catch (error) { }
          const statusCode = error?.status || 500;
          await this.pool.query(
            ` INSERT INTO tesla.http_logs (method, endpoint, status_code, client_ip, request_params, request_body, response_body) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [method, url, statusCode, ip, JSON.stringify({ ...params, ...query }), JSON.stringify(body), responseBody,],
          );
        }
      ),
    );
  }
}