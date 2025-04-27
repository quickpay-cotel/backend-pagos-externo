import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { IsValidAppKey } from 'src/common/decorators/is-valid-appkey.decorator';

export class CajaConciliacionNotaDto {

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
export class ConciliacionCajaDetalleConciliacionDto {
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
  montoOriginal: number;

  @IsNumber()
  montoFinal: number;

  @IsNumber()
  montoConciliado: number;
}
export class ConciliacionCajaDetalleOrigenDto {

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

  @IsString()
  unidadMedidaDescripcion: string;

  @IsNumber()
  precioUnitario: number;

  @IsNumber()
  montoDescuento: number;

  @IsNumber()
  subTotal: number;

  @IsNumber()
  codigoDetalleTransaccion: number;
}