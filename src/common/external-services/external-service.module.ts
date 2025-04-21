import { Module } from "@nestjs/common";
import { ApiCotelService } from "./api.cotel.service";
import { ApiSipService } from "./api.sip.service";
import { ApiIllaService } from "./api.illa.service";
import { ApiBrevoService } from "./api.brevo.service";

@Module({
  providers: [ApiCotelService, ApiSipService, ApiIllaService, ApiBrevoService],
  exports: [ApiCotelService, ApiSipService, ApiIllaService, ApiBrevoService],
})
export class ExternalServiceModule { }
