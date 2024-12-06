import { Module } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { ApiSipService } from './api.sip.service';
import { PagosController } from './pagos.controller';
import { ArchivosRepository } from 'src/common/repository/archivos.repository';
import { DeudasClientesRepository } from 'src/common/repository/deudas_clientes.repository';
import { QrGerenadoRepository } from 'src/common/repository/qr_generado.repository';
import { DatosConfirmadoQrRepository } from 'src/common/repository/datosconfirmado_qr.repository';
import { EntidadesRepository } from 'src/common/repository/entidades.repository';
import { TransaccionesCobrosRepository } from 'src/common/repository/transacciones_cobros.repository';
import { DatabaseModule } from '../config/database.module'; // Importamos DatabaseModule
import { NotificationsGateway } from './../notificaciones/notifications.gateway';
import { CorreoModule } from '../correo/correo.module';  // Importa MailModule

@Module({
  imports:[CorreoModule,DatabaseModule,NotificationsGateway],
  controllers: [PagosController],
  providers: [
    PagosService,
    ApiSipService,
    ArchivosRepository,
    DeudasClientesRepository,
    QrGerenadoRepository,
    DatosConfirmadoQrRepository,
    EntidadesRepository,
    NotificationsGateway,
    TransaccionesCobrosRepository]
})
export class PagosModule {}