import { Module } from '@nestjs/common';

import { EmailService } from './email.service';
import { ApiBrevoService } from '../external-services/api.brevo.service';

@Module({
  providers: [EmailService, ApiBrevoService], // Proveedor del servicio de correo
  exports: [EmailService], // Exporta el servicio para otros módulos
})
export class EmailModule {}
