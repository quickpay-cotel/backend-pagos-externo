import * as dotenv from "dotenv";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "./common/filters/all-exceptions.filter";
import * as fs from "fs";
dotenv.config(); // Carga las variables de entorno
async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync(
      "/home/quickpay/public_html/PRD/SSL/quickpay_com_bo.key",
    ),
    cert: fs.readFileSync(
      "/home/quickpay/public_html/PRD/SSL/quickpay_com_bo.crt",
    ),
  };
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  //const app = await NestFactory.create(AppModule);

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

}
bootstrap();
