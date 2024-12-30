import { Module } from "@nestjs/common";
import { ArchivosRepository } from "./archivos.repository";
import { CobrosClientesRepository } from "./cobros_clientes.repository";
import { CotelContratoRepository } from "./cotel.contrato.repository";
import { CotelDetalleDeudasRepository } from "./cotel.detalle-deudas.repository";
import { CotelDeudasRepository } from "./cotel.deudas.repository";
import { CotelQrGeneradoRepository } from "./cotel.qr_generado.repository";
import { CotelReservaDeudaRepository } from "./cotel.reserva.deuda.repository";
import { DatosConfirmadoQrRepository } from "./datosconfirmado_qr.repository";
import { DeudasClientesRepository } from "./deudas_clientes.repository";
import { HistoricosDeudasRepository } from "./historicos_deudas.repository";
import { QrGerenadoRepository } from "./qr_generado.repository";
import { SegUsuariosRepository } from "./seg_usuarios.repository";
import { EntidadesRepository } from "./entidades.repository";
import { TransaccionesCobrosRepository } from "./transacciones_cobros.repository";

@Module({
  imports: [], // Importa el ConfigModule para manejar las variables de entorno
  providers: [ArchivosRepository, CobrosClientesRepository, CotelContratoRepository, CotelDetalleDeudasRepository, CotelDeudasRepository,
    CotelQrGeneradoRepository, CotelReservaDeudaRepository, DatosConfirmadoQrRepository, DeudasClientesRepository, HistoricosDeudasRepository,
    QrGerenadoRepository, SegUsuariosRepository, TransaccionesCobrosRepository,EntidadesRepository],
  exports: [ArchivosRepository, CobrosClientesRepository, CotelContratoRepository, CotelDetalleDeudasRepository, CotelDeudasRepository,
    CotelQrGeneradoRepository, CotelReservaDeudaRepository, DatosConfirmadoQrRepository, DeudasClientesRepository, HistoricosDeudasRepository,
    QrGerenadoRepository, SegUsuariosRepository, TransaccionesCobrosRepository,EntidadesRepository],
})
export class RepositoryModule { }
