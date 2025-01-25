import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import { ApiSipService } from "../common/external-services/api.sip.service";
import { ApiCotelService } from "../common/external-services/api.cotel.service";
import { DeudasDto } from "./dto/deudas.dto";
import { ConsultaDatosClienteDto } from "./dto/consulta-datos-cliente.dto";
import { v4 as uuidv4 } from "uuid";
import { FuncionesFechas } from "src/common/utils/funciones.fechas";
import { CotelContratoRepository } from "src/common/repository/cotel.contrato.repository";
import { IDatabase } from "pg-promise";
import { CotelDeudasRepository } from "src/common/repository/cotel.deudas.repository";
import { CotelDetalleDeudasRepository } from "src/common/repository/cotel.detalle-deudas.repository";
import { CotelReservaDeudaRepository } from "src/common/repository/cotel.reserva.deuda.repository";
import { CotelQrGeneradoRepository } from "src/common/repository/cotel.qr_generado.repository";
import { ConsultaDeudasDto } from "./dto/consulta-deudas.dto";
import { ConfirmaPagoQrDto } from "./dto/confirma-pago-qr.dto";
import { NotificationsGateway } from "src/notificaciones/notifications.gateway";
import { CotelDatosConfirmadoQrRepository } from "src/common/repository/cotel.datosconfirmado_qr.repository";
import { CotelTransacionesRepository } from "src/common/repository/cotel.transacciones.repository";

import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

@Injectable()
export class CotelService {
  private readonly axiosInstance: AxiosInstance;
  private storePath = path.posix.join(process.cwd(), 'store');
  constructor(
    private readonly apiSipService: ApiSipService,
    private readonly apiCotelService: ApiCotelService,
    private readonly cotelContratoRepository: CotelContratoRepository,
    private readonly cotelDeudasRepository: CotelDeudasRepository,
    private readonly cotelDetalleDeudasRepository: CotelDetalleDeudasRepository,
    private readonly cotelReservaDeudaRepository: CotelReservaDeudaRepository,
    private readonly cotelQrGeneradoRepository: CotelQrGeneradoRepository,
    private readonly cotelDatosConfirmadoQrRepository: CotelDatosConfirmadoQrRepository,
    @Inject("DB_CONNECTION") private db: IDatabase<any>,) {

  }
  async consultaDatosCliente(consultaDatosClienteRequestDto: ConsultaDatosClienteDto) {
    try {
        let datosCliente = await this.apiCotelService.consultaDatosCliente(consultaDatosClienteRequestDto);
        if (!datosCliente) throw new Error("error al obtener datos cliente");
        return datosCliente;
    } catch (error) {
      console.log(error);
      throw new HttpException(error.response.data.data, HttpStatus.NOT_FOUND);
    }
  }
  async consultaDeudaCliente(consultaDeudasDto: ConsultaDeudasDto) {
    try {
      let datosCliente = await this.apiCotelService.consultaDeudaCliente(consultaDeudasDto.contratoId,consultaDeudasDto.servicioId);
      if (!datosCliente) throw new Error("error al obtener datos cliente");
      return datosCliente;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  async generaQr(deudasDto: DeudasDto) {
    let idTransaccion = '';
    try {

      // verificar si tiene transaccion reservadp api COTEL
      if (deudasDto.transaccionReservado) {
        await this.liberarReserva(deudasDto.transaccionReservado);
      }

      // obtener datos del contrato o telefono api COTEL
      let datosCliente = await this.apiCotelService.consultaDatosCliente(deudasDto.consultaDatosClienteDto);
      if (!datosCliente) throw new Error("error al obtener datos cliente");

      // consulta deudas api COTEL
      let deudasCliente = await this.apiCotelService.consultaDeudaCliente(datosCliente.contratoId, datosCliente.id_servicio);

      // Filtrar deudas seleccionados 
      const deudasSeleccionados = deudasCliente.filter(deudaTodos =>
        deudasDto.codigoDeudas.some(deudaSeleccionado => deudaTodos.codigo_deuda === deudaSeleccionado)
      );

      // reservar deuda en cotel
      let requestReservarDeuda = deudasSeleccionados.map(item => ({ codigoDeuda: item.codigo_deuda, montoDeuda: item.monto }));
      idTransaccion = await this.apiCotelService.reservaPago(requestReservarDeuda);
      if (!idTransaccion) throw new Error("error al reservar Deuda");

      // generar qr con BISA
      const montoTodal = await deudasSeleccionados.reduce((total, deuda) => total + deuda.monto, 0);
      const detalleGlosa = deudasSeleccionados.map(item => item.codigo_deuda).join(", ");
      const dataGeneraQr = {
        detalleGlosa: detalleGlosa, // los codigos de deuda  seleccionados concatenados
        monto: parseFloat(montoTodal.toFixed(2)),
        moneda: "BOB", // todos seran Bolivianos??
        fechaVencimiento: FuncionesFechas.formatDateToDDMMYYYY(new Date()),
        alias: uuidv4(),
        callback: process.env.SIP_CALLBACK,
        tipoSolicitud: "API",
        unicoUso: "true",
      };
      const datosQr = await this.apiSipService.generaQr(dataGeneraQr);
      if (!datosQr.imagenQr) throw new Error("error al generar QR");

      // almacenar  QR en archivo
      await this.almacenarQR(datosQr.imagenQr, dataGeneraQr.alias);

      // registrar en BD  TRANSACTIONAL
      return await this.db.tx(async (t) => {
        // registrar QR generado
        const qrGenerado = await this.cotelQrGeneradoRepository.create({
          alias: dataGeneraQr.alias,
          callback: dataGeneraQr.callback,
          detalle_glosa: dataGeneraQr.detalleGlosa,
          monto: dataGeneraQr.monto,
          moneda: dataGeneraQr.moneda,
          tipo_solicitud: dataGeneraQr.tipoSolicitud,
          unico_uso: dataGeneraQr.unicoUso,
          ruta_qr: this.storePath + '/qr/' + 'qr-' + dataGeneraQr.alias + '.jpg',
          id_qr_sip: datosQr.idQr,
          fecha_vencimiento_sip: datosQr.fechaVencimiento,
          banco_destino_sip: datosQr.bancoDestino,
          cuenta_destino_sip: datosQr.cuentaDestino,
          id_transaccion_sip: datosQr.idTransaccion,
          es_imagen_sip: datosQr.esImagen,
          correo_para_comprobante:deudasDto.correoParaComprobante,
          estado_id: 1000
        }, t)
        if (!qrGenerado) throw new Error("nose pudo registrar QR");
        // registrar contrato
        const contrato = await this.cotelContratoRepository.create(
          {
            nombre_completo: datosCliente.nombres,
            servicio_id: datosCliente.id_servicio,
            servicio: datosCliente.servicio,
            estado_id: 1000,
          },
          t,
        );
        if (!contrato) throw new Error("nose pudo registrar contrato");

        for (var deudaSeleccionado of deudasSeleccionados) {

          // registrar deudas
          const deuda = await this.cotelDeudasRepository.create(
            {
              contrato_id: contrato.contrato_id,
              nombre_factura: deudaSeleccionado.nombre_factura,
              periodo: deudaSeleccionado.periodo,
              codigo_servicio: deudaSeleccionado.codigo_servicio,
              codigo_deuda: deudaSeleccionado.codigo_deuda,
              monto: deudaSeleccionado.monto,
              reconexion: deudaSeleccionado.reconexion,
              mensaje_deuda: deudaSeleccionado.mensaje_deuda,
              tipo_documento: deudaSeleccionado.tipo_documento,
              numero_documento: deudaSeleccionado.numero_documento,
              complemento_documento: deudaSeleccionado.complemento_documento,
              codigo_documento_sector: deudaSeleccionado.codigo_documento_sector,
              actividad: deudaSeleccionado.actividad,
              monto_cf: deudaSeleccionado.monto_cf,
              monto_descuento: deudaSeleccionado.monto_descuento,
              estado_id: 1000
            },
            t,
          );

          // registrar deudas detalle
          for (var detalleDeuda of deudaSeleccionado.detalle) {
            await this.cotelDetalleDeudasRepository.create(
              {
                deuda_id: deuda.deuda_id,
                secuencia: detalleDeuda.secuencia,
                codigo_item: detalleDeuda.codigo_item,
                descripcion_item: detalleDeuda.descripcion_item,
                cantidad: detalleDeuda.cantidad,
                monto_unitario: detalleDeuda.monto_unitario,
                monto_item: detalleDeuda.monto_item,
                monto_descuento_item: detalleDeuda.monto_descuento_item,
                genera_factura: detalleDeuda.genera_factura,
                estado_id: 1000
              }, t
            );
          }

          // reserva deuda
           await this.cotelReservaDeudaRepository.create({
            deuda_id: deuda.deuda_id,
            qr_generado_id: qrGenerado.qr_generado_id,
            id_transaccion: idTransaccion,
            estado_reserva_id: 1004, // reservado
            fecha_expiracion: new Date(), // mas 1 hora
            estado_id: 1000
          }, t)
        }
        return {
          imagen_qr: "data:image/png;base64," + datosQr.imagenQr,
          fecha_vencimiento: datosQr.fechaVencimiento,
          alias: dataGeneraQr.alias,
          id_transaccion_reserva: idTransaccion
        };
      });
    } catch (error) {
      console.log("metodo: generaQr ",error);
      if (idTransaccion) {
        await this.liberarReserva(idTransaccion);
      }
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }
  async liberarReserva(pTransaccionId: string) {
    try {
      let resp = await this.apiCotelService.liberarReserva(pTransaccionId);
      if (!resp) throw new Error("error al liberar Reserva Pago");
      await this.cotelReservaDeudaRepository.cambiarEstadoReservaByIdTransaccion(pTransaccionId, 1008);
      return resp;
    } catch (error) {
      console.log(error);
      throw new HttpException(error.response.data.data, HttpStatus.NOT_FOUND);
    }
  }
  async datosDeudasPagadoByAlias(alias: String) {
    let deudasPagado = await this.cotelDatosConfirmadoQrRepository.deudasByAliasPagado(alias);
    let detallePago = [];
    for (const det of deudasPagado) {
      detallePago.push({
        mensajeDeuda: det.mensaje_deuda,
        periodo: det.periodo,
        monto: det.monto
      })
    }

    let datosDeuda = {
      nroRecibo: alias,
      nombreCliente: deudasPagado[0].nombre_factura,
      fechaPago: deudasPagado[0].fecha_registro,
      metodoPago: 'QR',
      totalPagado: deudasPagado[0].monto_sip,
      detalle: detallePago
    }
    return datosDeuda;
  }

  async almacenarQR(imgQRBase64, alias) {
    try {
      // Decodificar el string Base64
      const buffer = Buffer.from(imgQRBase64, 'base64');
      // Ruta completa del archivo
      const filePath = path.join(this.storePath + '/qr', 'qr-' + alias + '.jpg');
      // Guardar el archivo en la carpeta 'store'
      fs.writeFileSync(filePath, buffer);
    } catch (error) {
      throw new Error(`Error al guardar el QR: ${error.message}`);
    }
  }
}
