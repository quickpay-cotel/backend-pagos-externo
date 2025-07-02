import * as dotenv from "dotenv";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "./common/filters/all-exceptions.filter";
import * as fs from "fs";

dotenv.config(); // Carga las variables de entorno
async function bootstrap() {
  let app;

  if (process.env.NODE_ENV === 'production') {
    // Configuración con SSL en servidor
    const httpsOptions = {
      key: fs.readFileSync('/etc/ssl/quickpay.com.bo/private.key'),
      cert: fs.readFileSync('/etc/ssl/quickpay.com.bo/certificate.crt'),
      ca: fs.readFileSync('/etc/ssl/quickpay.com.bo/ca_bundle.crt'), // Si tienes un certificado intermedio
    };
    app = await NestFactory.create(AppModule, { httpsOptions });
  } else {
    // Configuración sin SSL en local
    app = await NestFactory.create(AppModule);
  }

  app.useGlobalInterceptors(new ResponseInterceptor());

  // Habilitar CORS si es necesario
  app.enableCors({
    origin: '*', // Asegúrate de permitir los orígenes correctos según tus necesidades
  });

  // Habilitar validación global para los DTOs
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Registrar el filtro globalmente
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT);

  console.log(`🚀 Aplicación corriendo en: http://localhost:${process.env.PORT}`);
}
bootstrap();
