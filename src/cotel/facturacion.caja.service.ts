import { CotelNotaAnulacionRepository } from "./../common/repository/cotel.nota_anulacion.repository";
import { FacturaAnulacionDto } from "./factura.caja.dto/factura-anulacion.dto";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { IDatabase } from "pg-promise";
import { FacturaDeudaDto } from "./factura.caja.dto/factura-caja-deuda.dto";
import { ApiIllaService } from "src/common/external-services/api.illa.service";
import { CotelComprobanteFacturaRepository } from "src/common/repository/cotel.comprobante_factura.repository";
import { CotelFacturasCajaRepository } from "src/common/repository/cotel.facturas_caja.repository";
import { CotelFacturaDetalleCajaRepository } from "src/common/repository/cotel.factura_detalle_caja.repository";
import { CotelFacturasEmitidasCajaRepository } from "src/common/repository/cotel.facturas_emitidas_caja.repository";
import * as fs from "fs";
import * as path from "path";

import { FuncionesFechas } from "src/common/utils/funciones.fechas";
import { CajaConciliacionNotaDto } from "./factura.caja.dto/caja-conciliacion-nota.dto";
import { CajaNotaCreditoDebitoDto } from "./factura.caja.dto/caja-nota-credito-debito.dto";
import { NotaAnulacionDto } from "./factura.caja.dto/nota-anulacion.dto";
import { CotelNotasCajaRepository } from "src/common/repository/cotel.notas_caja.repository";
import { CotelNotasDetalleConciliacionRepository } from "src/common/repository/cotel.notas_detalle_conciliacion.repository";
import { CotelNotasDetalleOrigenRepository } from "src/common/repository/cotel.notas_detalle_origen.repository";
import { CotelNotasEmitidasCajaRepository } from "src/common/repository/cotel.notas_emitidas_caja.repository";
import { CotelNotasDetalleCreditoDebitoRepository } from "src/common/repository/cotel.notas_detalle_credito_debito.repository";
import { CotelFacturaAnulacionRepository } from "src/common/repository/cotel.factura_anulacion.repository";
import { ApiBrevoService } from "src/common/external-services/api.brevo.service";

@Injectable()
export class FacturacionCajaService {
  private storePath = path.posix.join(process.cwd(), "store");

  constructor(
    private readonly apiIllaService: ApiIllaService,
    private readonly cotelComprobanteFacturaRepository: CotelComprobanteFacturaRepository,
    private readonly cotelFacturasCajaRepository: CotelFacturasCajaRepository,
    private readonly cotelFacturaDetalleCajaRepository: CotelFacturaDetalleCajaRepository,
    private readonly cotelFacturasEmitidasCajaRepository: CotelFacturasEmitidasCajaRepository,

    private readonly cotelNotasCajaRepository: CotelNotasCajaRepository,
    private readonly cotelNotasDetalleConciliacionRepository: CotelNotasDetalleConciliacionRepository,
    private readonly cotelNotasDetalleOrigenRepository: CotelNotasDetalleOrigenRepository,
    private readonly cotelNotasEmitidasCajaRepository: CotelNotasEmitidasCajaRepository,
    private readonly cotelNotasDetalleCreditoDebitoRepository: CotelNotasDetalleCreditoDebitoRepository,
    private readonly cotelNotaAnulacionRepository: CotelNotaAnulacionRepository,
    private readonly cotelFacturaAnulacionRepository: CotelFacturaAnulacionRepository,
    private readonly apiBrevoService: ApiBrevoService
  ) {}
  async facturaTelcom(facturaDeudaDto: FacturaDeudaDto) {
    try {
      // veriicar si el identificador ya ha generado factura
      let lstFacturaEmitida =
        await this.cotelFacturasCajaRepository.facturaEmitidaByIdentificador(
          facturaDeudaDto.identificador
        );
      if (lstFacturaEmitida && lstFacturaEmitida.length) {
        return {
          message:
            "Ya se ha registrado anteriormente una factura con el identificador: " +
            facturaDeudaDto.identificador,
          result: {
            identificador: lstFacturaEmitida[0].identificador,
            nroFactura: lstFacturaEmitida[0].nro_factura,
            urlVerificacion: lstFacturaEmitida[0].url_verificacion,
            urlVerificacionSin: lstFacturaEmitida[0].url_verificacion_sin,
            leyenda: lstFacturaEmitida[0].leyenda,
            leyendaEmision: lstFacturaEmitida[0].leyenda_emision,
            cufd: lstFacturaEmitida[0].cufd,
            cuf: lstFacturaEmitida[0].cuf,
            fechaEmision: lstFacturaEmitida[0].fecha_emision,
          },
        };
      }

      let productos = await this.apiIllaService.obtenerProductos();
      if (!productos || productos.length == 0) {
        throw new Error(`no se pudo obtener productos de SIAT`);
      }
      let puntosDeventas = await this.apiIllaService.obtenerPuntosVentas();
      if (!puntosDeventas || puntosDeventas.length == 0) {
        throw new Error(`no se pudo obtener puntos de venats de SIAT`);
      }

      //let nroFactura = await this.cotelComprobanteFacturaRepository.findNroFactura();
      let nroFactura =
        await this.cotelComprobanteFacturaRepository.findNroFactura();
      nroFactura = String(nroFactura).split("-")[1];

      let tipoDoc = 0;
      if (facturaDeudaDto.codigo_tipo_documento == "CI") tipoDoc = 1;
      if (facturaDeudaDto.codigo_tipo_documento == "CEX") tipoDoc = 2;
      if (facturaDeudaDto.codigo_tipo_documento == "PAS") tipoDoc = 3;
      if (facturaDeudaDto.codigo_tipo_documento == "OD") tipoDoc = 4;
      if (facturaDeudaDto.codigo_tipo_documento == "NIT") tipoDoc = 5;

      let datosFactura = {
        identificador: puntosDeventas[0].identificador,
        //identificador: facturaDeudaDto.identificador, // cotelenvia este valor
        tipoEnvioId: 38, //factura individual
        codigoDocumentoSector: parseInt(
          facturaDeudaDto.codigo_documento_sector
        ),
        codigoPuntoVenta: puntosDeventas[0].codigoPuntoVenta,
        codigoSucursal: puntosDeventas[0].codigoSucursal,
        //codigoSucursal: 69,
        municipio: "La Paz", //lugar de emisión de la factura
        telefono: "64074742", //nro de celular del punto de venta
        numeroFactura: parseInt(nroFactura), //ricardo dijo q se reinice por año
        nombreRazonSocial: facturaDeudaDto.razon_social, //string
        codigoTipoDocumentoIdentidad: tipoDoc, //int
        numeroDocumento: facturaDeudaDto.numero_documento, //string
        codigoCliente: facturaDeudaDto.codigo_cliente,
        //correoElectronico: facturaDeudaDto.email_cliente? facturaDeudaDto.email_cliente:"sinemailcotel@quickpay.com.bo" , //string
        correoElectronico:
          facturaDeudaDto.email_cliente ?? "sinemailcotel@quickpay.com.bo",
        codigoMetodoPago: 1, // EFECTIVO
        codigoMoneda: 1, // BS
        tipoCambio: 1, // CUANDO ES BS SIEMPRE MANDAR 1
        montoGiftCard: 0, // SI ES ATRJETA RECIEN MANDAR VALOR
        descuentoAdicional: facturaDeudaDto.descuento_global,
        codigoExcepcion: true, // El NIT debe ser validado en la transacción de emisión
        usuario: "QUICKPAY-CAJAS",
        details: [],
      };
      let listaDetalle = [];
      for (let deuda of facturaDeudaDto.lineas_detalle_deuda) {
        let productoSIAT = productos.filter(
          (r) => r.codProductoEmpresa == deuda.codigo_producto
        );
        if (productoSIAT.length != 1) {
          throw new Error(
            `el producto ${deuda.codigo_producto} no se encuentra registrado en SIAT, o el producto se encuentra mal registrado`
          );
        }
        listaDetalle.push({
          empresaProductoId: productoSIAT[0].empresaProductoId, // el SIN siempre va retornar un producto
          cantidad: deuda.cantidad,
          descripcionAdicional: deuda.concepto,
          precioUnitario: deuda.costo_unitario,
          montoDescuento: deuda.descuento_unitario,
        });
      }
      datosFactura.details = listaDetalle;
      let resDataTelCom =
        await this.apiIllaService.generarFacturaTelcom(datosFactura);
      if (!resDataTelCom.status) {
        throw new Error(resDataTelCom.message);
      }

      let resFacturacion = resDataTelCom.result;
      // almacenamos facturas
      const filePathPdf = path.join(
        this.storePath + "/facturas_caja",
        "factura-" +
          facturaDeudaDto.identificador +
          "_" +
          FuncionesFechas.generarNumeroUnico() +
          ".pdf"
      );
      const filePathXml = path.join(
        this.storePath + "/facturas_caja",
        "factura-" +
          facturaDeudaDto.identificador +
          "_" +
          FuncionesFechas.generarNumeroUnico() +
          ".xml"
      );
      try {
        // Verificar si los valores existen antes de decodificar
        if (resFacturacion.pdf) {
          const bufferPdf = Buffer.from(resFacturacion.pdf, "base64");
          fs.writeFileSync(filePathPdf, bufferPdf);
        }

        if (resFacturacion.xml) {
          const bufferXml = Buffer.from(resFacturacion.xml, "base64");
          fs.writeFileSync(filePathXml, bufferXml);
        }
        console.log("Archivos (factura XML y PDF) almacenado exitosamente");
      } catch (error) {
        throw new Error(
          `Error al guardar el archivos (XML Y PDF): ${error.message}`
        );
      }

      // registrar los datos de factura
      const facturasCajas = await this.cotelFacturasCajaRepository.create({
        appkey: " - ",
        identificador: facturaDeudaDto.identificador,
        emite_factura: facturaDeudaDto.emite_factura,
        email_cliente: facturaDeudaDto.email_cliente,
        nombre_cliente: facturaDeudaDto.nombre_cliente,
        apellido_cliente: facturaDeudaDto.apellido_cliente,
        ci: facturaDeudaDto.ci,
        razon_social: facturaDeudaDto.razon_social,
        numero_documento: facturaDeudaDto.numero_documento,
        complemento_documento: facturaDeudaDto.complemento_documento,
        codigo_tipo_documento: facturaDeudaDto.codigo_tipo_documento,
        codigo_cliente: facturaDeudaDto.codigo_cliente,
        descuento_global: facturaDeudaDto.descuento_global,
        descripcion: facturaDeudaDto.descripcion,
        codigo_documento_sector: facturaDeudaDto.codigo_documento_sector,
        canal_caja: facturaDeudaDto.canal_caja,
        canal_caja_sucursal: facturaDeudaDto.canal_caja_sucursal,
        canal_caja_usuario: facturaDeudaDto.canal_caja_usuario,
        tipo_documento_caja_id: 1015,
        estado_id: 1000,
      });
      for (let deuda of facturaDeudaDto.lineas_detalle_deuda) {
        const facturasDetalleCajas =
          await this.cotelFacturaDetalleCajaRepository.create({
            factura_caja_id: facturasCajas.factura_caja_id,
            concepto: deuda.concepto,
            cantidad: deuda.cantidad,
            costo_unitario: deuda.costo_unitario,
            descuento_unitario: deuda.descuento_unitario,
            codigo_producto: deuda.codigo_producto,
            ignora_factura: deuda.ignora_factura,
            estado_id: 1000,
          });
      }

      // REGISTRA FACTURA
      await this.cotelFacturasEmitidasCajaRepository.create({
        factura_caja_id: facturasCajas.factura_caja_id,
        identificador: resFacturacion.identificador,
        nro_factura: nroFactura,
        xml_ruta: filePathXml,
        pdf_ruta: filePathPdf,
        url_verificacion: resFacturacion.urlVerificacion,
        url_verificacion_sin: resFacturacion.urlVerificacionSin,
        leyenda: resFacturacion.leyenda,
        leyenda_emision: resFacturacion.leyendaEmision,
        cufd: resFacturacion.cufd,
        cuf: resFacturacion.cuf,
        estado_factura_id: 1019, // PROCESADO
        fecha_emision: resFacturacion.fechaEmision,
        estado_id: 1000,
      });

      return {
        message: resDataTelCom.message,
        result: {
          identificador: resFacturacion.identificador,
          nroFactura: nroFactura,
          xml: resFacturacion.xml,
          pdf: resFacturacion.pdf,
          urlVerificacion: resFacturacion.urlVerificacion,
          urlVerificacionSin: resFacturacion.urlVerificacionSin,
          leyenda: resFacturacion.leyenda,
          leyendaEmision: resFacturacion.leyendaEmision,
          cufd: resFacturacion.cufd,
          cuf: resFacturacion.cuf,
          fechaEmision: resFacturacion.fechaEmision,
        },
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

  async facturaAlquiler(facturaDeudaDto: FacturaDeudaDto) {
    try {
      // veriicar si el identificador ya ha generado factura
      let lstFacturaEmitida =
        await this.cotelFacturasCajaRepository.facturaEmitidaByIdentificador(
          facturaDeudaDto.identificador
        );
      if (lstFacturaEmitida && lstFacturaEmitida.length) {
        return {
          message:
            "Ya se ha registrado anteriormente una factura con el identificador: " +
            facturaDeudaDto.identificador,
          result: {
            identificador: lstFacturaEmitida[0].identificador,
            nroFactura: lstFacturaEmitida[0].nro_factura,
            urlVerificacion: lstFacturaEmitida[0].url_verificacion,
            urlVerificacionSin: lstFacturaEmitida[0].url_verificacion_sin,
            leyenda: lstFacturaEmitida[0].leyenda,
            leyendaEmision: lstFacturaEmitida[0].leyenda_emision,
            cufd: lstFacturaEmitida[0].cufd,
            cuf: lstFacturaEmitida[0].cuf,
            fechaEmision: lstFacturaEmitida[0].fecha_emision,
          },
        };
      }

      let productos = await this.apiIllaService.obtenerProductos();
      if (!productos || productos.length == 0) {
        throw new Error(`no se pudo obtener productos de SIAT`);
      }
      let puntosDeventas = await this.apiIllaService.obtenerPuntosVentas();
      if (!puntosDeventas || puntosDeventas.length == 0) {
        throw new Error(`no se pudo obtener puntos de venats de SIAT`);
      }
      let sucursales = await this.apiIllaService.obtenerSucursales();
      if (!sucursales || sucursales.length == 0) {
        throw new Error(`no se pudo obtener sucursales de SIAT`);
      }

      let nroFactura =
        await this.cotelComprobanteFacturaRepository.findNroFactura();
      nroFactura = String(nroFactura).split("-")[1];

      let tipoDoc = 0;
      if (facturaDeudaDto.codigo_tipo_documento == "CI") tipoDoc = 1;
      if (facturaDeudaDto.codigo_tipo_documento == "CEX") tipoDoc = 2;
      if (facturaDeudaDto.codigo_tipo_documento == "PAS") tipoDoc = 3;
      if (facturaDeudaDto.codigo_tipo_documento == "OD") tipoDoc = 4;
      if (facturaDeudaDto.codigo_tipo_documento == "NIT") tipoDoc = 5;

      let datosFactura = {
        identificador: puntosDeventas[0].identificador,
        //identificador: sucursales[0].identificador,

        //identificador: facturaDeudaDto.identificador, // cotelenvia este valor
        tipoEnvioId: 38, //factura individual
        codigoDocumentoSector: parseInt(
          facturaDeudaDto.codigo_documento_sector
        ),
        codigoPuntoVenta: puntosDeventas[0].codigoPuntoVenta,
        codigoSucursal: puntosDeventas[0].codigoSucursal,
        //codigoSucursal: 69,
        municipio: "La Paz", //lugar de emisión de la factura
        telefono: "78873940", //nro de celular del punto de venta
        numeroFactura: parseInt(nroFactura), //ricardo dijo q se reinice por año
        nombreRazonSocial: facturaDeudaDto.razon_social, //string
        periodoFacturado: " - ", // cotel no envia
        //periodoFacturado: "SEPTIEMBRE 2021", // cotel debe mandar eso
        codigoTipoDocumentoIdentidad: tipoDoc, //int
        numeroDocumento: facturaDeudaDto.numero_documento, //string
        codigoCliente: facturaDeudaDto.codigo_cliente,
        //correoElectronico: facturaDeudaDto.email_cliente ? facturaDeudaDto.email_cliente:"sinemailcotel@quickpay.com.bo", //string
        correoElectronico:
          facturaDeudaDto.email_cliente ?? "sinemailcotel@quickpay.com.bo",
        codigoMetodoPago: 1, // EFECTIVO
        codigoMoneda: 1, // BS
        tipoCambio: 1, // CUANDO ES BS SIEMPRE MANDAR 1
        descuentoAdicional: facturaDeudaDto.descuento_global,
        codigoExcepcion: true, // El NIT debe ser validado en la transacción de emisión
        usuario: "QUICKPAY-CAJAS",
        details: [],
      };
      let listaDetalle = [];
      for (let deuda of facturaDeudaDto.lineas_detalle_deuda) {
        let productoSIAT = productos.filter(
          (r) => r.codProductoEmpresa == deuda.codigo_producto
        );
        if (productoSIAT.length != 1) {
          throw new Error(
            `el producto ${deuda.codigo_producto} no se encuentra registrado en SIAT, o el producto se encuentra mal registrado`
          );
        }
        listaDetalle.push({
          empresaProductoId: productoSIAT[0].empresaProductoId, // el SIN siempre va retornar un producto
          cantidad: deuda.cantidad,
          descripcionAdicional: deuda.concepto,
          precioUnitario: deuda.costo_unitario,
          montoDescuento: deuda.descuento_unitario,
        });
      }
      datosFactura.details = listaDetalle;
      let resDataAlquiler =
        await this.apiIllaService.generarFacturaAlquiler(datosFactura);
      if (!resDataAlquiler.status) {
        throw new Error(resDataAlquiler.message);
      }

      let resFacturacion = resDataAlquiler.result;
      // almacenamos facturas
      const filePathPdf = path.join(
        this.storePath + "/facturas_caja",
        "factura-" +
          facturaDeudaDto.identificador +
          "_" +
          FuncionesFechas.generarNumeroUnico() +
          ".pdf"
      );
      const filePathXml = path.join(
        this.storePath + "/facturas_caja",
        "factura-" +
          facturaDeudaDto.identificador +
          "_" +
          FuncionesFechas.generarNumeroUnico() +
          ".xml"
      );
      try {
        // Verificar si los valores existen antes de decodificar
        if (resFacturacion.pdf) {
          const bufferPdf = Buffer.from(resFacturacion.pdf, "base64");
          fs.writeFileSync(filePathPdf, bufferPdf);
        }

        if (resFacturacion.xml) {
          const bufferXml = Buffer.from(resFacturacion.xml, "base64");
          fs.writeFileSync(filePathXml, bufferXml);
        }

        console.log("Archivos (factura XML y PDF) almacenado exitosamente");
      } catch (error) {
        throw new Error(
          `Error al guardar el archivos (XML Y PDF): ${error.message}`
        );
      }

      // registrar los datos de factura
      const facturasCajas = await this.cotelFacturasCajaRepository.create({
        appkey: " - ",
        identificador: facturaDeudaDto.identificador,
        emite_factura: facturaDeudaDto.emite_factura,
        email_cliente: facturaDeudaDto.email_cliente,
        nombre_cliente: facturaDeudaDto.nombre_cliente,
        apellido_cliente: facturaDeudaDto.apellido_cliente,
        ci: facturaDeudaDto.ci,
        razon_social: facturaDeudaDto.razon_social,
        numero_documento: facturaDeudaDto.numero_documento,
        complemento_documento: facturaDeudaDto.complemento_documento,
        codigo_tipo_documento: facturaDeudaDto.codigo_tipo_documento,
        codigo_cliente: facturaDeudaDto.codigo_cliente,
        descuento_global: facturaDeudaDto.descuento_global,
        descripcion: facturaDeudaDto.descripcion,
        codigo_documento_sector: facturaDeudaDto.codigo_documento_sector,
        canal_caja: facturaDeudaDto.canal_caja,
        canal_caja_sucursal: facturaDeudaDto.canal_caja_sucursal,
        canal_caja_usuario: facturaDeudaDto.canal_caja_usuario,

        tipo_documento_caja_id: 1016,
        estado_id: 1000,
      });
      for (let deuda of facturaDeudaDto.lineas_detalle_deuda) {
        const facturasDetalleCajas =
          await this.cotelFacturaDetalleCajaRepository.create({
            factura_caja_id: facturasCajas.factura_caja_id,
            concepto: deuda.concepto,
            cantidad: deuda.cantidad,
            costo_unitario: deuda.costo_unitario,
            descuento_unitario: deuda.descuento_unitario,
            codigo_producto: deuda.codigo_producto,
            ignora_factura: deuda.ignora_factura,
            estado_id: 1000,
          });
      }

      // REGISTRA FACTURA
      await this.cotelFacturasEmitidasCajaRepository.create({
        factura_caja_id: facturasCajas.factura_caja_id,
        identificador: resFacturacion.identificador,
        nro_factura: nroFactura,
        xml_ruta: filePathXml,
        pdf_ruta: filePathPdf,
        url_verificacion: resFacturacion.urlVerificacion,
        url_verificacion_sin: resFacturacion.urlVerificacionSin,
        leyenda: resFacturacion.leyenda,
        leyenda_emision: resFacturacion.leyendaEmision,
        cufd: resFacturacion.cufd,
        cuf: resFacturacion.cuf,
        estado_factura_id: 1019, // PROCESADO
        fecha_emision: resFacturacion.fechaEmision,
        estado_id: 1000,
      });

      return {
        message: resDataAlquiler.message,
        result: {
          identificador: resFacturacion.identificador,
          nroFactura: nroFactura,
          xml: resFacturacion.xml,
          pdf: resFacturacion.pdf,
          urlVerificacion: resFacturacion.urlVerificacion,
          urlVerificacionSin: resFacturacion.urlVerificacionSin,
          leyenda: resFacturacion.leyenda,
          leyendaEmision: resFacturacion.leyendaEmision,
          cufd: resFacturacion.cufd,
          cuf: resFacturacion.cuf,
          fechaEmision: resFacturacion.fechaEmision,
        },
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

  async notasConciliacion(cajaConciliacionNotaDto: CajaConciliacionNotaDto) {
    try {
      let productos = await this.apiIllaService.obtenerProductos();
      if (!productos || productos.length == 0) {
        throw new Error(`no se pudo obtener productos de SIAT`);
      }
      let puntosDeventas = await this.apiIllaService.obtenerPuntosVentas();
      if (!puntosDeventas || puntosDeventas.length == 0) {
        throw new Error(`no se pudo obtener puntos de venats de SIAT`);
      }

      let detallesOrigen = [];
      for (let objDetalleOrigen of cajaConciliacionNotaDto.detallesOrigen) {
        detallesOrigen.push({
          nroItem: objDetalleOrigen.nroItem,
          actividadEconomica: objDetalleOrigen.actividadEconomica,
          codigoProductoSin: objDetalleOrigen.codigoProductoSin,
          codigoProducto: objDetalleOrigen.codigoProducto,
          descripcion: objDetalleOrigen.descripcion,
          cantidad: objDetalleOrigen.cantidad,
          unidadMedida: objDetalleOrigen.unidadMedida,
          unidadMedidaDescripcion: objDetalleOrigen.unidadMedidaDescripcion,
          precioUnitario: objDetalleOrigen.precioUnitario,
          montoDescuento: objDetalleOrigen.montoDescuento,
          subTotal: objDetalleOrigen.subTotal,
          codigoDetalleTransaccion: objDetalleOrigen.codigoDetalleTransaccion,
        });
      }
      let detallesConciliacion = [];
      for (let objDetalleConciliacion of cajaConciliacionNotaDto.detallesConciliacion) {
        detallesConciliacion.push({
          nroItem: objDetalleConciliacion.nroItem,
          actividadEconomica: objDetalleConciliacion.actividadEconomica,
          codigoProductoSin: objDetalleConciliacion.codigoProductoSin,
          codigoProducto: objDetalleConciliacion.codigoProducto,
          descripcion: objDetalleConciliacion.descripcion,
          montoOriginal: objDetalleConciliacion.montoOriginal,
          montoFinal: objDetalleConciliacion.montoFinal,
          montoConciliado: objDetalleConciliacion.montoConciliado,
        });
      }
      let notasConciliacion = {
        identificador: cajaConciliacionNotaDto.identificador,
        //identificador: puntosDeventas[0].identificador,
        codigoDocumentoSector: cajaConciliacionNotaDto.codigoDocumentoSector,
        codigoPuntoVenta: cajaConciliacionNotaDto.codigoPuntoVenta,
        //codigoPuntoVenta:puntosDeventas[0].codigoPuntoVenta,
        codigoSucursal: cajaConciliacionNotaDto.codigoSucursal,
        //codigoSucursal: puntosDeventas[0].codigoSucursal,
        municipio: cajaConciliacionNotaDto.municipio,
        telefono: cajaConciliacionNotaDto.telefono,
        numeroNota: cajaConciliacionNotaDto.numeroNota,
        nombreRazonSocial: cajaConciliacionNotaDto.nombreRazonSocial,
        codigoTipoDocumentoIdentidad:
          cajaConciliacionNotaDto.codigoTipoDocumentoIdentidad,
        numeroDocumento: cajaConciliacionNotaDto.numeroDocumento,
        complemento: "", // cotel no manda ese dato
        codigoCliente: cajaConciliacionNotaDto.codigoCliente,
        correoElectronico: cajaConciliacionNotaDto.correoElectronico,
        codigoDocumentoSectorOriginal:
          cajaConciliacionNotaDto.codigoDocumentoSectorOriginal,
        numeroFactura: cajaConciliacionNotaDto.numeroFactura,
        numeroAutorizacionCuf: cajaConciliacionNotaDto.numeroAutorizacionCuf,
        fechaEmisionFactura: cajaConciliacionNotaDto.fechaEmisionFactura,
        montoTotalOriginal: cajaConciliacionNotaDto.montoTotalOriginal,
        montoDescuentoAdicional:
          cajaConciliacionNotaDto.montoDescuentoAdicional,
        codigoExcepcion: cajaConciliacionNotaDto.codigoExcepcion,
        usuario: cajaConciliacionNotaDto.usuario,
        detallesOrigen: detallesOrigen,
        detallesConciliacion: detallesConciliacion,
      };

      let restConciliacion =
        await this.apiIllaService.notaConciliacion(notasConciliacion);
      if (!restConciliacion.status) {
        throw new Error(restConciliacion.message);
      }

      let resNotasConciliacion = restConciliacion.result;
      // almacenamos facturas
      const filePathPdf = path.join(
        this.storePath + "/notas_caja",
        "nota-conciliacion-" +
          resNotasConciliacion.identificador +
          "_" +
          FuncionesFechas.generarNumeroUnico() +
          ".pdf"
      );
      const filePathXml = path.join(
        this.storePath + "/notas_caja",
        "nota-conciliacion-" +
          resNotasConciliacion.identificador +
          "_" +
          FuncionesFechas.generarNumeroUnico() +
          ".xml"
      );
      try {
        // Verificar si los valores existen antes de decodificar
        if (resNotasConciliacion.pdf) {
          const bufferPdf = Buffer.from(resNotasConciliacion.pdf, "base64");
          fs.writeFileSync(filePathPdf, bufferPdf);
        }

        if (resNotasConciliacion.xml) {
          const bufferXml = Buffer.from(resNotasConciliacion.xml, "base64");
          fs.writeFileSync(filePathXml, bufferXml);
        }
        console.log("Archivos (factura XML y PDF) almacenado exitosamente");
      } catch (error) {
        throw new Error(
          `Error al guardar el archivos (XML Y PDF): ${error.message}`
        );
      }

      // registramos en la BD NOTA
      const notasCajas = await this.cotelNotasCajaRepository.create({
        identificador: cajaConciliacionNotaDto.identificador,
        codigo_documento_sector: cajaConciliacionNotaDto.codigoDocumentoSector,
        codigo_punto_venta: cajaConciliacionNotaDto.codigoPuntoVenta,
        codigo_sucursal: cajaConciliacionNotaDto.codigoSucursal,
        municipio: cajaConciliacionNotaDto.municipio,
        telefono: cajaConciliacionNotaDto.telefono,
        numero_nota: cajaConciliacionNotaDto.numeroNota,
        nombre_razon_social: cajaConciliacionNotaDto.nombreRazonSocial,
        codigo_tipo_documento_identidad:
          cajaConciliacionNotaDto.codigoTipoDocumentoIdentidad,
        numero_documento: cajaConciliacionNotaDto.numeroDocumento,
        codigo_cliente: cajaConciliacionNotaDto.codigoCliente,
        correo_electronico: cajaConciliacionNotaDto.correoElectronico,
        codigo_documento_sector_original:
          cajaConciliacionNotaDto.codigoDocumentoSectorOriginal,
        numero_factura: cajaConciliacionNotaDto.numeroFactura,
        numero_autorizacion_cuf: cajaConciliacionNotaDto.numeroAutorizacionCuf,
        fecha_emision_factura: cajaConciliacionNotaDto.fechaEmisionFactura,
        monto_total_original: cajaConciliacionNotaDto.montoTotalOriginal,
        monto_descuento_adicional:
          cajaConciliacionNotaDto.montoDescuentoAdicional,
        codigo_excepcion: cajaConciliacionNotaDto.codigoExcepcion,
        usuario: cajaConciliacionNotaDto.usuario,
        tipo_documento_caja_id: 1018,
        estado_id: 1000,
      });

      // notas detalle origen
      for (let notaDetalleOrigen of cajaConciliacionNotaDto.detallesOrigen) {
        const notasCajadetalleOrigen =
          await this.cotelNotasDetalleOrigenRepository.create({
            nota_caja_id: notasCajas.nota_caja_id,
            nro_item: notaDetalleOrigen.nroItem,
            actividad_economica: notaDetalleOrigen.actividadEconomica,
            codigo_producto_sin: notaDetalleOrigen.codigoProductoSin,
            codigo_producto: notaDetalleOrigen.codigoProducto,
            descripcion: notaDetalleOrigen.descripcion,
            cantidad: notaDetalleOrigen.cantidad,
            unidad_medida: notaDetalleOrigen.unidadMedida,
            unidad_medida_descripcion:
              notaDetalleOrigen.unidadMedidaDescripcion,
            precio_unitario: notaDetalleOrigen.precioUnitario,
            monto_descuento: notaDetalleOrigen.montoDescuento,
            sub_total: notaDetalleOrigen.subTotal,
            codigo_detalle_transaccion:
              notaDetalleOrigen.codigoDetalleTransaccion,
            estado_id: 1000,
          });
      }
      // notas detalle conciliacion
      for (let notaDetalleConciliacion of cajaConciliacionNotaDto.detallesConciliacion) {
        const notasCajadetalleOrigen =
          await this.cotelNotasDetalleConciliacionRepository.create({
            nota_caja_id: notasCajas.nota_caja_id,
            nro_item: notaDetalleConciliacion.nroItem,
            actividad_economica: notaDetalleConciliacion.actividadEconomica,
            codigo_producto_sin: notaDetalleConciliacion.codigoProductoSin,
            codigo_producto: notaDetalleConciliacion.codigoProducto,
            descripcion: notaDetalleConciliacion.descripcion,
            monto_original: notaDetalleConciliacion.montoOriginal,
            monto_final: notaDetalleConciliacion.montoFinal,
            monto_conciliado: notaDetalleConciliacion.montoConciliado,
            estado_id: 1000,
          });
      }

      // REGISTRA NOTA
      await this.cotelNotasEmitidasCajaRepository.create({
        nota_caja_id: notasCajas.nota_caja_id,
        identificador: resNotasConciliacion.identificador,
        xml_ruta: filePathXml,
        pdf_ruta: filePathPdf,
        url_verificacion: resNotasConciliacion.urlVerificacion,
        url_verificacion_sin: resNotasConciliacion.urlVerificacionSin,
        leyenda: resNotasConciliacion.leyenda,
        leyenda_emision: resNotasConciliacion.leyendaEmision,
        cufd: resNotasConciliacion.cufd,
        cuf: resNotasConciliacion.cuf,
        estado_nota_id: 1021,
        fecha_emision: resNotasConciliacion.fechaEmision,
        estado_id: 1000,
      });

      return {
        message: restConciliacion.message,
        result: {
          identificador: resNotasConciliacion.identificador,
          xml: resNotasConciliacion.xml,
          pdf: resNotasConciliacion.pdf,
          urlVerificacion: resNotasConciliacion.urlVerificacion,
          urlVerificacionSin: resNotasConciliacion.urlVerificacionSin,
          leyenda: resNotasConciliacion.leyenda,
          leyendaEmision: resNotasConciliacion.leyendaEmision,
          cufd: resNotasConciliacion.cufd,
          cuf: resNotasConciliacion.cuf,
          fechaEmision: resNotasConciliacion.fechaEmision,
        },
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

  async notasCreditoDebito(cajaNotaCreditoDebitoDto: CajaNotaCreditoDebitoDto) {
    try {
      // hay q validar por nro autorizaiconn si esta factura ya se ha emitido nota ccredito debidooo...

      let productos = await this.apiIllaService.obtenerProductos();
      if (!productos || productos.length == 0) {
        throw new Error(`no se pudo obtener productos de SIAT`);
      }
      let puntosDeventas = await this.apiIllaService.obtenerPuntosVentas();
      if (!puntosDeventas || puntosDeventas.length == 0) {
        throw new Error(`no se pudo obtener puntos de venats de SIAT`);
      }

      let detalles = [];
      for (let objDetalle of cajaNotaCreditoDebitoDto.details) {
        detalles.push({
          nroItem: objDetalle.nroItem,
          actividadEconomica: objDetalle.actividadEconomica,
          codigoProductoSin: objDetalle.codigoProductoSin,
          codigoProducto: objDetalle.codigoProducto,
          descripcion: objDetalle.descripcion,
          cantidad: objDetalle.cantidad,
          unidadMedida: objDetalle.unidadMedida,
          //unidadMedidaDescripcion: "Servicios", // esto cotel no manda
          precioUnitario: objDetalle.precioUnitario,
          montoDescuento: objDetalle.montoDescuento,
          subTotal: objDetalle.subTotal,
          codigoDetalleTransaccion: objDetalle.codigoDetalleTransaccion,
        });
      }
      let notasCreditoDebito = {
        identificador: cajaNotaCreditoDebitoDto.identificador,
        codigoDocumentoSector: cajaNotaCreditoDebitoDto.codigoDocumentoSector,
        codigoPuntoVenta: cajaNotaCreditoDebitoDto.codigoPuntoVenta,
        codigoSucursal: cajaNotaCreditoDebitoDto.codigoSucursal,
        municipio: cajaNotaCreditoDebitoDto.municipio,
        telefono: cajaNotaCreditoDebitoDto.telefono,
        numeroNota: cajaNotaCreditoDebitoDto.numeroNota,
        nombreRazonSocial: cajaNotaCreditoDebitoDto.nombreRazonSocial,
        codigoTipoDocumentoIdentidad:
          cajaNotaCreditoDebitoDto.codigoTipoDocumentoIdentidad,
        numeroDocumento: cajaNotaCreditoDebitoDto.numeroDocumento,
        codigoCliente: cajaNotaCreditoDebitoDto.codigoCliente,
        correoElectronico: cajaNotaCreditoDebitoDto.correoElectronico,
        codigoDocumentoSectorOriginal:
          cajaNotaCreditoDebitoDto.codigoDocumentoSectorOriginal,
        numeroFactura: cajaNotaCreditoDebitoDto.numeroFactura,
        numeroAutorizacionCuf: cajaNotaCreditoDebitoDto.numeroAutorizacionCuf,
        fechaEmisionFactura: cajaNotaCreditoDebitoDto.fechaEmisionFactura,
        montoTotalOriginal: cajaNotaCreditoDebitoDto.montoTotalOriginal,
        montoDescuentoAdicional:
          cajaNotaCreditoDebitoDto.montoDescuentoAdicional,
        codigoExcepcion: cajaNotaCreditoDebitoDto.codigoExcepcion,
        usuario: cajaNotaCreditoDebitoDto.usuario,
        details: detalles,
      };

      let resNotasCreditoDebito =
        await this.apiIllaService.notaCreditoDebito(notasCreditoDebito);

      if (!resNotasCreditoDebito.status) {
        throw new Error(resNotasCreditoDebito.message);
      }

      let resFacturaCreditoDebito = resNotasCreditoDebito.result;

      // almacenamos facturas
      const filePathPdf = path.join(
        this.storePath + "/notas_caja",
        "nota-credito-debito-" +
          resFacturaCreditoDebito.identificador +
          "_" +
          FuncionesFechas.generarNumeroUnico() +
          ".pdf"
      );
      const filePathXml = path.join(
        this.storePath + "/notas_caja",
        "nota-credito-debito-" +
          resFacturaCreditoDebito.identificador +
          "_" +
          FuncionesFechas.generarNumeroUnico() +
          ".xml"
      );
      try {
        // Verificar si los valores existen antes de decodificar
        if (resFacturaCreditoDebito.pdf) {
          const bufferPdf = Buffer.from(resFacturaCreditoDebito.pdf, "base64");
          fs.writeFileSync(filePathPdf, bufferPdf);
        }

        if (resFacturaCreditoDebito.xml) {
          const bufferXml = Buffer.from(resFacturaCreditoDebito.xml, "base64");
          fs.writeFileSync(filePathXml, bufferXml);
        }
        console.log("Archivos (factura XML y PDF) almacenado exitosamente");
      } catch (error) {
        throw new Error(
          `Error al guardar el archivos (XML Y PDF): ${error.message}`
        );
      }

      // registramos en la BD NOTA
      const notasCajas = await this.cotelNotasCajaRepository.create({
        identificador: cajaNotaCreditoDebitoDto.identificador,
        codigo_documento_sector: cajaNotaCreditoDebitoDto.codigoDocumentoSector,
        codigo_punto_venta: cajaNotaCreditoDebitoDto.codigoPuntoVenta,
        codigo_sucursal: cajaNotaCreditoDebitoDto.codigoSucursal,
        municipio: cajaNotaCreditoDebitoDto.municipio,
        telefono: cajaNotaCreditoDebitoDto.telefono,
        numero_nota: cajaNotaCreditoDebitoDto.numeroNota,
        nombre_razon_social: cajaNotaCreditoDebitoDto.nombreRazonSocial,
        codigo_tipo_documento_identidad:
          cajaNotaCreditoDebitoDto.codigoTipoDocumentoIdentidad,
        numero_documento: cajaNotaCreditoDebitoDto.numeroDocumento,
        codigo_cliente: cajaNotaCreditoDebitoDto.codigoCliente,
        correo_electronico: cajaNotaCreditoDebitoDto.correoElectronico,
        codigo_documento_sector_original:
          cajaNotaCreditoDebitoDto.codigoDocumentoSectorOriginal,
        numero_factura: cajaNotaCreditoDebitoDto.numeroFactura,
        numero_autorizacion_cuf: cajaNotaCreditoDebitoDto.numeroAutorizacionCuf,
        fecha_emision_factura: cajaNotaCreditoDebitoDto.fechaEmisionFactura,
        monto_total_original: cajaNotaCreditoDebitoDto.montoTotalOriginal,
        monto_descuento_adicional:
          cajaNotaCreditoDebitoDto.montoDescuentoAdicional,
        codigo_excepcion: cajaNotaCreditoDebitoDto.codigoExcepcion,
        usuario: cajaNotaCreditoDebitoDto.usuario,
        tipo_documento_caja_id: 1017,
        estado_id: 1000,
      });

      // notas detalle origen
      for (let notaDetalle of cajaNotaCreditoDebitoDto.details) {
        const notasDetalleCreditoDebito =
          await this.cotelNotasDetalleCreditoDebitoRepository.create({
            nota_caja_id: notasCajas.nota_caja_id,
            nro_item: notaDetalle.nroItem,
            actividad_economica: notaDetalle.actividadEconomica,
            codigo_producto_sin: notaDetalle.codigoProductoSin,
            codigo_producto: notaDetalle.codigoProducto,
            descripcion: notaDetalle.descripcion,
            cantidad: notaDetalle.cantidad,
            unidad_medida: notaDetalle.unidadMedida,
            precio_unitario: notaDetalle.precioUnitario,
            monto_descuento: notaDetalle.montoDescuento,
            sub_total: notaDetalle.subTotal,
            codigo_detalle_transaccion: notaDetalle.codigoDetalleTransaccion,
            estado_id: 1000,
          });
      }

      // REGISTRA NOTA
      await this.cotelNotasEmitidasCajaRepository.create({
        nota_caja_id: notasCajas.nota_caja_id,
        identificador: resFacturaCreditoDebito.identificador,
        xml_ruta: filePathXml,
        pdf_ruta: filePathPdf,
        url_verificacion: resFacturaCreditoDebito.urlVerificacion,
        url_verificacion_sin: resFacturaCreditoDebito.urlVerificacionSin,
        leyenda: resFacturaCreditoDebito.leyenda,
        leyenda_emision: resFacturaCreditoDebito.leyendaEmision,
        cufd: resFacturaCreditoDebito.cufd,
        cuf: resFacturaCreditoDebito.cuf,
        estado_nota_id: 1021,
        fecha_emision: resFacturaCreditoDebito.fechaEmision,
        estado_id: 1000,
      });

      return {
        message: resNotasCreditoDebito.message,
        result: {
          identificador: resFacturaCreditoDebito.identificador,
          xml: resFacturaCreditoDebito.xml,
          pdf: resFacturaCreditoDebito.pdf,
          urlVerificacion: resFacturaCreditoDebito.urlVerificacion,
          urlVerificacionSin: resFacturaCreditoDebito.urlVerificacionSin,
          leyenda: resFacturaCreditoDebito.leyenda,
          leyendaEmision: resFacturaCreditoDebito.leyendaEmision,
          cufd: resFacturaCreditoDebito.cufd,
          cuf: resFacturaCreditoDebito.cuf,
          fechaEmision: resFacturaCreditoDebito.fechaEmision,
        },
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

  async notaAnulacion(notaAnulacionDto: NotaAnulacionDto) {
    try {
      let motivoString = "";
      if (notaAnulacionDto.codigoMotivo == 1)
        motivoString = "FACTURA MAL EMITIDA";
      if (notaAnulacionDto.codigoMotivo == 3)
        motivoString = "DATOS DE EMISIÓN INCORRECTOS";
      if (notaAnulacionDto.codigoMotivo == 4) motivoString = "FACTURA DEVUELTA";

      let puntosDeventas = await this.apiIllaService.obtenerPuntosVentas();
      if (!puntosDeventas || puntosDeventas.length == 0) {
        throw new Error(`no se pudo obtener puntos de venats de SIAT`);
      }
      let payload = {
        identificador: puntosDeventas[0].identificador,
        identificadorNota: notaAnulacionDto.identificadorNota,
        nit: notaAnulacionDto.nit,
        codigoPuntoVenta: puntosDeventas[0].codigoPuntoVenta,
        codigoSucursal: puntosDeventas[0].codigoSucursal,
        codigoMotivo: notaAnulacionDto.codigoMotivo,
        motivo: motivoString,
        cuf: notaAnulacionDto.cuf,
      };
      let resAnulacion = await this.apiIllaService.notaAnulacion(payload);
      if (!resAnulacion.status) {
        throw new Error(resAnulacion.message);
      }

      // obtener nota de BD
      let respNota = await this.cotelNotasCajaRepository.findByIdentificador(
        notaAnulacionDto.identificadorNota
      );
      if (respNota.length != 1) {
        throw new Error(
          "Se ha encontrado " +
            respNota.length +
            " notas registrados para el identificador " +
            notaAnulacionDto.identificadorNota
        );
      }
      // registrar en BD
      await this.cotelNotaAnulacionRepository.create({
        nota_caja_id: respNota ? respNota[0].nota_caja_id : null,
        identificador_nota: notaAnulacionDto.identificadorNota,
        nit: notaAnulacionDto.nit,
        codigo_motivo: notaAnulacionDto.codigoMotivo,
        cuf: notaAnulacionDto.cuf,
        obs: resAnulacion, // respuestaaaa de api de illa
        estado_id: 1000,
      });

      return {
        message: resAnulacion.message,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

  async facturaAlquilerAnulacion(facturaAnulacionDto: FacturaAnulacionDto) {
    try {
      let motivoString = "";
      if (facturaAnulacionDto.codigoMotivo == 1)
        motivoString = "FACTURA MAL EMITIDA";
      if (facturaAnulacionDto.codigoMotivo == 3)
        motivoString = "DATOS DE EMISIÓN INCORRECTOS";
      if (facturaAnulacionDto.codigoMotivo == 4)
        motivoString = "FACTURA DEVUELTA";

      let puntosDeventas = await this.apiIllaService.obtenerPuntosVentas();
      if (!puntosDeventas || puntosDeventas.length == 0) {
        throw new Error(`no se pudo obtener puntos de venats de SIAT`);
      }
      let payload = {
        identificador: puntosDeventas[0].identificador,
        identificadorFactura: facturaAnulacionDto.identificador,
        nit: facturaAnulacionDto.nit,
        codigoPuntoVenta: puntosDeventas[0].codigoPuntoVenta,
        codigoSucursal: puntosDeventas[0].codigoSucursal,
        codigoMotivo: facturaAnulacionDto.codigoMotivo,
        cuf: facturaAnulacionDto.cuf,
        motivo: motivoString,
      };
      let resAnulacion =
        await this.apiIllaService.facturaAlquilerAnulacion(payload);
      if (!resAnulacion.status) {
        throw new Error(resAnulacion.message);
      }

      // buscar ID de factura

      // registro en BD
      await this.cotelFacturaAnulacionRepository.create({
        /*factura_emitida_caja_id:0,
        comprobante_factura:0,*/
        identificador: facturaAnulacionDto.identificador,
        nit: facturaAnulacionDto.nit,
        codigo_motivo: facturaAnulacionDto.codigoMotivo,
        cuf: facturaAnulacionDto.cuf,
        obs: resAnulacion.message,
        estado_id: 1000,
      });

      return {
        message: resAnulacion.message,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

  async facturaTelcomAnulacion(facturaAnulacionDto: FacturaAnulacionDto) {
    try {
      // es factura caja
      let factura_emitida_caja_id = null;
      let comprobante_factura = null;

      let facturasEmitidoPorQrQuickpay = await this.cotelComprobanteFacturaRepository.findByFilters({ cuf: facturaAnulacionDto.cuf, estado_id: 1000, });
      if (facturasEmitidoPorQrQuickpay.length == 1) {
        comprobante_factura = facturasEmitidoPorQrQuickpay[0].comprobante_factura;
      }
      let facturasEmitidosEnCajaCotel = await this.cotelFacturasEmitidasCajaRepository.findByFilters({cuf: facturaAnulacionDto.cuf,estado_id: 1000,});
      if (facturasEmitidosEnCajaCotel.length == 1) {
        factura_emitida_caja_id = facturasEmitidosEnCajaCotel[0].factura_emitida_caja_id;
      }

      let motivoString = "";
      if (facturaAnulacionDto.codigoMotivo == 1)
        motivoString = "FACTURA MAL EMITIDA";
      if (facturaAnulacionDto.codigoMotivo == 3)
        motivoString = "DATOS DE EMISIÓN INCORRECTOS";
      if (facturaAnulacionDto.codigoMotivo == 4)
        motivoString = "FACTURA DEVUELTA";

      let puntosDeventas = await this.apiIllaService.obtenerPuntosVentas();
      if (!puntosDeventas || puntosDeventas.length == 0) {
        throw new Error(`no se pudo obtener puntos de venats de SIAT`);
      }
      let payload = {
        identificador: puntosDeventas[0].identificador,
        identificadorFactura: facturaAnulacionDto.identificador,
        nit: facturaAnulacionDto.nit,
        codigoPuntoVenta: puntosDeventas[0].codigoPuntoVenta,
        codigoSucursal: puntosDeventas[0].codigoSucursal,
        codigoMotivo: facturaAnulacionDto.codigoMotivo,
        cuf: facturaAnulacionDto.cuf,
        motivo: motivoString,
      };
      let resAnulacion =
        await this.apiIllaService.facturaTelcomAnulacion(payload);
      if (!resAnulacion.status) {
        throw new Error(resAnulacion.message);
      }

      // registro en BD
      await this.cotelFacturaAnulacionRepository.create({
        factura_emitida_caja_id:factura_emitida_caja_id,
        comprobante_factura:comprobante_factura,
        identificador: facturaAnulacionDto.identificador,
        nit: facturaAnulacionDto.nit,
        codigo_motivo: facturaAnulacionDto.codigoMotivo,
        cuf: facturaAnulacionDto.cuf,
        obs: resAnulacion.message,
        estado_id: 1000,
      });

      return {
        message: resAnulacion.message,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }
}
