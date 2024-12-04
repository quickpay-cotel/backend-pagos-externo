import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CreateGeneraQrDto } from "./dto/create-qr.generado.dto";
import { ApiSipService } from "./api.sip.service";
import { ArchivosRepository } from "src/common/repository/archivos.repository";
import { DeudasClientesRepository } from "src/common/repository/deudas_clientes.repository";
import { QrGerenadoRepository } from "src/common/repository/qr_generado.repository";
import { IDatabase } from "pg-promise";
import { v4 as uuidv4 } from 'uuid';
import { FuncionesFechas } from 'src/common/utils/funciones.fechas';


@Injectable()
export class PagosService {

    constructor(
        private readonly apiSipService: ApiSipService,
        private readonly archivosRepository: ArchivosRepository,
        private readonly deudasClientesRepository: DeudasClientesRepository,
        private readonly qrGerenadoRepository: QrGerenadoRepository,
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
            if (!datosQr.imagenQr) throw new HttpException('error al generar QR', HttpStatus.BAD_REQUEST);

            // TRANSACTIONAL................
            const resultado = await this.db.tx(async t => {
                //registramos archivo manual
                let resArchivo = await this.archivosRepository.createManualFile({
                    entidad_id: 1024,
                    nombre: 'ARCHIVO MANUAL',
                    usuario_creacion: 1003
                },t);
                if (!resArchivo) throw new HttpException('nose pudo registrar deuda 1', HttpStatus.BAD_REQUEST);
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

                },t)
                if (!resDeudasCliente) throw new HttpException('nose pudo registrar deuda 2', HttpStatus.BAD_REQUEST);
                
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
                },t);

                return {
                    imagenQr:datosQr.imagenQr,
                    idQr:datosQr.idQr,
                    fechaVencimiento:datosQr.fechaVencimiento,
                    bancoDestino:datosQr.bancoDestino,
                    cuentaDestino:datosQr.cuentaDestino,
                    idTransaccion:datosQr.idTransaccion,
                    alias:dataGeneraQr.alias // esta valor no retorna BISA
                }
            });
      
            return resultado;
            
        } catch (error) {
            
            // registrar LOG
            throw error;
        }
    }
}

