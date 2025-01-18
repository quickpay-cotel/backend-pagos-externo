import { Module } from "@nestjs/common";
import { ApiCotelService } from "./api.cotel.service";
import { ApiSipService } from "./api.sip.service";
import { ApiIllaService } from "./api.illa.service";


@Module({
  imports: [], // Importa el ConfigModule para manejar las variables de entorno
  providers: [ApiCotelService, ApiSipService,ApiIllaService],
  exports: [ApiCotelService, ApiSipService,ApiIllaService],
})
export class ExternalServiceModule { }
