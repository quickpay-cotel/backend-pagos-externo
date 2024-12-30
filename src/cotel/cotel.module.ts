
import { Module } from "@nestjs/common";
import { CotelController } from "./cotel.controller";
import { CotelService } from "./cotel.service";
import { DatabaseModule } from "../config/database.module"; // Importamos DatabaseModule
import { CorreoModule } from "src/correo/correo.module";
import { RepositoryModule } from "src/common/repository/repository.module";
import { ExternalServiceModule } from "src/common/external-services/external-service.module";
import { NotificationsGateway } from "src/notificaciones/notifications.gateway";
@Module({
  imports: [CorreoModule, DatabaseModule, NotificationsGateway, RepositoryModule, ExternalServiceModule],
  controllers: [CotelController],
  providers: [
    CotelService]
})
export class CotelModule { }