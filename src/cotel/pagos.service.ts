import { CotelDetalleDeudasRepository } from 'src/common/repository/cotel.detalle-deudas.repository';
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ApiSipService } from "../common/external-services/api.sip.service";
import { ApiCotelService } from "../common/external-services/api.cotel.service";
import { ApiIllaService } from "src/common/external-services/api.illa.service";
import { FuncionesFechas } from "src/common/utils/funciones.fechas";
import { IDatabase } from "pg-promise";
import { CotelReservaDeudaRepository } from "src/common/repository/cotel.reserva.deuda.repository";
import { CotelQrGeneradoRepository } from "src/common/repository/cotel.qr_generado.repository";
import { ConfirmaPagoQrDto } from "./dto/confirma-pago-qr.dto";
import { NotificationsGateway } from "src/notificaciones/notifications.gateway";
import { CotelDatosConfirmadoQrRepository } from "src/common/repository/cotel.datosconfirmado_qr.repository";
import { CotelTransacionesRepository } from "src/common/repository/cotel.transacciones.repository";
import { CotelComprobanteFacturaRepository } from "src/common/repository/cotel.comprobante_factura.repository";
import { CotelComprobanteReciboRepository } from "src/common/repository/cotel.comprobante_recibo.repository";


import * as fs from 'fs';
import * as path from 'path';

import * as puppeteer from 'puppeteer';

import { CotelService } from "./cotel.service";
import { CotelDeudasRepository } from "src/common/repository/cotel.deudas.repository";

@Injectable()
export class PagosService {


  //private storePath = path.join(process.cwd(), 'store'); // Ruta de la carpeta 'store'

  private storePath = path.posix.join(process.cwd(), 'store');
  private plantillasPath = path.posix.join(process.cwd(), 'plantillas');
  constructor(
    private readonly apiSipService: ApiSipService,
    private readonly apiCotelService: ApiCotelService,
    private readonly apiIllaService: ApiIllaService,
    private readonly cotelReservaDeudaRepository: CotelReservaDeudaRepository,
    private readonly cotelQrGeneradoRepository: CotelQrGeneradoRepository,
    private readonly cotelDatosConfirmadoQrRepository: CotelDatosConfirmadoQrRepository,
    private readonly cotelTransacionesRepository: CotelTransacionesRepository,
    private readonly cotelComprobanteFacturaRepository: CotelComprobanteFacturaRepository,
    private readonly cotelComprobanteReciboRepository: CotelComprobanteReciboRepository,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly cotelDeudasRepository: CotelDeudasRepository,
    private readonly cotelDetalleDeudasRepository: CotelDetalleDeudasRepository,
    private readonly cotelService: CotelService,
    @Inject("DB_CONNECTION") private db: IDatabase<any>,) {

  }
  async estadoTransaccion(pAlias: any) {
    try {
      // verificar estado de la transaccion
      let resp = await this.apiSipService.estadoTransaccion(pAlias.alias);
      if (!resp) throw new Error("error al veriifcar estado transaccion");
      if (resp.estadoActual != 'PAGADO') throw new Error("El estado de  pago se encuentra " + resp.estadoActual);

      // confirmar el pago
      const confirmaPagoQrDto = new ConfirmaPagoQrDto();
      confirmaPagoQrDto.alias = resp.alias;
      confirmaPagoQrDto.numeroOrdenOriginante = resp.numeroOrdenOriginante;
      confirmaPagoQrDto.monto = resp.monto;
      confirmaPagoQrDto.idQr = resp.idQr;
      confirmaPagoQrDto.moneda = resp.moneda;
      confirmaPagoQrDto.fechaproceso = resp.fechaProcesamiento;
      confirmaPagoQrDto.cuentaCliente = resp.cuentaCliente;
      confirmaPagoQrDto.nombreCliente = resp.nombreCliente;
      confirmaPagoQrDto.documentoCliente = resp.documentoCliente;

      // realizar del pago
      return this.confirmaPagoQr(confirmaPagoQrDto);

    } catch (error) {
      console.log(error);
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }
  async confirmaPagoQr(confirmaPagoQrDto: ConfirmaPagoQrDto) {
    try {
      // PASO 1  RECIBIR LA CONFIRMACION DE PAGO
      // verificamos datos qr generado en nuestro sistema
      let qrGenerado = await this.cotelQrGeneradoRepository.findByAlias(confirmaPagoQrDto.alias);
      if (!qrGenerado) throw new Error("QR no generado por QUICKPAY");

      // verificar el monto
      if (qrGenerado.monto != confirmaPagoQrDto.monto) throw new Error("Monto no es igual al QR generado");

      // notificar al frontend 
      await this.notificationsGateway.sendNotification('notification', { alias: confirmaPagoQrDto.alias, mensaje: 'PROCESANDO PAGO' });

      let deudasReservados = [];
      let insertTransaccion: any;

      // REGISTRAR EN BD LA CONFIRMACION DE PAGO
      await this.db.tx(async (t) => {
        // registrar confirmacion de pago
        let insertConfirmQr = await this.cotelDatosConfirmadoQrRepository.create({
          qr_generado_id: qrGenerado.qr_generado_id,
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
          estado_id: 1000
        });
        // registra transaccion realizado
        insertTransaccion = await this.cotelTransacionesRepository.create({
          datosconfirmado_qr_id: insertConfirmQr.datosconfirmado_qr_id,
          metodo_pago_id: 1009,
          monto_pagado: confirmaPagoQrDto.monto,
          moneda: confirmaPagoQrDto.moneda,
          estado_transaccion_id: 1010,
          estado_id: 1000
        });
        deudasReservados = await this.cotelReservaDeudaRepository.findByQrGeneradoId(qrGenerado.qr_generado_id);
        if (!deudasReservados || deudasReservados.length == 0) throw new Error("No existe deudas reservadas");
        // cambair estado de deudas reservados a PAGADO
        for (const deudaReservado of deudasReservados) {
          await this.cotelReservaDeudaRepository.cambiarEstadoReservaByDeudaId(deudaReservado.deuda_id, 1005);
        }
      });
      // ============================

      //let deudas = this.cotelDeudasRepository.findByDeudaId(deudasReservados[0].deuda_id);

      // GENERAR FACTURA por dada deuda siempre y cuando en el detalle diga factuar "S"
      let resFact = await this.generarFacturaILLA(confirmaPagoQrDto.alias);

      // GENERAR RECIBOS
      await this.generarRecibo(confirmaPagoQrDto.alias);

      // CONFIRMAR A COTEL
      try {
        let requestParaConfirmarCotel = {
          identificador: deudasReservados[0].id_transaccion,
          eMail: "alvaroquispesegales@gmail.com",
          transaccionWeb: confirmaPagoQrDto.idQr,
          entidad: "COTEL-QUICKPAY",
          canalPago: "QR",
          fechaPago: FuncionesFechas.formatDate(new Date(), 'dd/MM/yyyy'),
          horaPago: FuncionesFechas.obtenerHoraActual(),
          estadoFactura: "0", //  hay q definir
          CufD: resFact.cufd,
          Cuf: resFact.cuf,
          numeroFactura: "", // no retorna en proveeddore de factura
          fechaEmision: resFact.fecha_emision,
          razonSocial: "",
          tipoDocumento: "",
          numeroDocumento: "",
          complementoDocumento: "",
          urlFactura: ""
        };
        let respCotel = await this.apiCotelService.confirmarPago(requestParaConfirmarCotel);
      } catch (error) {
        console.log(error);
      }
      // ===================

      // NOTIFICAR AL FRONTEND
      let datosPago = {
        nombreCliente: confirmaPagoQrDto.nombreCliente,
        monto: confirmaPagoQrDto.monto,
        moneda: confirmaPagoQrDto.moneda,
        idQr: confirmaPagoQrDto.idQr,
        fechaproceso: confirmaPagoQrDto.fechaproceso,
        documentoCliente: confirmaPagoQrDto.documentoCliente
      }
      datosPago.fechaproceso = this.formatearFechaProcesadoDeSIP(datosPago.fechaproceso);
      await this.notificationsGateway.sendNotification('notification', { alias: confirmaPagoQrDto.alias, datosPago: datosPago, mensaje: 'PAGO REALIZADO' });


    } catch (error) {
      await this.notificationsGateway.sendNotification('notification', { alias: confirmaPagoQrDto.alias, mensaje: 'PAGO NO SE HA REALIZADO' });
      console.log(error);
      throw new HttpException(error.message || 'Error interno del servidor', HttpStatus.NOT_FOUND);
    }
  }


  async obtenerDatosFactura(pAlias: string) {
    try {
      return this.cotelComprobanteFacturaRepository.findByAlias(pAlias);
    } catch (error) {
      console.log(error);
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }
  async obtenerDatosRecibo(pAlias: string) {
    try {
      return this.cotelComprobanteReciboRepository.findByAlias(pAlias);
    } catch (error) {
      console.log(error);
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

  // Función para reemplazar los marcadores en la plantilla
  private renderTemplate(templatePath: string, data: any): string {
    let template = fs.readFileSync(templatePath, 'utf8');
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, data[key]);
    });
    return template;
  }

  private formatearFechaProcesadoDeSIP(dateString: string) {
    // Convertir la cadena en un objeto Date
    const date = new Date(dateString);

    // Obtener los componentes de la fecha
    const day = String(date.getDate()).padStart(2, '0'); // Día con 2 dígitos
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes con 2 dígitos
    const year = date.getFullYear(); // Año
    const hours = String(date.getHours()).padStart(2, '0'); // Horas con 2 dígitos
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Minutos con 2 dígitos

    // Formato final: dd/MM/yyyy HH:mm
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

    return formattedDate;
  }

  private async generarFacturaILLA(vAlias: string): Promise<any> {

    let deudas = await this.cotelDeudasRepository.findByAliasPagado(vAlias);
    let qrGenerado = await this.cotelQrGeneradoRepository.findByAlias(vAlias);
    for (var deuda of deudas) {

      let tipoDoc = 0;
      if (deuda.tipo_documento = 'CI') tipoDoc = 1;
      if (deuda.tipo_documento = 'NIT') tipoDoc = 5;

      let datosFactura = {
        identificador: "10a0e2fh-5ab7-4179-b20e-63911415e5b8",
        tipoEnvioId: 38,
        codigoDocumentoSector: 1,
        codigoPuntoVenta: 0,
        codigoSucursal: 0,
        municipio: "La Paz", // hay q definir
        telefono: "78873940", // hay q definir
        numeroFactura: 1, // debemos crear como empresa, pero podemos cordinar con el proveedor segun documenttacion
        nombreRazonSocial: deuda.nombre_factura,
        codigoTipoDocumentoIdentidad: tipoDoc,
        numeroDocumento: deuda.numero_documento,
        codigoCliente: deuda.codigo_deuda,
        correoElectronico: qrGenerado.correo_para_comprobante, // correo del cliente
        codigoMetodoPago: 1, // definir con Ricardo
        codigoMoneda: 1,
        tipoCambio: 1,
        montoGiftCard: 0,
        descuentoAdicional: 0,
        codigoExcepcion: false, // si es falso se validara con SIN de lo contrario no, asi dice la documentacion
        usuario: "QUICKPAY",
        details: []
      }

      let detalleDeuda = await this.cotelDetalleDeudasRepository.findByDeudaId(deuda.deuda_id);
      let lstDetalleDeuda = [];
      for (var deudaDetalle of detalleDeuda) {
        if (deudaDetalle.genera_factura == 'S') {
          let detalleDeuda = {
            //Identificador de un producto registrado en Illasoft, este valor es obtenido al
            //momento de registrar los productos de la empresa en el recurso customers, el
            //mismo es detallado más adelante.
            empresaProductoId: 14837,
            //empresaProductoId: deudaDetalle.detalle_deuda_id,
            cantidad: deudaDetalle.cantidad,
            precioUnitario: parseInt(deudaDetalle.monto_unitario),
            montoDescuento: 0
          }
          lstDetalleDeuda.push(detalleDeuda);
        }
      }
      datosFactura.details = lstDetalleDeuda;
      if (lstDetalleDeuda.length > 0) {

        // GGENERAR FACTURA
        let resFact = await this.apiIllaService.generarFactura(datosFactura);

        // ALMACENAR XML Y PDF
        const filePathPdf = path.join(this.storePath + '/facturas', 'factura-' + deuda.deuda_id + '-' + vAlias + '.pdf');
        const filePathXml = path.join(this.storePath + '/facturas', 'factura-' + deuda.deuda_id + '-' + vAlias + '.xml');
        try {
          // Decodificar el string Base64
          const buffer = Buffer.from(resFact.pdf, 'base64');
          // Guardar el archivo en la carpeta 'store'
          fs.writeFileSync(filePathPdf, buffer);
        } catch (error) {
          throw new Error(`Error al guardar el archivo: ${error.message}`);
        }
        try {
          // Decodificar el string Base64
          const buffer = Buffer.from(resFact.xml, 'base64');
          // Guardar el archivo en la carpeta 'store'
          fs.writeFileSync(filePathXml, buffer);
        } catch (error) {
          throw new Error(`Error al guardar el archivo: ${error.message}`);
        }
        let transaccion = await this.cotelTransacionesRepository.findByAlias(vAlias);

        // REGISTRA FACTURA
        await this.cotelComprobanteFacturaRepository.create({
          identificador: resFact.identificador,
          transaccion_id: transaccion[0].transaccion_id,
          deuda_id: deuda.deuda_id,
          ruta_xml: filePathXml,
          ruta_pdf: filePathPdf,
          leyenda: resFact.leyenda,
          leyenda_emision: resFact.leyenda_emision,
          cufd: resFact.cufd,
          cuf: resFact.cuf,
          fecha_emision: resFact.fecha_emision,
          estado_id: 1000
        });
        return resFact;
      } else {
        return null;
      }
    }
  }
  private async generarRecibo(vAlias: string): Promise<any> {

    // Generar contenido HTML dinámico para RECIBO
    let transaccion = await this.cotelTransacionesRepository.findByAlias(vAlias);
    let datosDeuda = await this.cotelService.datosDeudasPagadoByAlias(vAlias);
    if (datosDeuda.detalle.length > 0) {

      const htmlContent = this.renderTemplate(this.plantillasPath + '/recibo.html', {
        nroRecibo: datosDeuda.nroRecibo ?? 0,
        nombreCliente: datosDeuda.nombreCliente ?? '',
        fechaPago: datosDeuda.fechaPago ?? '',
        metodoPago: datosDeuda.metodoPago ?? '',
        tableRows: datosDeuda.detalle.map(item => `
       <tr>
         <td>${item.mensajeDeuda ?? ''}</td>
         <td>${item.periodo ?? ''}</td>
         <td>${parseInt(item.monto).toFixed(2)}</td>
       </tr>
     `).join(''),
        totalPagado: `${parseInt(datosDeuda.totalPagado).toFixed(2)}`
      });
      // modo ROOT  no es recomendable, pero pide el almalinux
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'load' });
      const pdfBuffer = Buffer.from(await page.pdf({ format: 'A4' }));
      await browser.close();
      // Guardar el buffer como un archivo PDF
      fs.writeFileSync(this.storePath + '/recibos/' + 'recibo-' + vAlias + '.pdf', pdfBuffer);
      await this.cotelComprobanteReciboRepository.create({
        identificador: 0,
        transaccion_id: transaccion[0].transaccion_id,
        ruta_pdf: this.storePath + '/recibos/' + 'recibo-' + vAlias + '.pdf',
        fecha_emision: new Date(),
        estado_id: 1000
      });
    }
  }

   async obtenerComprobantes(pAlias: string) {
    let nombres = [];
    try {
      // verificar estado de la transaccion
      let recibos = await this.cotelComprobanteReciboRepository.findByAlias(pAlias);
      for (var factura of recibos) {
        nombres.push(path.parse(factura.ruta_pdf).name)
      }
      let facturas = await this.cotelComprobanteFacturaRepository.findByAlias(pAlias);
      for (var recibo of facturas) {
        nombres.push(path.parse(recibo.ruta_pdf).name)
      }
      return nombres;

    } catch (error) {
      console.log(error);
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }
}

