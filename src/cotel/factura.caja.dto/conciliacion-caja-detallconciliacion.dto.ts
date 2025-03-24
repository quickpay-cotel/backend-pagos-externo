import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
export class ConciliacionCajaDetalleConciliacionDto{
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