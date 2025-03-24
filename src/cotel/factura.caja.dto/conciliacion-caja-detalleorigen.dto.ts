import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
export class ConciliacionCajaDetalleOrigenDto{

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