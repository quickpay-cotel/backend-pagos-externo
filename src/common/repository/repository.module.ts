import { Module } from "@nestjs/common";
import { CotelContratoRepository } from "./cotel.contrato.repository";
import { CotelDetalleDeudasRepository } from "./cotel.detalle-deudas.repository";
import { CotelDeudasRepository } from "./cotel.deudas.repository";
import { CotelQrGeneradoRepository } from "./cotel.qr_generado.repository";
import { CotelReservaDeudaRepository } from "./cotel.reserva.deuda.repository";
import { CotelDatosConfirmadoQrRepository } from "./cotel.datosconfirmado_qr.repository";
import { CotelTransacionesRepository } from "./cotel.transacciones.repository";
@Module({
  imports: [], // Importa el ConfigModule para manejar las variables de entorno
  providers: [ CotelContratoRepository, CotelDetalleDeudasRepository, CotelDeudasRepository,
    CotelQrGeneradoRepository, CotelReservaDeudaRepository,CotelDatosConfirmadoQrRepository,CotelTransacionesRepository],
  exports: [ CotelContratoRepository, CotelDetalleDeudasRepository, CotelDeudasRepository,
    CotelQrGeneradoRepository, CotelReservaDeudaRepository,CotelDatosConfirmadoQrRepository,CotelTransacionesRepository],
})
export class RepositoryModule { }
