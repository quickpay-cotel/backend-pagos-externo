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
import { EmailService } from 'src/common/correos/email.service';

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
    private readonly emailService: EmailService,
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
      // REGISTRAR CONFIRMACIÓN DE PAGO
      // verificamos datos qr generado en nuestro sistema
      let qrGenerado = await this.cotelQrGeneradoRepository.findByAlias(confirmaPagoQrDto.alias);
      if (!qrGenerado) throw new Error("QR no generado por QUICKPAY");

      // verificar el monto
      if (qrGenerado.monto != confirmaPagoQrDto.monto) throw new Error("Monto no es igual al QR generado");

      // notificar al frontend 
      await this.notificationsGateway.sendNotification('notification', { alias: confirmaPagoQrDto.alias, mensaje: 'PROCESANDO PAGO' });

      // notificar por correo al cliente
      let paymentData = {
        nombreCliente: confirmaPagoQrDto.nombreCliente,
        numeroTransaccion: confirmaPagoQrDto.alias,
        monto: confirmaPagoQrDto.monto,
        moneda: confirmaPagoQrDto.moneda,
        fecha: confirmaPagoQrDto.fechaproceso,
        nombreEmpresa: 'COTEL'
      };
      this.emailService.sendMailNotifyPayment(qrGenerado.correo_para_comprobante, 'confirmación de pago', paymentData);

      // registrar confirmación en BD
      let deudasReservados = [];
      await this.db.tx(async (t) => {
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
        await this.cotelTransacionesRepository.create({
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

      // GENERAR FACTURA 
      let resFact = await this.generarFacturaILLA(confirmaPagoQrDto.alias);

      // GENERAR RECIBOS
      await this.generarRecibo(confirmaPagoQrDto.alias);

      // CONFIRMAR A COTEL
      let transaccion = await this.cotelTransacionesRepository.findByAlias(confirmaPagoQrDto.alias);
      try {
        let requestParaConfirmarCotel = {
          identificador: transaccion[0].id_transaccion,
          eMail: "alvaroquispesegales@gmail.com",
          transaccionWeb: confirmaPagoQrDto.idQr,
          entidad: "COTEL-QUICKPAY",
          canalPago: "QR",
          fechaPago: FuncionesFechas.formatDate(new Date(), 'dd/MM/yyyy'),
          horaPago: FuncionesFechas.obtenerHoraActual(),
          estadoFactura: "0", //  hay q definir
          CufD: resFact.cufd ?? '',
          Cuf: resFact.cuf ?? '',
          numeroFactura: "", // no retorna en proveeddore de factura
          fechaEmision: resFact.fecha_emision,
          razonSocial: "",
          tipoDocumento: "",
          numeroDocumento: "",
          complementoDocumento: "",
          urlFactura: ""
        };
        let respCotel = await this.apiCotelService.confirmarPago(requestParaConfirmarCotel);
        console.log("respuesta de COTE al confirmar el PAGO");
        console.log(respCotel);
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

      //const facturaPath = path.join(this.storePath + '/facturas', 'factura-' + deuda.deuda_id + '-' + confirmaPagoQrDto.alias + '.pdf');
      const reciboPath = path.join(this.storePath + '/recibos/' + 'recibo-' + confirmaPagoQrDto.alias + '.pdf');


      // notificar por correo al cliente con las comprobantes de pago, facturas y recibos
      let paymentDataConfirmado = {
        nombreCliente: confirmaPagoQrDto.nombreCliente,
        numeroTransaccion: confirmaPagoQrDto.alias,
        monto: confirmaPagoQrDto.monto,
        moneda: confirmaPagoQrDto.moneda,
        fecha: confirmaPagoQrDto.fechaproceso,
        nombreEmpresa: 'COTEL'
      };
      this.emailService.sendMailNotifyPaymentAndAttachments(qrGenerado.correo_para_comprobante, 'confirmación de pago y comprobantes', paymentDataConfirmado,reciboPath);

    } catch (error) {
      await this.notificationsGateway.sendNotification('notification', { alias: confirmaPagoQrDto.alias, mensaje: 'PAGO NO SE HA REALIZADO' });
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
        /*Identificador de la sucursal o punto de venta en la que se realiza la emisión de la
        factura. Si no se emite facturas desde un punto de venta entonces utilizará el
        identificador y codigoSucursal de una de las sucursales, pero en codigoPuntoVenta
        debe ser igual a cero 0.
        Este identificador es obtenido al momento de registrar sucursales o puntos de venta,
        la descripción de los endpoints puede verse en el recurso customers (es posible
        consultar las sucursales y de ella obtener los identificadores requeridos).
        Debe ser almacenado en su sistema para su uso en la emisión.*/
        identificador: "10a0e2fh-5ab7-4179-b20e-63911415e5b8", //string

        //Código del tipo de envío realizado: 38=Individual, 39=Paquete y 40=Masivo
        tipoEnvioId: 38, //int

        /*
        Código del tipo de documento sector que será emitido.
        1=FACTURA COMPRA VENTA
        2=FACTURA COMPRA VENTA BONIFICACIONE
        */
        codigoDocumentoSector: 1, //int

        /*
        Código del punto de venta registrado en el SIN. Este valor es asignado por el SIAT cuando se realiza la creación de un punto de venta.
        Este valor debe ser almacenado en su sistema para su uso en la emisión
        */
        codigoPuntoVenta: 0,//int

        /*
        Código de la sucursal desde al cual se emitirá una factura, este valor es exactamente el utilizado en el padrón de contribuyentes del SIN
        */
        codigoSucursal: 0, //int

        /*      Texto que determina el lugar de emisión (municipio o departamento) de la factura. Algunos ejemplos:
        - Santa Cruz
        - Montero
        - La Paz-Copacabana
        Queda a criterio de la empresa, tomando en cuenta que este valor se imprime en la
        representación gráfica, en la cabecera parte superior izquierda.
      */
        municipio: "La Paz", //string

        /*
        Número de teléfono que puede ser celular o número de teléfono de la empresa, sucursal o punto de venta. Algunos ejemplos:
      - 591 72452154
      - 70612345
      - 22584983
      - 33352645
        Queda a criterio de la empresa, tomando en cuenta que este valor se imprime en la representación gráfica, en la cabecera parte superior izquierda
        */
        telefono: "78873940", //string

        /*Número de factura con la cual se emitirá la factura, este valor es definido plenamente
        por la empresa, sin embargo, puede contactarse con el equipo para realizar un
        control sobre la secuencia de ser necesario*/
        numeroFactura: 1, //int

        /*Nombre o Razón Social de la empresa a la que se emite la factura*/
        nombreRazonSocial: deuda.nombre_factura, //string

        /*Código del tipo de Documento de Identidad del cliente beneficiario de la factura. Los
        posibles valores son:
        • 1=Cédula de Identidad (CI)
        • 2=Cédula de Identidad Extranjero (CEX)
        • 3=Pasaporte (PAS)
        • 4=Otros Documentos (OD)
        • 5=Número de Identificación Tributaria (NIT)*/
        codigoTipoDocumentoIdentidad: tipoDoc, //int

        //Número de documento de identidad del cliente beneficiario de la factura.
        numeroDocumento: deuda.numero_documento,  //string

        /*Código de cliente asociado al beneficiario de la factura. Este código debe ser creado
        por el sistema de clientes de la empresa conforme normativa del SIN. Algunas
        empresas prefieren mantener el mismo número de documento de identidad más el
        complemento para el tema de duplicados. Es definición plena de la empresa*/
        codigoCliente: deuda.numero_documento + deuda.complemento_documento, //string

        /*Correo electrónico al cual se enviará la representación gráfica del documento fiscal y el archivo XML conforme normativa del SIN*/
        correoElectronico: qrGenerado.correo_para_comprobante, //string

        /*Código del método de pago utilizado en la transacción comercial. Los valores
          comúnmente utilizados son:
          • 1=EFECTIVO
          • 2=TARJETA DEBITO/CREDITO
          • 3=CHEQUE
          • 4=VALE
          • 5=OTROS
          • 6=PAGOS POSTERIOR (CREDITO)
          • 7=TRASNFERENCIA BANCARIA
          • 8=DEPOSITO EN CUENTA
          • 27=GIFTCARD
          • 31=CANAL DE PAGO
          • 32=BILLETERA MOVIL
          • 33=PAGO ONLINE
          Si se requiere combinaciones u otros métodos de pago favor contactarse con soporte
          para que le entreguen el catálogo completo.
        */
        codigoMetodoPago: 1, //int
        /*
        Código de moneda en la que se realizó la transacción comercial. Los valores comunes son:
          • 1=BOLIVIANO
          • 2=DOLARES
          • 7=EURO
          • 9=PESO ARGENTINO
          • 23=REAL BRASILEÑO
          • 33=PESO CHILENO
          • 35=PESO COLOMBIANO
          • 109=NUEVO SOL PERUANO
        Si se requiere otros códigos de moneda por favor contactarse con soporte para que
        le entreguen el catálogo completo.
        */
        codigoMoneda: 1, //int
        /*
        Valor del tipo de cambio que debe ser aplicado cuando el código de moneda es
        diferente a bolivianos. Cuando el código de Moneda es bolivianos entonces debe
        enviarse el valor 1. Acepta hasta 2 decimales
        */
        tipoCambio: 1, //decimal 
        /*Monto total o parcial de la transacción comercial que es pagada con GIFT-CARD. Se
        debe tomar en cuenta que este valor será tomado solamente si el código método de
        pago es GIFT CARD o alguna combinación que la involucre. Por defecto pueden
        enviarse valor cero (0).*/
        montoGiftCard: 0, //decimal 
        /*
        Monto de descuento global a la transacción comercial. Acepta hasta 2 decimales. Es
        necesario considerar que este monto es independiente y no representa la suma de
        los descuentos de cada ítem de la factura. Por defecto pueden enviarse valor cero
        (0).
        */
        descuentoAdicional: 0, //decimal 
        /*
        Código que permite identificar si un NIT observado puede enviado al SIN como
        declaración indicando que es el dato proporcionado por el cliente. Valores posibles
        • True=Declaro que el NIT es lo que indicó y confirmó el cliente
        • False=El NIT debe ser validado en la transacción de emisión
        */
        codigoExcepcion: false, //bool 
        /*
        Texto que permite identificar que usuario del sistema de la empresa que emitió el
        documento fiscal. Ejemplos:
        • USER01
        • AGROTEXT001
        • JUANPEREZ
        • JPEREZ
        */
        usuario: "QUICKPAY", //string
        details: []
      }

      let detalleDeuda = await this.cotelDetalleDeudasRepository.findByDeudaId(deuda.deuda_id);
      let lstDetalleDeuda = [];
      for (var deudaDetalle of detalleDeuda) {
        if (deudaDetalle.genera_factura == 'S') {
          let detalleDeuda = {
            /*
            Identificador de un producto registrado en Illasoft, este valor es obtenido al
            momento de registrar los productos de la empresa en el recurso customers, el
            mismo es detallado más adelante
            */
            empresaProductoId: 14837, //long
            /*Valor numérico que determina la cantidad de productos o servicios que se
            encuentran detallados en el ítem. Para la venta de productos sujetos a peso, puede
            enviarse valores como: 1.25, 2.67
            Para la venta de servicios el valor generalmente es 1*/

            cantidad: deudaDetalle.cantidad,//decimal
            //Monto que representa el precio del producto o servicio. Acepta 2 decimales.
            precioUnitario: parseInt(deudaDetalle.monto_unitario),//decimal
            /*Monto que representa el descuento aplicado al producto o servicio vendido. Acepta
            2 decimales. Se debe considerar que este valor no llega al Registro de Compras del
            cliente dado que el SIN asume que este tipo de descuentos pueden considerarse
            neteados*/
            montoDescuento: 0 //decimal
          }
          lstDetalleDeuda.push(detalleDeuda);
        }
      }
      datosFactura.details = lstDetalleDeuda;
      if (lstDetalleDeuda.length > 0) {

        // GGENERAR FACTURA
        let resFacturacion = await this.apiIllaService.generarFactura(datosFactura);

        // ALMACENAR XML Y PDF
        const filePathPdf = path.join(this.storePath + '/facturas', 'factura-' + deuda.deuda_id + '-' + vAlias + '.pdf');
        const filePathXml = path.join(this.storePath + '/facturas', 'factura-' + deuda.deuda_id + '-' + vAlias + '.xml');
        try {
          // Decodificar el string Base64
          const bufferPdf = Buffer.from(resFacturacion.pdf, 'base64');
          const bufferXml = Buffer.from(resFacturacion.xml, 'base64');
          // Guardar el archivo en la carpeta 'store'
          fs.writeFileSync(filePathPdf, bufferPdf);
          fs.writeFileSync(filePathXml, bufferXml);
          console.log('Archivos (factura XML y PDF) almacenado exitosamente')
        } catch (error) {
          throw new Error(`Error al guardar el archivos (XML Y PDF): ${error.message}`);
        }

        // REGISTRA FACTURA
        let transaccion = await this.cotelTransacionesRepository.findByAlias(vAlias);
        await this.cotelComprobanteFacturaRepository.create({
          identificador: resFacturacion.identificador,
          transaccion_id: transaccion[0].transaccion_id,
          deuda_id: deuda.deuda_id,
          ruta_xml: filePathXml,
          ruta_pdf: filePathPdf,
          leyenda: resFacturacion.leyenda,
          leyenda_emision: resFacturacion.leyenda_emision,
          cufd: resFacturacion.cufd,
          cuf: resFacturacion.cuf,
          fecha_emision: resFacturacion.fecha_emision,
          estado_id: 1000
        });

        return resFacturacion;
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

