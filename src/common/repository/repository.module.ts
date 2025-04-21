import { Module } from "@nestjs/common";
import { CotelContratoRepository } from "./cotel.contrato.repository";
import { CotelDetalleDeudasRepository } from "./cotel.detalle-deudas.repository";
import { CotelDeudasRepository } from "./cotel.deudas.repository";
import { CotelQrGeneradoRepository } from "./cotel.qr_generado.repository";
import { CotelReservaDeudaRepository } from "./cotel.reserva.deuda.repository";
import { CotelDatosConfirmadoQrRepository } from "./cotel.datosconfirmado_qr.repository";
import { CotelTransacionesRepository } from "./cotel.transacciones.repository";
import { CotelComprobanteFacturaRepository } from "./cotel.comprobante_factura.repository";
import { CotelComprobanteReciboRepository } from "./cotel.comprobante_recibo.repository";
import { CotelErrorLogsRepository } from "./cotel.error_logs.repository";

import { CotelFacturaDetalleCajaRepository } from "./cotel.factura_detalle_caja.repository";
import { CotelFacturasCajaRepository } from "./cotel.facturas_caja.repository";
import { CotelFacturasEmitidasCajaRepository } from "./cotel.facturas_emitidas_caja.repository";
import { CotelNotasCajaRepository } from "./cotel.notas_caja.repository";
import { CotelNotasDetalleConciliacionRepository } from "./cotel.notas_detalle_conciliacion.repository";
import { CotelNotasDetalleOrigenRepository } from "./cotel.notas_detalle_origen.repository";
import { CotelNotasEmitidasCajaRepository } from "./cotel.notas_emitidas_caja.repository";
import { CotelNotasDetalleCreditoDebitoRepository } from "./cotel.notas_detalle_credito_debito.repository";
import { CotelNotaAnulacionRepository } from "./cotel.nota_anulacion.repository";
import { CotelFacturaAnulacionRepository } from "./cotel.factura_anulacion.repository";
@Module({
  imports: [], // Importa el ConfigModule para manejar las variables de entorno
  providers: [ CotelContratoRepository, CotelDetalleDeudasRepository, CotelDeudasRepository,
    CotelQrGeneradoRepository, CotelReservaDeudaRepository,CotelDatosConfirmadoQrRepository,CotelTransacionesRepository,
    CotelComprobanteFacturaRepository,CotelComprobanteReciboRepository,CotelErrorLogsRepository, CotelFacturaDetalleCajaRepository,CotelFacturasCajaRepository,CotelFacturasEmitidasCajaRepository,
    CotelNotasCajaRepository,CotelNotasDetalleConciliacionRepository,CotelNotasDetalleOrigenRepository,CotelNotasEmitidasCajaRepository,
    CotelNotasDetalleCreditoDebitoRepository,CotelNotaAnulacionRepository,CotelFacturaAnulacionRepository
  ],
  exports: [ CotelContratoRepository, CotelDetalleDeudasRepository, CotelDeudasRepository,
    CotelQrGeneradoRepository, CotelReservaDeudaRepository,CotelDatosConfirmadoQrRepository,
    CotelTransacionesRepository,CotelComprobanteFacturaRepository,CotelComprobanteReciboRepository,CotelErrorLogsRepository,CotelFacturaDetalleCajaRepository,CotelFacturasCajaRepository,CotelFacturasEmitidasCajaRepository,
    CotelNotasCajaRepository,CotelNotasDetalleConciliacionRepository,CotelNotasDetalleOrigenRepository,
    CotelNotasEmitidasCajaRepository,CotelNotasDetalleCreditoDebitoRepository,CotelNotaAnulacionRepository,CotelFacturaAnulacionRepository
  ],
})
export class RepositoryModule { }
