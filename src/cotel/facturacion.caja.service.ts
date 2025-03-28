import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { IDatabase } from "pg-promise";
import { FacturaDeudaDto } from "./factura.caja.dto/factura-caja-deuda.dto";
import { ApiIllaService } from "src/common/external-services/api.illa.service";
import { CotelComprobanteFacturaRepository } from "src/common/repository/cotel.comprobante_factura.repository";
import { CotelFacturasCajaRepository } from "src/common/repository/cotel.facturas_caja.repository";
import { CotelFacturaDetalleCajaRepository } from "src/common/repository/cotel.factura_detalle_caja.repository";
import { CotelFacturasEmitidasCajaRepository } from "src/common/repository/cotel.facturas_emitidas_caja.repository";
import * as fs from 'fs';
import * as path from 'path';

import { FuncionesFechas } from "src/common/utils/funciones.fechas";
import { CajaConciliacionNotaDto } from "./factura.caja.dto/caja-conciliacion-nota.dto";
import { CajaNotaCreditoDebitoDto } from "./factura.caja.dto/caja-nota-credito-debito.dto";

@Injectable()
export class FacturacionCajaService {
  private storePath = path.posix.join(process.cwd(), 'store');

  constructor(private readonly apiIllaService: ApiIllaService,
    private readonly cotelComprobanteFacturaRepository: CotelComprobanteFacturaRepository,
    private readonly cotelFacturasCajaRepository: CotelFacturasCajaRepository,
    private readonly cotelFacturaDetalleCajaRepository: CotelFacturaDetalleCajaRepository,
    private readonly cotelFacturasEmitidasCajaRepository: CotelFacturasEmitidasCajaRepository,
  ) {
  }
  async facturaTelcom(facturaDeudaDto: FacturaDeudaDto) {
    try {

      // veriicar si el identificador ya ha generado factura
      let lstFacturaEmitida = await this.cotelFacturasCajaRepository.facturaEmitidaByIdentificador(facturaDeudaDto.identificador);
      if (lstFacturaEmitida && lstFacturaEmitida.length) {
       return {
        respuesta:'REPUESTA_EXISTE_FACTURA_TELECOM', 
        mensaje:'El '+facturaDeudaDto.identificador+' ya fue generado factura'
       }
      }

      let productos = await this.apiIllaService.obtenerProductos();
      if (!productos || productos.length == 0) {
        throw new Error(`no se pudo obtener productos de SIAT`);
      }
      let puntosDeventas = await this.apiIllaService.obtenerPuntosVentas();
      if (!puntosDeventas || puntosDeventas.length == 0) {
        throw new Error(`no se pudo obtener puntos de venats de SIAT`);
      }

      let nroFactura = await this.cotelComprobanteFacturaRepository.findNroFactura();

      let tipoDoc = 0;
      if (facturaDeudaDto.codigo_tipo_documento == 'CI') tipoDoc = 1;
      if (facturaDeudaDto.codigo_tipo_documento == 'NIT') tipoDoc = 5;

      let datosFactura = {
        identificador: puntosDeventas[0].identificador,
        //identificador: facturaDeudaDto.identificador, // cotelenvia este valor
        tipoEnvioId: 38, //factura individual
        codigoDocumentoSector: parseInt(facturaDeudaDto.codigo_documento_sector),
        codigoPuntoVenta: puntosDeventas[0].codigoPuntoVenta,
        codigoSucursal: puntosDeventas[0].codigoSucursal,
        //codigoSucursal: 69,
        municipio: "La Paz", //lugar de emisión de la factura
        telefono: "78873940", //nro de celular del punto de venta
        numeroFactura: parseInt(nroFactura), //ricardo dijo q se reinice por año
        nombreRazonSocial: facturaDeudaDto.razon_social, //string
        codigoTipoDocumentoIdentidad: tipoDoc, //int
        numeroDocumento: facturaDeudaDto.numero_documento,  //string
        codigoCliente: facturaDeudaDto.codigo_cliente,
        correoElectronico: facturaDeudaDto.email_cliente, //string
        codigoMetodoPago: 1, // EFECTIVO
        codigoMoneda: 1,  // BS
        tipoCambio: 1, // CUANDO ES BS SIEMPRE MANDAR 1
        montoGiftCard: 0,  // SI ES ATRJETA RECIEN MANDAR VALOR
        descuentoAdicional: facturaDeudaDto.descuento_global,
        codigoExcepcion: false, // El NIT debe ser validado en la transacción de emisión
        usuario: "QUICKPAY-CAJAS",
        details: []
      }
      let listaDetalle = [];
      for (let deuda of facturaDeudaDto.lineas_detalle_deuda) {
        let productoSIAT = productos.filter(r => r.codProductoEmpresa == deuda.codigo_producto);
        if (productoSIAT.length != 1) {
          throw new Error(`el producto ${deuda.codigo_producto} no se encuentra registrado en SIAT`);
        }
        listaDetalle.push({
          empresaProductoId: productoSIAT[0].empresaProductoId, // el SIN siempre va retornar un producto
          cantidad: deuda.cantidad,
          descripcionAdicional: deuda.concepto,
          precioUnitario: deuda.costo_unitario,
          montoDescuento: deuda.descuento_unitario
        })
      }
      datosFactura.details = listaDetalle;
      let resDataTelCom = await this.apiIllaService.generarFacturaTelcom(datosFactura);
      let resFacturacion = resDataTelCom.result;
      // almacenamos facturas
      const filePathPdf = path.join(this.storePath + '/facturas_caja', 'factura-' + facturaDeudaDto.identificador + '_' + FuncionesFechas.generarNumeroUnico() + '.pdf');
      const filePathXml = path.join(this.storePath + '/facturas_caja', 'factura-' + facturaDeudaDto.identificador + '_' + FuncionesFechas.generarNumeroUnico() + '.xml');
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

      // registrar los datos de factura
      const facturasCajas = await this.cotelFacturasCajaRepository.create(
        {
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
          estado_id: 1000
        }
      );
      for (let deuda of facturaDeudaDto.lineas_detalle_deuda) {
        const facturasDetalleCajas = await this.cotelFacturaDetalleCajaRepository.create(
          {
            factura_caja_id: facturasCajas.factura_caja_id,
            concepto: deuda.concepto,
            cantidad: deuda.cantidad,
            costo_unitario: deuda.costo_unitario,
            descuento_unitario: deuda.descuento_unitario,
            codigo_producto: deuda.codigo_producto,
            ignora_factura: deuda.ignora_factura,
            estado_id: 1000
          }
        );
      }

      // REGISTRA FACTURA
      await this.cotelFacturasEmitidasCajaRepository.create({
        factura_caja_id: facturasCajas.factura_caja_id,
        identificador: resFacturacion.identificador,
        xml_ruta: filePathXml,
        pdf_ruta: filePathPdf,
        url_verificacion: resFacturacion.urlVerificacion,
        url_verificacion_sin: resFacturacion.urlVerificacionSin,
        leyenda: resFacturacion.leyenda,
        leyenda_emision: resFacturacion.leyendaEmision,
        cufd: resFacturacion.cufd,
        cuf: resFacturacion.cuf,
        fecha_emision: resFacturacion.fechaEmision,
        estado_id: 1000
      });

      return {
        respuesta:'RESPUESTA_FACTURA_TELECOMUNICACIONES', 
        mensaje:resDataTelCom.message,
        datosFactura:{
          identificador:resFacturacion.identificador,
          xml:resFacturacion.xml,
          pdf:resFacturacion.pdf,
          urlVerificacion:resFacturacion.urlVerificacion,
          urlVerificacionSin:resFacturacion.urlVerificacionSin,
          leyenda:resFacturacion.leyenda,
          leyendaEmision:resFacturacion.leyendaEmision,
          cufd:resFacturacion.cufd,
          cuf:resFacturacion.cuf,
          fechaEmision:resFacturacion.fechaEmision
        }
      }

    } catch (error) {
      
      throw new HttpException(error, HttpStatus.NOT_FOUND);

    }
  }

  async facturaAlquiler(facturaDeudaDto: FacturaDeudaDto) {
    try {

      // veriicar si el identificador ya ha generado factura
      let lstFacturaEmitida = await this.cotelFacturasCajaRepository.facturaEmitidaByIdentificador(facturaDeudaDto.identificador);
      if (lstFacturaEmitida && lstFacturaEmitida.length) {
        //throw new Error(`REPUESTA_EXISTE_FACTURA_TELECOM`);
        return {
          respuesta:'REPUESTA_EXISTE_FACTURA_TELECOM', 
         }

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

      let nroFactura = await this.cotelComprobanteFacturaRepository.findNroFactura();
      nroFactura = String(nroFactura).split('-')[1]
      let tipoDoc = 0;
      if (facturaDeudaDto.codigo_tipo_documento == 'CI') tipoDoc = 1;
      if (facturaDeudaDto.codigo_tipo_documento == 'NIT') tipoDoc = 5;

      let datosFactura = {
        identificador: puntosDeventas[0].identificador,
        //identificador: sucursales[0].identificador,
        
        //identificador: facturaDeudaDto.identificador, // cotelenvia este valor
        tipoEnvioId: 38, //factura individual
        codigoDocumentoSector: parseInt(facturaDeudaDto.codigo_documento_sector),
        codigoPuntoVenta: puntosDeventas[0].codigoPuntoVenta,
        codigoSucursal: puntosDeventas[0].codigoSucursal,
        //codigoSucursal: 69,
        municipio: "La Paz", //lugar de emisión de la factura
        telefono: "78873940", //nro de celular del punto de venta
        numeroFactura: parseInt(nroFactura), //ricardo dijo q se reinice por año
        nombreRazonSocial: facturaDeudaDto.razon_social, //string
        periodoFacturado:  " - ", // cotel no envia
        //periodoFacturado: "SEPTIEMBRE 2021", // cotel debe mandar eso
        codigoTipoDocumentoIdentidad: tipoDoc, //int
        numeroDocumento: facturaDeudaDto.numero_documento,  //string
        codigoCliente: facturaDeudaDto.codigo_cliente,
        correoElectronico: facturaDeudaDto.email_cliente, //string
        codigoMetodoPago: 1, // EFECTIVO
        codigoMoneda: 1,  // BS
        tipoCambio: 1, // CUANDO ES BS SIEMPRE MANDAR 1
        descuentoAdicional: facturaDeudaDto.descuento_global,
        codigoExcepcion: false, // El NIT debe ser validado en la transacción de emisión
        usuario: "QUICKPAY-CAJAS",
        details: []
      }
      let listaDetalle = [];
      for (let deuda of facturaDeudaDto.lineas_detalle_deuda) {
        let productoSIAT = productos.filter(r => r.codProductoEmpresa == deuda.codigo_producto);
        if (productoSIAT.length != 1) {
          throw new Error(`el producto ${deuda.codigo_producto} no se encuentra registrado en SIAT`);
        }
        listaDetalle.push({
          empresaProductoId: productoSIAT[0].empresaProductoId, // el SIN siempre va retornar un producto
          cantidad: deuda.cantidad,
          descripcionAdicional: deuda.concepto,
          precioUnitario: deuda.costo_unitario,
          montoDescuento: deuda.descuento_unitario
        })
      }
      datosFactura.details = listaDetalle;
      let resDataAlquiler =  await this.apiIllaService.generarFacturaAlquiler(datosFactura);
      let resFacturacion =  resDataAlquiler.result;
      // almacenamos facturas
      const filePathPdf = path.join(this.storePath + '/facturas_caja', 'factura-' + facturaDeudaDto.identificador + '_' + FuncionesFechas.generarNumeroUnico() + '.pdf');
      const filePathXml = path.join(this.storePath + '/facturas_caja', 'factura-' + facturaDeudaDto.identificador + '_' + FuncionesFechas.generarNumeroUnico() + '.xml');
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

      // registrar los datos de factura
      const facturasCajas = await this.cotelFacturasCajaRepository.create(
        {
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
          estado_id: 1000
        }
      );
      for (let deuda of facturaDeudaDto.lineas_detalle_deuda) {
        const facturasDetalleCajas = await this.cotelFacturaDetalleCajaRepository.create(
          {
            factura_caja_id: facturasCajas.factura_caja_id,
            concepto: deuda.concepto,
            cantidad: deuda.cantidad,
            costo_unitario: deuda.costo_unitario,
            descuento_unitario: deuda.descuento_unitario,
            codigo_producto: deuda.codigo_producto,
            ignora_factura: deuda.ignora_factura,
            estado_id: 1000
          }
        );
      }

      // REGISTRA FACTURA
      await this.cotelFacturasEmitidasCajaRepository.create({
        factura_caja_id: facturasCajas.factura_caja_id,
        identificador: resFacturacion.identificador,
        xml_ruta: filePathXml,
        pdf_ruta: filePathPdf,
        url_verificacion: resFacturacion.urlVerificacion,
        url_verificacion_sin: resFacturacion.urlVerificacionSin,
        leyenda: resFacturacion.leyenda,
        leyenda_emision: resFacturacion.leyendaEmision,
        cufd: resFacturacion.cufd,
        cuf: resFacturacion.cuf,
        fecha_emision: resFacturacion.fechaEmision,
        estado_id: 1000
      });

      return {
        respuesta:'RESPUESTA_FACTURA_TELECOMUNICACIONES', 
        mensaje:resDataAlquiler.message,
        datosFactura:{
          identificador:resFacturacion.identificador,
          xml:resFacturacion.xml,
          pdf:resFacturacion.pdf,
          urlVerificacion:resFacturacion.urlVerificacion,
          urlVerificacionSin:resFacturacion.urlVerificacionSin,
          leyenda:resFacturacion.leyenda,
          leyendaEmision:resFacturacion.leyendaEmision,
          cufd:resFacturacion.cufd,
          cuf:resFacturacion.cuf,
          fechaEmision:resFacturacion.fechaEmision
        }
      }

    } catch (error) {
      
      //throw new HttpException(error?.message=='REPUESTA_EXISTE_FACTURA_TELECOM'?error.message:'RESPUESTA_ERROR_FACTURA', HttpStatus.NOT_FOUND);
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

  async notasConciliacion (cajaConciliacionNotaDto: CajaConciliacionNotaDto){
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
      for(let objDetalleOrigen of cajaConciliacionNotaDto.detallesOrigen){
        detallesOrigen.push({
          nroItem:objDetalleOrigen.nroItem,
          actividadEconomica:objDetalleOrigen.actividadEconomica,
          codigoProductoSin:objDetalleOrigen.codigoProductoSin,
          codigoProducto:objDetalleOrigen.codigoProducto,
          descripcion:objDetalleOrigen.descripcion,
          cantidad:objDetalleOrigen.cantidad,
          unidadMedida:objDetalleOrigen.unidadMedida,
          unidadMedidaDescripcion:objDetalleOrigen.unidadMedidaDescripcion,
          precioUnitario:objDetalleOrigen.precioUnitario,
          montoDescuento:objDetalleOrigen.montoDescuento,
          subTotal:objDetalleOrigen.subTotal,
          codigoDetalleTransaccion:objDetalleOrigen.codigoDetalleTransaccion
        });
      }
      let detallesConciliacion = [];
      for(let objDetalleConciliacion of cajaConciliacionNotaDto.detallesConciliacion){
        detallesConciliacion.push({
          nroItem:objDetalleConciliacion.nroItem,
          actividadEconomica:objDetalleConciliacion.actividadEconomica,
          codigoProductoSin:objDetalleConciliacion.codigoProductoSin,
          codigoProducto:objDetalleConciliacion.codigoProducto,
          descripcion:objDetalleConciliacion.descripcion,
          montoOriginal:objDetalleConciliacion.montoOriginal,
          montoFinal:objDetalleConciliacion.montoFinal,
          montoConciliado:objDetalleConciliacion.montoConciliado
        });
      }
      let notasConciliacion = {
        identificador: cajaConciliacionNotaDto.identificador,
        //identificador: puntosDeventas[0].identificador,
        codigoDocumentoSector: cajaConciliacionNotaDto.codigoDocumentoSector,
        codigoPuntoVenta:cajaConciliacionNotaDto.codigoPuntoVenta,
        //codigoPuntoVenta:puntosDeventas[0].codigoPuntoVenta,
        codigoSucursal: cajaConciliacionNotaDto.codigoSucursal,
        //codigoSucursal: puntosDeventas[0].codigoSucursal,
        municipio:cajaConciliacionNotaDto.municipio,
        telefono:cajaConciliacionNotaDto.telefono,
        numeroNota:cajaConciliacionNotaDto.numeroNota,
        nombreRazonSocial:cajaConciliacionNotaDto.nombreRazonSocial,
        codigoTipoDocumentoIdentidad:cajaConciliacionNotaDto.codigoTipoDocumentoIdentidad,
        numeroDocumento:cajaConciliacionNotaDto.numeroDocumento,
        complemento:"", // cotel no manda ese dato
        codigoCliente:cajaConciliacionNotaDto.codigoCliente,
        correoElectronico:cajaConciliacionNotaDto.correoElectronico,
        codigoDocumentoSectorOriginal:cajaConciliacionNotaDto.codigoDocumentoSectorOriginal,
        numeroFactura:cajaConciliacionNotaDto.numeroFactura,
        numeroAutorizacionCuf:cajaConciliacionNotaDto.numeroAutorizacionCuf,
        fechaEmisionFactura:cajaConciliacionNotaDto.fechaEmisionFactura,
        montoTotalOriginal:cajaConciliacionNotaDto.montoTotalOriginal,
        montoDescuentoAdicional:cajaConciliacionNotaDto.montoDescuentoAdicional,
        codigoExcepcion:cajaConciliacionNotaDto.codigoExcepcion,
        usuario:cajaConciliacionNotaDto.usuario,
        detallesOrigen:detallesOrigen,
        detallesConciliacion:detallesConciliacion
      }

      let resNotasConciliacion = await this.apiIllaService.noteConciliacion(notasConciliacion);
      return resNotasConciliacion;

    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }
  
  async notasCreditoDebito (cajaNotaCreditoDebitoDto: CajaNotaCreditoDebitoDto){
    try {

      let productos = await this.apiIllaService.obtenerProductos();
      if (!productos || productos.length == 0) {
        throw new Error(`no se pudo obtener productos de SIAT`);
      }
      let puntosDeventas = await this.apiIllaService.obtenerPuntosVentas();
      if (!puntosDeventas || puntosDeventas.length == 0) {
        throw new Error(`no se pudo obtener puntos de venats de SIAT`);
      }

      let detalles = [];
      for(let objDetalle of cajaNotaCreditoDebitoDto.details){
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
          codigoDetalleTransaccion: objDetalle.codigoDetalleTransaccion
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
        codigoTipoDocumentoIdentidad: cajaNotaCreditoDebitoDto.codigoTipoDocumentoIdentidad,
        numeroDocumento: cajaNotaCreditoDebitoDto.numeroDocumento,
        codigoCliente: cajaNotaCreditoDebitoDto.codigoCliente,
        correoElectronico: cajaNotaCreditoDebitoDto.correoElectronico,
        codigoDocumentoSectorOriginal: cajaNotaCreditoDebitoDto.codigoDocumentoSectorOriginal,
        numeroFactura: cajaNotaCreditoDebitoDto.numeroFactura,
        numeroAutorizacionCuf: cajaNotaCreditoDebitoDto.numeroAutorizacionCuf,
        fechaEmisionFactura: cajaNotaCreditoDebitoDto.fechaEmisionFactura,
        montoTotalOriginal: cajaNotaCreditoDebitoDto.montoTotalOriginal,
        montoDescuentoAdicional: cajaNotaCreditoDebitoDto.montoDescuentoAdicional,
        codigoExcepcion: cajaNotaCreditoDebitoDto.codigoExcepcion,
        usuario: cajaNotaCreditoDebitoDto.usuario,
        details:detalles
      }

      let resNotasCreditoDebito = await this.apiIllaService.noteCreditoDebito(notasCreditoDebito);
      let resFacturaCreditoDebito= resNotasCreditoDebito.result;
      return {
        respuesta:'NOTA_DE_DEBITO_RESPUESTA_EMISION', 
        mensaje:resNotasCreditoDebito.message,
        datosFactura:{
          identificador:resFacturaCreditoDebito.identificador,
          xml:resFacturaCreditoDebito.xml,
          pdf:resFacturaCreditoDebito.pdf,
          urlVerificacion:resFacturaCreditoDebito.urlVerificacion,
          urlVerificacionSin:resFacturaCreditoDebito.urlVerificacionSin,
          leyenda:resFacturaCreditoDebito.leyenda,
          leyendaEmision:resFacturaCreditoDebito.leyendaEmision,
          cufd:resFacturaCreditoDebito.cufd,
          cuf:resFacturaCreditoDebito.cuf,
          fechaEmision:resFacturaCreditoDebito.fechaEmision
        }
      }

    } catch (error) {
      throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }
}
