import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { CreateGeneraQrDto } from "./dto/create-qr.generado.dto";
import { ApiSipService } from "./api.sip.service";
import { ArchivosRepository } from "src/common/repository/archivos.repository";
import { DeudasClientesRepository } from "src/common/repository/deudas_clientes.repository";



@Injectable()
export class PagosService {

    constructor(
        private readonly apiSipService: ApiSipService,
        private readonly archivosRepository: ArchivosRepository,
        private readonly deudasClientesRepository: DeudasClientesRepository
    ) { } // Inyección de dependencia

    async generaQr(createGeneraQrDto: CreateGeneraQrDto) {

        try {


            // genera QR
            /*const datosQr = await this.apiSipService.generaQr(createGeneraQrDto);
            if (!datosQr.imagenQr) {
                throw new HttpException('error al generar QR', HttpStatus.BAD_REQUEST);
            }*/
            //registramos archivo manual
            const resArchivo = await this.archivosRepository.createManualFile({ 
                entidad_id: 1024, 
                nombre: 'ARCHIVO MANUAL', 
                usuario_creacion: 1003 
            });
            // rgistramos deudas
            const resDeudasCliente = this.deudasClientesRepository.create({
                archivo_id:resArchivo.archivo_id,
                nro_registro:12,
                codigo_cliente:90,
                nombre_cliente:'2323',
                nro_documento:'23',
                direccion:'villa adela',
                nit:'2323',
                telefono:'3434',
                servicio:'4343',
                tipo_servicio:'wewewe',
                periodo:'wewe',
                tipo:'D',
                concepto:'dsds',
                cantidad:0,
                monto_unitario:0,
                sub_total:0,
                tipo_comprobante:true, 
                periodo_cabecera:'Noviembre 2024', 
                es_postpago:true, 
                codigo_actividad_economica:'731000', 
                correo_cliente:'alvaroquispesegales@hotmail.com', 
                codigo_producto:'UDB2', 
                codigo_producto_sin:'83611'

            })

            console.log(resDeudasCliente);
            console.log("juaajaj");

            // GENERAR TOKEN


            // REALIZAR EL QR


            // ALMACENAR LA GENERACION DE QR

        } catch (error) {
            throw error;
        }

    }
}