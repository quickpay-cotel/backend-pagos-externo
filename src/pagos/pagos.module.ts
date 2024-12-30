import { Module } from "@nestjs/common";
import { PagosService } from "./pagos.service";
import { PagosController } from "./pagos.controller";
import { RepositoryModule } from "src/common/repository/repository.module";
import { DatabaseModule } from "../config/database.module"; // Importamos DatabaseModule
import { NotificationsGateway } from "./../notificaciones/notifications.gateway";
import { CorreoModule } from "../correo/correo.module"; // Importa MailModule
import { ExternalServiceModule } from "src/common/external-services/external-service.module";
@Module({
  imports: [CorreoModule, DatabaseModule, NotificationsGateway,RepositoryModule,ExternalServiceModule],
  controllers: [PagosController],
  providers: [
    PagosService,
    NotificationsGateway,
  ],
})
export class PagosModule {}
