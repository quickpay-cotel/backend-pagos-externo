
import { Module } from "@nestjs/common";
import { CotelController } from "./cotel.controller";
import { PagosController } from "./pagos.controller";
import { CotelService } from "./cotel.service";
import { PagosService } from "./pagos.service";
import { DatabaseModule } from "../config/database.module"; // Importamos DatabaseModule
import { CorreoModule } from "src/correo/correo.module";
import { RepositoryModule } from "src/common/repository/repository.module";
import { ExternalServiceModule } from "src/common/external-services/external-service.module";
import { NotificationsGateway } from "src/notificaciones/notifications.gateway";
import { EmailModule } from "src/common/correos/email.module";
@Module({
  imports: [CorreoModule, DatabaseModule, RepositoryModule, ExternalServiceModule, EmailModule],
  controllers: [CotelController,PagosController],
  providers: [
    NotificationsGateway,
    CotelService,PagosService],
    exports:[CotelService,PagosService]
})
export class CotelModule { }