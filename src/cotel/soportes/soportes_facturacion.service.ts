import { FuncionesGenerales } from './../../common/utils/funciones.generales';
import { FuncionesFechas } from './../../common/utils/funciones.fechas';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import axios, { AxiosInstance } from "axios";

import * as os from 'os';
import { CotelTransacionesRepository } from 'src/common/repository/cotel.transacciones.repository';
import { CotelErrorLogsRepository } from 'src/common/repository/cotel.error_logs.repository';
import { ApiIllaService } from 'src/common/external-services/api.illa.service';
import { CotelDeudasRepository } from 'src/common/repository/cotel.deudas.repository';
import { CotelQrGeneradoRepository } from 'src/common/repository/cotel.qr_generado.repository';
import { CotelDetalleDeudasRepository } from 'src/common/repository/cotel.detalle-deudas.repository';
import { CotelComprobanteFacturaRepository } from 'src/common/repository/cotel.comprobante_factura.repository';
import { EmailService } from 'src/common/correos/email.service';
import { CotelService } from '../cotel.service';
import { CotelComprobanteReciboRepository } from 'src/common/repository/cotel.comprobante_recibo.repository';
@Injectable()
export class SoporteFacturacionService {

  private storePath = path.posix.join(process.cwd(), 'store');
  private plantillasPath = path.posix.join(process.cwd(), 'plantillas');
  constructor(
    private readonly apiIllaService: ApiIllaService,
    private readonly cotelTransacionesRepository: CotelTransacionesRepository,
    private readonly cotelErrorLogsRepository: CotelErrorLogsRepository,
    private readonly cotelDeudasRepository: CotelDeudasRepository,
    private readonly cotelQrGeneradoRepository: CotelQrGeneradoRepository,
    private readonly cotelDetalleDeudasRepository: CotelDetalleDeudasRepository,
    private readonly cotelComprobanteFacturaRepository: CotelComprobanteFacturaRepository,
    private readonly emailService: EmailService,
    private readonly cotelService: CotelService,
    private readonly cotelComprobanteReciboRepository: CotelComprobanteReciboRepository,
  ) {
  }

  public async generarFacturaILLAPorSoportre(vAlias: string, vVerificaFacturaError: boolean): Promise<any> {
    const ipServidor = os.hostname();
    const fechaInicio = new Date();
    let transaccion = null;
    let vNumeroUnico = FuncionesFechas.generarNumeroUnico();
    let vNombreCliente = '';
    let vDatosfacturaIlla = {};
    try {
      // obtener transaccion por alias
      transaccion = await this.cotelTransacionesRepository.findByAlias(vAlias);
      if (!transaccion) {
        //throw new Error(`nno se encuentra transaccion para el alias`);
        return {
          message: 'nno se encuentra transaccion para el alias',
          result: {}
        }
      }

      // verificar si hubo error generar factura
      if (vVerificaFacturaError) {
        let errorLog = await this.cotelErrorLogsRepository.findErrorGeneraFacturaByAlias(vAlias)
        if (!errorLog || errorLog.length == 0) {
          //throw new Error(`No se ha encontrado error en la facturación para el alias`);
          return {
            message: 'No se ha encontrado error en la facturación para el alias',
            result: {}
          }
        }
      }


      // verifica si realmente no tiene una factura
      let comprobanteFactura = await this.cotelComprobanteFacturaRepository.findByAlias(vAlias)
      if (comprobanteFactura != null && comprobanteFactura.length > 0) {
        //throw new Error(`No es posible regenerar factura por que ya se tiene generado `);
        return {
          message: 'No es posible regenerar factura por que ya se tiene generado',
          result: {}
        }
      }

      // GGENERAR FACTURA
      let productos = await this.apiIllaService.obtenerProductos();
      if (!productos || productos.length == 0) {
        //throw new Error(`no se pudo obtener productos de SIAT`);
        return {
          message: 'no se pudo obtener productos de SIAT',
          result: {}
        }
      }

      let sucursales = await this.apiIllaService.obtenerSucursales();
      if (!sucursales || sucursales.length == 0) {
        throw new Error(`no se pudo obtener sucursales de SIAT`);
      }
      let puntosDeventas = await this.apiIllaService.obtenerPuntosVentas();
      if (!puntosDeventas || puntosDeventas.length == 0) {
        throw new Error(`no se pudo obtener puntos de venats de SIAT`);
      }

      let deudas = await this.cotelDeudasRepository.findByAliasPagado(vAlias);
      vNombreCliente = deudas[0].nombre_factura;

      let qrGenerado = await this.cotelQrGeneradoRepository.findByAlias(vAlias);

      let tipoDoc = 0;
      if (deudas[0].tipo_documento == 'CI') tipoDoc = 1;
      if (deudas[0].tipo_documento == 'CEX') tipoDoc = 2;
      if (deudas[0].tipo_documento == 'PAS') tipoDoc = 3;
      if (deudas[0].tipo_documento == 'OD') tipoDoc = 4;
      if (deudas[0].tipo_documento == 'NIT') tipoDoc = 5;

      let nroFactura = await this.cotelComprobanteFacturaRepository.findNroFactura();
      nroFactura = String(nroFactura).split('-')[1]

      // preparar datos para geneta factura
      let datosFactura = {
        /*Identificador de la sucursal o punto de venta en la que se realiza la emisión de la
        factura. Si no se emite facturas desde un punto de venta entonces utilizará el
        identificador y codigoSucursal de una de las sucursales, pero en codigoPuntoVenta
        debe ser igual a cero 0.
        Este identificador es obtenido al momento de registrar sucursales o puntos de venta,
        la descripción de los endpoints puede verse en el recurso customers (es posible
        consultar las sucursales y de ella obtener los identificadores requeridos).
        Debe ser almacenado en su sistema para su uso en la emisión.*/
        identificador: puntosDeventas[0].identificador,

        //Código del tipo de envío realizado: 38=Individual, 39=Paquete y 40=Masivo
        tipoEnvioId: 38, //int

        /*
        Código del tipo de documento sector que será emitido.
        1=FACTURA COMPRA VENTA
        2=FACTURA COMPRA VENTA BONIFICACIONE
        */
        codigoDocumentoSector: 22,

        /*
        Código del punto de venta registrado en el SIN. Este valor es asignado por el SIAT cuando se realiza la creación de un punto de venta.
        Este valor debe ser almacenado en su sistema para su uso en la emisión
        */
        codigoPuntoVenta: puntosDeventas[0].codigoPuntoVenta,

        /*
        Código de la sucursal desde al cual se emitirá una factura, este valor es exactamente el utilizado en el padrón de contribuyentes del SIN
        */
        codigoSucursal: puntosDeventas[0].codigoSucursal,

        /*  Texto que determina el lugar de emisión (municipio o departamento) de la factura. Algunos ejemplos:
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
        telefono: "64074742", //string // definir

        /*Número de factura con la cual se emitirá la factura, este valor es definido plenamente
        por la empresa, sin embargo, puede contactarse con el equipo para realizar un
        control sobre la secuencia de ser necesario*/
        numeroFactura: parseInt(nroFactura), //ricardo dijo q se reinice por año

        /*Nombre o Razón Social de la empresa a la que se emite la factura*/
        nombreRazonSocial: deudas[0].nombre_factura, //string

        /*Código del tipo de Documento de Identidad del cliente beneficiario de la factura. Los
        posibles valores son:
        • 1=Cédula de Identidad (CI)
        • 2=Cédula de Identidad Extranjero (CEX)
        • 3=Pasaporte (PAS)
        • 4=Otros Documentos (OD)
        • 5=Número de Identificación Tributaria (NIT)*/
        codigoTipoDocumentoIdentidad: tipoDoc, //int

        //Número de documento de identidad del cliente beneficiario de la factura.
        numeroDocumento: deudas[0].numero_documento,  //string

        /*Código de cliente asociado al beneficiario de la factura. Este código debe ser creado
        por el sistema de clientes de la empresa conforme normativa del SIN. Algunas
        empresas prefieren mantener el mismo número de documento de identidad más el
        complemento para el tema de duplicados. Es definición plena de la empresa*/
        codigoCliente: deudas[0].numero_documento + '-' + deudas[0].complemento_documento, //string

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
        codigoExcepcion: true, //bool 
        /*
        Texto que permite identificar que usuario del sistema de la empresa que emitió el
        documento fiscal. Ejemplos:
        • USER01
        • AGROTEXT001
        • JUANPEREZ
        • JPEREZ
        */
        usuario: "QUICKPAY-ONLINE", //string
        details: []
      }
      let lstDetalleDeuda = [];
      for (var deuda of deudas) {
        let detalleDeuda = await this.cotelDetalleDeudasRepository.findByDeudaId(deuda.deuda_id);

        for (var deudaDetalle of detalleDeuda) {
          if (deudaDetalle.genera_factura === 'S') {
            let productoSIAJ = productos.filter(r => r.codProductoEmpresa == deudaDetalle.codigo_item);

            // si no hay producto en SIAT creamos nuevo
            if (productoSIAJ.length == 0) {
              try {
                let nuevoProducto = {
                  codigo_item: deudaDetalle.codigo_item,
                  descripcion_item: deudaDetalle.descripcion_item,
                  monto_unitario: parseFloat(deudaDetalle.monto_unitario),
                };
                await this.crearYactivarProductoSiat(nuevoProducto);
                productos = await this.apiIllaService.obtenerProductos();
                productoSIAJ = productos.filter(r => r.codProductoEmpresa == deudaDetalle.codigo_item);
                if (productoSIAJ.length != 1) {
                  throw new Error(`el producto ${deudaDetalle.codigo_item} no existe o esta registrado mas de 1 vez en SIAT`);
                }
              } catch (error) {
                throw new Error(`Erorr al crear producto ${deudaDetalle.codigo_item}  en SIAT, mensaje tecnico: ${error}`);
              }
            }
            if (productoSIAJ.length > 1) {
              throw new Error(`el producto ${deudaDetalle.codigo_item} se ha registrado mas de  1 vez en SIAT`);
            }

            let detalleDeuda = {
              /*
              Identificador de un producto registrado en Illasoft, este valor es obtenido al
              momento de registrar los productos de la empresa en el recurso customers, el
              mismo es detallado más adelante
              */
              empresaProductoId: productoSIAJ[0].empresaProductoId, //long
              /*Valor numérico que determina la cantidad de productos o servicios que se
              encuentran detallados en el ítem. Para la venta de productos sujetos a peso, puede
              enviarse valores como: 1.25, 2.67
              Para la venta de servicios el valor generalmente es 1*/

              cantidad: deudaDetalle.cantidad,//decimal
              //Monto que representa el precio del producto o servicio. Acepta 2 decimales.
              precioUnitario: parseFloat(deudaDetalle.monto_unitario??0),//decimal
              /*Monto que representa el descuento aplicado al producto o servicio vendido. Acepta
              2 decimales. Se debe considerar que este valor no llega al Registro de Compras del
              cliente dado que el SIN asume que este tipo de descuentos pueden considerarse
              neteados*/
              montoDescuento: parseFloat(deudaDetalle.monto_descuento_item??0),//decimal
            }
            lstDetalleDeuda.push(detalleDeuda);
          }
        }
      }
      if (lstDetalleDeuda.length > 0) {

        datosFactura.details = lstDetalleDeuda;

        // GGENERAR FACTURA
        let resFacturacion = await this.apiIllaService.generarFacturaTelcom(datosFactura);

        if (!resFacturacion.status) {
          throw new Error(resFacturacion.message);
        }
        resFacturacion = resFacturacion.result;
        vDatosfacturaIlla = resFacturacion;
        // ALMACENAR XML Y PDF
        const filePathPdf = path.join(this.storePath + '/facturas', 'factura-' + vAlias + '_' + vNumeroUnico + '.pdf');
        const filePathXml = path.join(this.storePath + '/facturas', 'factura-' + vAlias + '_' + vNumeroUnico + '.xml');


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
        await this.cotelComprobanteFacturaRepository.create({
          identificador: resFacturacion.identificador,
          transaccion_id: transaccion[0].transaccion_id,
          ruta_xml: filePathXml,
          ruta_pdf: filePathPdf,
          leyenda: resFacturacion.leyenda,
          leyenda_emision: resFacturacion.leyendaEmision,
          cufd: resFacturacion.cufd,
          cuf: resFacturacion.cuf,
          fecha_emision: resFacturacion.fechaEmision,
          estado_id: 1000
        });
        //this.cotelTransacionesRepository.cambiarEstadoTransactionById(transaccion[0].transaccion_id, 1011);
      } else {
        return {
          message: 'No cuenta con productos para generar factura',
          result: {}
        }
      }
    } catch (error) {
      // se debe alacenar log del error ....
      //this.cotelTransacionesRepository.cambiarEstadoTransactionById(Number(transaccion[0].transaccion_id), 1014);

      await this.cotelErrorLogsRepository.create({
        alias: vAlias,
        metodo: this.getMethodName() + ' - generar factura',
        mensaje: error.message,
        stack_trace: error.stack,
        ip_servidor: ipServidor,
        fecha_inicio: fechaInicio,
        fecha_fin: new Date(),
        parametros: { alias: vAlias }
      });
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }


    // NOTIFICAR POR CORREO A RICARDO
    let qrGenerado2 = await this.cotelQrGeneradoRepository.findByAlias(vAlias);
    try {

      const facturaPathPdf = path.join(this.storePath + '/facturas/' + 'factura-' + vAlias + '_' + vNumeroUnico + '.pdf');
      const facturaPathXml = path.join(this.storePath + '/facturas/' + 'factura-' + vAlias + '_' + vNumeroUnico + '.xml');


      // notificar por correo al cliente con las comprobantes de pago, facturas y recibos
      let paymentDataConfirmado = {
        numeroTransaccion: 'nombre cliente: ' + vNombreCliente + ' alias: ' + vAlias + ' correo cliente: ' + qrGenerado2.correo_para_comprobante + ' telefono cliente: ' + qrGenerado2.nro_celular,
      };
      this.emailService.sendMailNotifyPaymentAndAttachmentsMailtrap(
        "beltran.ricardo@gmail.com", 
        'Facturas generados por SOPORTE ', 
        paymentDataConfirmado,
        null,
        facturaPathPdf, 
        facturaPathXml, 
        null);
    } catch (error) {
      await this.cotelErrorLogsRepository.create({
        alias: vAlias,
        metodo: this.getMethodName() + ' - notificar correo electronico',
        mensaje: error.message,
        stack_trace: error.stack,
        ip_servidor: ipServidor,
        fecha_inicio: fechaInicio,
        fecha_fin: new Date(),
        parametros: {}
      });
    }
    return {
      message: 'factura para alias ' + vAlias + ' generado correctamente',
      result: vDatosfacturaIlla
    }
  }
  public async generarReciboPorSoporte(vAlias: string): Promise<any> {
    const ipServidor = os.hostname();
    const fechaInicio = new Date();
    try {

      // Generar contenido HTML dinámico para RECIBO
      let transaccion = await this.cotelTransacionesRepository.findByAlias(vAlias);
      let datosDeuda = await this.cotelService.datosDeudasPagadoByAlias(vAlias);

      if (datosDeuda.detalle.length > 0) {
        const htmlContent = this.renderTemplate(this.plantillasPath + '/recibo.html', {
          nroRecibo: datosDeuda.nroRecibo.slice(-8) ?? 0,
          nombreCliente: datosDeuda.nombreCliente ?? '',
          //fechaPago: datosDeuda.fechaPago ?? '',
          fechaPago: FuncionesFechas.obtenerFechaFormato,
          metodoPago: datosDeuda.metodoPago ?? '',
          tableRows: datosDeuda.detalle.map(item => `
         <tr>
           <td>${item.mensajeDeuda ?? ''}</td>
           <td style="text-align: center;">${item.periodo ?? ''}</td>
           <td style="text-align: right;">${parseFloat(item.monto).toFixed(2)}</td>
         </tr>
       `).join(''),
          totalPagado: `${parseFloat(datosDeuda.totalPagado).toFixed(2)}`
        });
        // modo ROOT  no es recomendable, pero pide el almalinux
        const browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'load' });
        const pdfBuffer = Buffer.from(await page.pdf({ format: 'A4' }));
        await browser.close();
        let vNumeroUnico = FuncionesFechas.generarNumeroUnico();
        // Guardar el buffer como un archivo PDF
        fs.writeFileSync(this.storePath + '/recibos/' + 'recibo-' + vAlias + '_' + vNumeroUnico + '.pdf', pdfBuffer);
        await this.cotelComprobanteReciboRepository.create({
          identificador: 0,
          transaccion_id: transaccion[0].transaccion_id,
          ruta_pdf: this.storePath + '/recibos/' + 'recibo-' + vAlias + '_' + vNumeroUnico + '.pdf',
          fecha_emision: new Date(),
          estado_id: 1000
        });
        const reciboPath = path.join(this.storePath + '/recibos/' + 'recibo-' + vAlias + '_' + vNumeroUnico + '.pdf');

        let qrGenerado2 = await this.cotelQrGeneradoRepository.findByAlias(vAlias);

        // notificar por correo al cliente con las comprobantes de pago, facturas y recibos
        let paymentDataConfirmado = {
          numeroTransaccion: 'nombre cliente: ' + datosDeuda.nombreCliente + ' alias: ' + vAlias + ' correo cliente: ' + qrGenerado2.correo_para_comprobante + ' telefono cliente: ' + qrGenerado2.nro_celular,
        };
        this.emailService.sendMailNotifyPaymentAndAttachmentsSoporte("beltran.ricardo@gmail.com", 'Recibos generados por SOPORTE ', null, null, reciboPath, paymentDataConfirmado);

        const funcionesGenerales = new FuncionesGenerales();

        return funcionesGenerales.convertToBase64(reciboPath);

      }
    } catch (error) {
      await this.cotelErrorLogsRepository.create({
        alias: vAlias,
        metodo: this.getMethodName() + ' - generar recibo',
        mensaje: error.message,
        stack_trace: error.stack,
        ip_servidor: ipServidor,
        fecha_inicio: fechaInicio,
        fecha_fin: new Date(),
        parametros: { alias: vAlias }
      });
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
  private getMethodName(): string {
    const stack = new Error().stack;
    if (!stack) return 'UnknownMethod';

    const stackLines = stack.split('\n');
    if (stackLines.length < 3) return 'UnknownMethod';

    return stackLines[2].trim().split(' ')[1]; // Extrae el nombre del método
  }
  private async crearYactivarProductoSiat(objProductoEmpresa: any) {
    await this.apiIllaService.crearProductos(objProductoEmpresa);
    await this.apiIllaService.activarProductos();
  }
}
