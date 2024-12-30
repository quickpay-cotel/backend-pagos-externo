import { Module } from "@nestjs/common";
import { ApiCotelService } from "./api.cotel.service";
import { ApiSipService } from "./api.sip.service";


@Module({
  imports: [], // Importa el ConfigModule para manejar las variables de entorno
  providers: [ApiCotelService, ApiSipService],
  exports: [ApiCotelService, ApiSipService],
})
export class ExternalServiceModule { }
