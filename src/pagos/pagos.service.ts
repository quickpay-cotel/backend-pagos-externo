import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CreateGeneraQrDto } from "./dto/create-qr.generado.dto";
import { ApiSipService } from "./api.sip.service";
import { ArchivosRepository } from "src/common/repository/archivos.repository";
import { DeudasClientesRepository } from "src/common/repository/deudas_clientes.repository";
import { QrGerenadoRepository } from "src/common/repository/qr_generado.repository";
import { IDatabase } from "pg-promise";
import { v4 as uuidv4 } from 'uuid';
import { FuncionesFechas } from 'src/common/utils/funciones.fechas';
import { ConfirmaPagoQrDto } from "./dto/confirma-pago-qr.dto";
import { TransaccionesCobrosRepository } from "src/common/repository/transacciones_cobros.repository";
import { EntidadesRepository } from "src/common/repository/entidades.repository";
import { DatosConfirmadoQrRepository } from "src/common/repository/datosconfirmado_qr.repository";
const Hashids = require('hashids/cjs');  // Esto es para cargar el módulo en formato CommonJS
import { NotificationsGateway } from './../notificaciones/notifications.gateway';
import { CorreoService } from "src/correo/correo.service";
import { SegUsuariosRepository } from "src/common/repository/seg_usuarios.repository";
import { CobrosClientesRepository } from "src/common/repository/cobros_clientes.repository";
import { HistoricosDeudasRepository } from "src/common/repository/historicos_deudas.repository";

@Injectable()
export class PagosService {

    constructor(
        private readonly apiSipService: ApiSipService,
        private readonly archivosRepository: ArchivosRepository,
        private readonly deudasClientesRepository: DeudasClientesRepository,
        private readonly qrGerenadoRepository: QrGerenadoRepository,
        private readonly datosConfirmadoQrRepository: DatosConfirmadoQrRepository,
        private readonly transaccionesCobrosRepository: TransaccionesCobrosRepository,
        private readonly entidadesRepository: EntidadesRepository,
        private readonly segUsuariosRepository: SegUsuariosRepository,
        private readonly cobrosClientesRepository: CobrosClientesRepository,
        private readonly notificationsGateway: NotificationsGateway,
        private readonly historicosDeudasRepository: HistoricosDeudasRepository,
        private readonly correoService: CorreoService,
        @Inject('DB_CONNECTION') private db: IDatabase<any>
    ) { } // Inyección de dependencia

    async generaQr(createGeneraQrDto: CreateGeneraQrDto) {

        try {
            
            // genera QR
            let dataGeneraQr = {
                ...createGeneraQrDto,
                fechaVencimiento: FuncionesFechas.formatDateToDDMMYYYY(new Date()),
                alias: uuidv4(),
                callback: process.env.SIP_CALLBACK,
                tipoSolicitud: "API",
                unicoUso: "true"
            }
            const datosQr = await this.apiSipService.generaQr(dataGeneraQr);
            if (!datosQr.imagenQr) throw new Error('error al generar QR');
            let archivoId = 0;
            // TRANSACTIONAL................
            const resultado = await this.db.tx(async t => {
                //registramos archivo manual
                let resArchivo = await this.archivosRepository.createManualFile({
                    entidad_id: 1024,
                    nombre: 'ARCHIVO MANUAL',
                    usuario_creacion: 1003
                }, t);
                archivoId = resArchivo.archivo_id;
                if (!resArchivo)  throw new Error('nose pudo registrar deuda 1'); 
                // registramos deudas
                let resDeudasCliente = await this.deudasClientesRepository.create({
                    archivo_id: resArchivo.archivo_id,
                    nro_registro: 12,
                    codigo_cliente: 90,
                    nombre_cliente: '2323',
                    nro_documento: '23',
                    direccion: 'villa adela',
                    nit: '2323',
                    telefono: '3434',
                    servicio: '4343',
                    tipo_servicio: 'wewewe',
                    periodo: 'wewe',
                    tipo: 'D',
                    concepto: 'dsds',
                    cantidad: 0,
                    monto_unitario: 0,
                    sub_total: 0,
                    tipo_comprobante: true,
                    periodo_cabecera: 'Noviembre 2024',
                    es_postpago: true,
                    codigo_actividad_economica: '731000',
                    correo_cliente: 'alvaroquispesegales@hotmail.com',
                    codigo_producto: 'UDB2',
                    codigo_producto_sin: '83611'

                }, t)
                if (!resDeudasCliente) throw new Error('nose pudo registrar deuda 2'); // 

                // registramos datos QR que se envio a BISA
                await this.qrGerenadoRepository.create({
                    deuda_cliente_id: resDeudasCliente.deuda_cliente_id,
                    alias: dataGeneraQr.alias,
                    callback: dataGeneraQr.callback,
                    detalle_glosa: dataGeneraQr.detalleGlosa,
                    monto: dataGeneraQr.monto,
                    moneda: dataGeneraQr.moneda,
                    fecha_vencimiento: dataGeneraQr.fechaVencimiento,
                    tipo_solicitud: dataGeneraQr.tipoSolicitud,
                    unico_uso: dataGeneraQr.unicoUso,
                    fecha_registro: new Date(),
                    estado: 'ACTIVO'
                }, t);

                return {
                    imagenQr: datosQr.imagenQr,
                    idQr: datosQr.idQr,
                    fechaVencimiento: datosQr.fechaVencimiento,
                    bancoDestino: datosQr.bancoDestino,
                    cuentaDestino: datosQr.cuentaDestino,
                    idTransaccion: datosQr.idTransaccion,
                    alias: dataGeneraQr.alias // esta valor no retorna BISA
                }
            });

            await this.archivosRepository.canbiarEstado(archivoId, 'PROCESAR');
            return resultado;

        } catch (error) {

            throw new HttpException(error, HttpStatus.BAD_REQUEST);
        }
    }

    async confirmaPagoQr(confirmaPagoQrDto: ConfirmaPagoQrDto) {
        const hashids = new Hashids(process.env.HASHIDS_CLAVE);

        try {

            // verificar QR generado por quickpay
            let qrGenerado = await this.qrGerenadoRepository.findByAlias(confirmaPagoQrDto.alias)
            if (qrGenerado.length != 1) throw new Error('EL QR no se ha generado desde la Empresa');
            qrGenerado = qrGenerado[0];
            // Notificar el pago via websocket
            if (Number(qrGenerado.monto) != confirmaPagoQrDto.monto) throw new Error('Monto no es igual');

            // verificar que el QR tenga una sola deuda, ricardo indica q de cotel sera 1 deuda  para una factura
            let deudaCliente = await this.deudasClientesRepository.findByDeudaClienteId(qrGenerado.deuda_cliente_id)
            if (deudaCliente.length != 1) throw new Error(`el alias ${confirmaPagoQrDto.alias} No cuenta con deuda`);
            deudaCliente = deudaCliente[0];

            let insertDatosConfirmadoQr = {
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
                fecha_registro: new Date(),
                estado: 'ACTIVO',
                codigo_pago: hashids.encode(qrGenerado.deuda_cliente_id)
            };
            let datosConfirmadoQr = await this.datosConfirmadoQrRepository.create(insertDatosConfirmadoQr);

            // notificamos pagos por websoket
            this.notificationsGateway.sendNotificationToAll(`${confirmaPagoQrDto.alias}|pagos realizado con exito`);

            // notificar por correo
            let archivo = await this.archivosRepository.findByArchivoId(deudaCliente.archivo_id);
            let entidad = await this.entidadesRepository.findById(archivo.entidad_id);
            let recaudador = await this.segUsuariosRepository.findRecaudadorByUsuariod(process.env.US_QUICKPAY);

            return await this.db.tx(async t => {

                // registramos transaccion
                let insertTransaccionCobro = {
                    entidad_id: archivo.entidad_id,
                    archivo_id: archivo.archivo_id,
                    recaudador_id: recaudador.recaudador_id,
                    metodo_cobro_id: process.env.METODO_COBRO_ID,
                    tipo_servicio: deudaCliente.tipo_servicio,
                    servicio: deudaCliente.servicio,
                    periodo: deudaCliente.periodo,
                    codigo_cliente: deudaCliente.codigo_cliente,
                    total_deuda: deudaCliente.sub_total,
                    comision: 1, // hayq  hablar con ricardo por q se ha definido 1?
                    comision_recaudacion: 1,  // hayq  hablar con ricardo por q se ha definido 1?
                    nro_documento_cliente_pago: deudaCliente.nro_documento,
                    nombre_cliente_pago: deudaCliente.nombre_cliente,
                    nro_documento_cliente_archivo: deudaCliente.nro_documento,
                    nombre_cliente_archivo: deudaCliente.nombre_cliente,
                    usuario_creacion: process.env.US_QUICKPAY,
                    fecha_creacion: new Date(),
                    transaccion: 'CREAR',
                    modalidad_facturacion_id: entidad.modalidad_facturacion_id,
                    codigo_actividad_economica: deudaCliente.codigo_actividad_economica,
                    correo_cliente: deudaCliente.correo_cliente,
                    datosconfirmado_qr_id: datosConfirmadoQr.datosconfirmado_qr_id,
                    deuda_cliente_id: deudaCliente.deuda_cliente_id
                }
                let transaccionCobro = await this.transaccionesCobrosRepository.create(insertTransaccionCobro);
                let historicoDeudaCliente = await this.historicosDeudasRepository.findByDeudaClienteId(qrGenerado.deuda_cliente_id);
                let insertCobroCliente = {
                    transaccion_cobro_id: transaccionCobro.transaccion_cobro_id,
                    historico_deuda_id: historicoDeudaCliente.historico_deuda_id,
                    archivo_id: archivo.archivo_id,
                    nro_registro: deudaCliente.nro_registro,
                    codigo_cliente: deudaCliente.codigo_cliente,
                    nombre_cliente: deudaCliente.nombre_cliente,
                    nro_documento: deudaCliente.nro_documento,
                    tipo_servicio: deudaCliente.tipo_servicio,
                    servicio: deudaCliente.servicio,
                    periodo: deudaCliente.periodo,
                    tipo: deudaCliente.tipo,
                    cantidad: deudaCliente.cantidad,
                    concepto: deudaCliente.concepto,
                    monto_unitario: deudaCliente.monto_unitario,
                    dato_extra: deudaCliente.dato_extra,
                    tipo_comprobante: deudaCliente.tipo_comprobante,
                    periodo_cabecera: deudaCliente.periodo_cabecera,
                    direccion: deudaCliente.direccion,
                    nit: deudaCliente.nit,
                    telefono: deudaCliente.telefono,
                    sub_total: deudaCliente.sub_total,
                    es_postpago: deudaCliente.es_postpago,
                    monto_modificado: false,
                    usuario_creacion: process.env.US_QUICKPAY,
                    fecha_creacion: new Date(),
                    transaccion: 'COBRAR'
                }
                await this.cobrosClientesRepository.create(insertCobroCliente);
                await this.historicosDeudasRepository.update({ estado: 'COBRADO' }, historicoDeudaCliente.historico_deuda_id);
                await this.deudasClientesRepository.delete(deudaCliente.deuda_cliente_id)

                return {
                    codigo: "0000",
                    mensaje: "Registro Exitoso"
                }
            });

        } catch (error) {
            // se suguiere al,acenar LOGSSS deleste error
            throw new HttpException(error, HttpStatus.BAD_REQUEST);
        }
    }
}

