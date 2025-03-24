import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ConciliacionCajaDetalleConciliacionDto } from './conciliacion-caja-detallconciliacion.dto';
import { ConciliacionCajaDetalleOrigenDto } from './conciliacion-caja-detalleorigen.dto';
export class ConciliacionCajaNotasDto{
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
  
    @IsEmail()
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
    @Type(() => ConciliacionCajaDetalleOrigenDto)
    detallesOrigen: ConciliacionCajaDetalleOrigenDto[];
  
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ConciliacionCajaDetalleConciliacionDto)
    detallesConciliacion: ConciliacionCajaDetalleConciliacionDto[];
}