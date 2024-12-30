import { Module, OnApplicationShutdown } from "@nestjs/common";
import { EntidadesModule } from "./entidades/entidades.module";
import { PagosModule } from "./pagos/pagos.module";
import { CotelModule } from "./cotel/cotel.module";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { DatabaseModule } from "./config/database.module"; // Importamos el DatabaseModule

@Module({
  imports: [EntidadesModule, PagosModule, DatabaseModule, CotelModule], // Asegúrate de importar ambos módulos
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
