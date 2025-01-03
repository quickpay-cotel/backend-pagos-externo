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
@Injectable()
export class CotelService {
  private readonly axiosInstance: AxiosInstance;
  constructor(
    private readonly apiSipService: ApiSipService,
    private readonly apiCotelService: ApiCotelService,
    private readonly cotelContratoRepository: CotelContratoRepository,
    private readonly cotelDeudasRepository: CotelDeudasRepository,
    private readonly cotelDetalleDeudasRepository: CotelDetalleDeudasRepository,
    private readonly cotelReservaDeudaRepository: CotelReservaDeudaRepository,
    private readonly cotelQrGeneradoRepository: CotelQrGeneradoRepository,
    private readonly cotelDatosConfirmadoQrRepository: CotelDatosConfirmadoQrRepository,
    private readonly cotelTransacionesRepository: CotelTransacionesRepository,
    private readonly notificationsGateway: NotificationsGateway,
    @Inject("DB_CONNECTION") private db: IDatabase<any>,) {
    this.axiosInstance = axios.create({
      baseURL: process.env.COTEL_API,
      timeout: 10000,
    });
  }
  async consultaDatosCliente(consultaDatosClienteRequestDto: ConsultaDatosClienteDto) {
    try {
      const response = await this.axiosInstance.post(
        "/consultar",
        consultaDatosClienteRequestDto,
      );
      const codigo = response.data.status;
      if (codigo == "OK") {
        return response.data.data;
      } else {
        return null;
      }
    } catch (error) {
      throw new HttpException(error.response.data.data, HttpStatus.NOT_FOUND);
    }
  }
  async consultaDeudaCliente(consultaDeudasDto: ConsultaDeudasDto) {
    try {
      const response = await this.axiosInstance.post("/consultarDeuda", {
        contratoId: consultaDeudasDto.contratoId,
        servicioId: consultaDeudasDto.servicioId,
      });
      const codigo = response.data.status;
      if (codigo == "OK") {
        return response.data.data;
      } else {
        return null;
      }
    } catch (error) {
      return error;
    }
  }
  async generaQr(deudasDto: DeudasDto) {
    let idTransaccion = '';
    try {

      // obtener datos del contrato o telefono
      let datosCliente = await this.apiCotelService.consultaDatosCliente(deudasDto.consultaDatosClienteDto);
      if (!datosCliente) throw new Error("error al obtener datos cliente");

      // consulta deudas 
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
      const datosQr = await this.apiSipService.generaQr(dataGeneraQr); // se sugiere q ese guarde la imagen QR tambien
      if (!datosQr.imagenQr) throw new Error("error al generar QR");

      // registrar en BD 
      return await this.db.tx(async (t) => {

         // registrar QR generado
         const qrGenerado = await this.cotelQrGeneradoRepository.create({
          alias: dataGeneraQr.alias,
          callback: dataGeneraQr.callback,
          detalle_glosa: dataGeneraQr.detalleGlosa,
          monto: dataGeneraQr.monto,
          moneda: dataGeneraQr.moneda,
          fecha_vencimiento: dataGeneraQr.fechaVencimiento,
          tipo_solicitud: dataGeneraQr.tipoSolicitud,
          unico_uso: dataGeneraQr.unicoUso,
          //imagen_qr_sip: datosQr.imagenQr,
          id_qr_sip: datosQr.idQr,
          fecha_vencimiento_sip: datosQr.fechaVencimiento,
          banco_destino_sip: datosQr.bancoDestino,
          cuenta_destino_sip: datosQr.cuentaDestino,
          id_transaccion_sip: datosQr.idTransaccion,
          es_imagen_sip: datosQr.esImagen,
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
                deudas_id: deuda.deuda_id,
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
          const reservaDeuda = await this.cotelReservaDeudaRepository.create({
            deuda_id: deuda.deuda_id,
            qr_generado_id:qrGenerado.qr_generado_id,
            id_transaccion: idTransaccion,
            estado_reserva_id: 1004, // reservado
            fecha_expiracion: new Date(), // mas 1 hora
            estado_id: 1000
          }, t)
          return {
            imagen_qr: "data:image/png;base64," + datosQr.imagenQr,
            fecha_vencimiento: datosQr.fechaVencimiento,
            alias: dataGeneraQr.alias,
            id_transaccion_reserva: reservaDeuda.id_transaccion
          };
        }
      });
    } catch (error) {
      if (idTransaccion) {
        await this.liberarReserva(idTransaccion);
      }
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }
  async liberarReserva(pTransaccionId: string) {
    try {
      let resp = await this.apiCotelService.liberarReserva(pTransaccionId);
      if (!resp) throw new Error("error al obtener datos cliente");
      await this.cotelReservaDeudaRepository.cambiarEstadoReservaByIdTransaccion(pTransaccionId, 1008);
      return resp;
    } catch (error) {
      throw new HttpException(error.response.data.data, HttpStatus.NOT_FOUND);
    }
  }
  async confirmaPagoQr(confirmaPagoQrDto: ConfirmaPagoQrDto) {
    try {
      // verificamos datos qr generado en nuestro sistema
      let qrGenerado = await this.cotelQrGeneradoRepository.findByAlias(confirmaPagoQrDto.alias);
      if (!qrGenerado) throw new Error("QR no generado por QUICKPAY");

      // notificar al frontend del pago
      this.notificationsGateway.sendNotificationToAll(confirmaPagoQrDto.alias + "|" + "PROCESANDO PAGO");
      let transaccionReserva = null;
      // registrar en BD 
      await this.db.tx(async (t) => {
        for (const itemQr of qrGenerado) {
          // registrar confirmacion de pago
          let insertConfirmQr = await this.cotelDatosConfirmadoQrRepository.create({
            qr_generado_id: itemQr.qr_generado_id,
            alias_sip: confirmaPagoQrDto.alias,
            numero_orden_originante_sip: confirmaPagoQrDto.numeroOrdenOriginante,
            monto_sip: confirmaPagoQrDto.monto,
            id_qr_sip: confirmaPagoQrDto.idQr,
            moneda_sip: confirmaPagoQrDto.moneda,
            fecha_proceso_sip: confirmaPagoQrDto.fechaproceso,
            cuenta_cliente_sip: confirmaPagoQrDto.cuentaCliente,
            nombre_cliente_sip: confirmaPagoQrDto.nombreCliente,
            documento_cliente_sip: confirmaPagoQrDto.documentoCliente,
            json_sip: confirmaPagoQrDto,
            estado: 1000
          });

          // obtiene la reserva de la deuda
          let deudaReserva = await this.cotelReservaDeudaRepository.findByDeudaId(itemQr.deuda_id);
          let deuda = await this.cotelDeudasRepository.findByDeudaId(itemQr.deuda_id);

          let insertTransaccion = await this.cotelTransacionesRepository.create({
            reserva_deuda_id: deudaReserva.reserva_deuda_id,
            datosconfirmado_qr_id: insertConfirmQr.datosconfirmado_qr_id,
            metodo_pago_id: 1009,
            monto_pagado: deuda.monto,
            moneda: confirmaPagoQrDto.moneda,
            estado_transaccion_id: 1010,
            estado_id: 1000
          });

          transaccionReserva = deudaReserva.id_transaccion;
        }
      });


      let respCotel = await this.apiCotelService.confirmarPago(
        {
          idTransaccion: transaccionReserva,
          eMail: "alvaroquispesegales@gmail.com",
          transaccionWeb: confirmaPagoQrDto.idQr,
          entidad: "QUICKPAY",
          canalPago: "QR",
          fechaPago: FuncionesFechas.formatDate(new Date(), 'dd/MM/yyyy'),
          horaPago: FuncionesFechas.obtenerHoraActual(),
          estadoFactura: "0",
          Cuf: "",
          CufD: "",
          numeroFactura: "",
          fechaEmision: "",
          razonSocial: "",
          tipoDocumento: "",
          numeroDocumento: "",
          complementoDocumento: "",
          urlFactura: ""
        }
      );



    } catch (error) {
      throw new HttpException(error.response.data.data, HttpStatus.NOT_FOUND);
    }
  }
}
