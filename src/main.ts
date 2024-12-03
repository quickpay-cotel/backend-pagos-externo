import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/all-exceptions.filter';
dotenv.config(); // Carga las variables de entorno
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ResponseInterceptor()); 
  // Habilitar CORS de manera predeterminada
  app.enableCors(); 

  // Habilitar validación global para los DTOs
  app.useGlobalPipes(new ValidationPipe({ transform: true,}));

  // Registrar el filtro globalmente
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();