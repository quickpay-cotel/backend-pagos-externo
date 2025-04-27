import { IsString, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsValidAppKey } from 'src/common/decorators/is-valid-appkey.decorator';
export class CajaNotaCreditoDebitoDto {
    
    @IsString()
    @IsValidAppKey({ message: 'El appkey no es válido.' })
    appkey: string;

    @IsString()
    identificador: string;

    @IsNumber()
    codigoDocumentoSector: number;

    @IsNumber()
    codigoPuntoVenta: number;

    @IsNumber()
    codigoSucursal: number;

    @IsString()
    municipio: string;

    @IsString()
    telefono: string;

    @IsNumber()
    numeroNota: number;

    @IsString()
    nombreRazonSocial: string;

    @IsNumber()
    codigoTipoDocumentoIdentidad: number;

    @IsString()
    numeroDocumento: string;

    @IsString()
    codigoCliente: string;

    @IsString()
    correoElectronico: string;

    @IsNumber()
    codigoDocumentoSectorOriginal: number;

    @IsString()
    numeroFactura: string;

    @IsString()
    numeroAutorizacionCuf: string;

    @IsString()
    fechaEmisionFactura: string;

    @IsNumber()
    montoTotalOriginal: number;

    @IsNumber()
    montoDescuentoAdicional: number;

    @IsBoolean()
    codigoExcepcion: boolean;

    @IsString()
    usuario: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NotaCreditoDebitoDetalleDto)
    details: NotaCreditoDebitoDetalleDto[];
}

export class NotaCreditoDebitoDetalleDto {
    @IsNumber()
    nroItem: number;

    @IsString()
    actividadEconomica: string;

    @IsNumber()
    codigoProductoSin: number;

    @IsString()
    codigoProducto: string;

    @IsString()
    descripcion: string;

    @IsNumber()
    cantidad: number;

    @IsNumber()
    unidadMedida: number;

    @IsNumber()
    precioUnitario: number;

    @IsNumber()
    montoDescuento: number;

    @IsNumber()
    subTotal: number;

    @IsNumber()
    codigoDetalleTransaccion: number;
}