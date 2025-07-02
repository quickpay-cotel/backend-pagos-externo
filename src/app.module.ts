import { Module } from "@nestjs/common";
import { CotelModule } from "./cotel/cotel.module";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { DatabaseModule } from "./config/database.module"; // Importamos el DatabaseModule
import { ReportesModule } from "./reports/reportes.module";

import { NotificationsGateway } from "./notificaciones/notifications.gateway";

@Module({
  imports: [ DatabaseModule, CotelModule,ReportesModule], // Asegúrate de importar ambos módulos
  providers: [
    NotificationsGateway,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
